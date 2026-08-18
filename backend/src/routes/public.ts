import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';

const router = Router();

// Get landing page statistics (public endpoint - no auth required)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    let productsCount = 0;
    let studentsCount = 0;
    let membersCount = 0;

    try {
      const productsResult = await pool.query(
        'SELECT COUNT(*) as count FROM products'
      );
      productsCount = parseInt(productsResult.rows[0].count) || 0;
    } catch (err) {
      console.error('[public/stats] Failed to get products count:', err);
    }

    try {
      const studentsResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'user' AND email NOT LIKE 'walkin-%@uc-metc-walkin.com'"
      );
      studentsCount = parseInt(studentsResult.rows[0].count) || 0;
    } catch (err) {
      console.error('[public/stats] Failed to get students count:', err);
    }

    try {
      const membersResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE membership_status = 'approved' AND role = 'user' AND email NOT LIKE 'walkin-%@uc-metc-walkin.com'"
      );
      membersCount = parseInt(membersResult.rows[0].count) || 0;
    } catch (err) {
      console.error('[public/stats] Failed to get members count:', err);
    }

    res.json({
      products: productsCount,
      students: studentsCount,
      members: membersCount,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: string }).code) : '';
    console.error('[public/stats] Error:', msg, code ? `(pg ${code})` : '');
    res.json({
      products: 0,
      students: 0,
      members: 0,
    });
  }
});

// Get walk-in or regular order details by receipt number (public endpoint - no auth required)
router.get('/receipt/:receiptNo', async (req: Request, res: Response) => {
  try {
    const { receiptNo } = req.params;
    
    const result = await pool.query(
      `SELECT o.id, o.receipt_no, o.user_id, o.total_amount, o.payment_method, 
              o.reference_number, o.status, o.created_at, o.updated_at,
              o.is_walk_in, o.walk_in_name, o.walk_in_id_number, o.walk_in_course, 
              o.walk_in_contact_number, o.walk_in_membership_status, o.walk_in_year,
              COALESCE(u.email, 'walkin-' || o.receipt_no || '@uc-metc-walkin.com') as email, 
              COALESCE(u.first_name, o.walk_in_name) as first_name, 
              COALESCE(u.last_name, '') as last_name, 
              COALESCE(u.id_number, o.walk_in_id_number) as id_number, 
              COALESCE(u.course, o.walk_in_course) as course, 
              COALESCE(u.year, o.walk_in_year) as year,
              COALESCE(u.membership_status, o.walk_in_membership_status) as membership_status,
              json_agg(json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal,
                'selectedOptions', oi.selected_options,
                'paymentType', oi.payment_type,
                'orderType', oi.order_type,
                'fullPrice', oi.full_price
              )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.receipt_no = $1
       GROUP BY o.id, u.id`,
      [receiptNo]
    );

    if (result.rows.length === 0 || !result.rows[0].id) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const row = result.rows[0];

    // Return only the fields needed to display the receipt —
    // strip PII (id_number, contact number, full email, membership_status)
    // from this unauthenticated public endpoint.
    res.json({
      id: row.id,
      receipt_no: row.receipt_no,
      total_amount: row.total_amount,
      payment_method: row.payment_method,
      reference_number: row.reference_number,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_walk_in: row.is_walk_in,
      // Safe display fields only — no id_number, contact, or membership_status
      first_name: row.first_name,
      walk_in_name: row.walk_in_name,
      walk_in_course: row.walk_in_course,
      walk_in_year: row.walk_in_year,
      course: row.course,
      year: row.year,
      items: row.items,
    });
  } catch (error) {
    console.error('[public/receipt] Error fetching receipt:', error);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});


// Cancel a pending walk-in order by receipt number (public endpoint - kiosk use only)
// Only works for walk-in (is_walk_in = true) orders that are still pending
router.put('/cancel/:receiptNo', async (req: Request, res: Response) => {
  try {
    const { receiptNo } = req.params;

    const orderResult = await pool.query(
      `SELECT id, status, is_walk_in FROM orders WHERE receipt_no = $1`,
      [receiptNo]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (!order.is_walk_in) {
      return res.status(403).json({ error: 'Only walk-in orders can be cancelled via this endpoint' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is no longer pending and cannot be cancelled' });
    }

    await pool.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [order.id]
    );

    res.json({ message: 'Order cancelled successfully', receiptNo });
  } catch (error) {
    console.error('[public/cancel] Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// ── Fallback in-memory maintenance state ──
let inMemoryMaintenanceState = {
  enabled: false,
  message: 'The UC-METC SILMS portal is currently undergoing scheduled maintenance to upgrade our system services. We apologize for any inconvenience.',
  eta: '2 hours',
  updatedAt: new Date().toISOString()
};

// GET /api/public/system-status (Public maintenance status check)
router.get('/system-status', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('maintenance_enabled', 'maintenance_message', 'maintenance_eta', 'maintenance_updated_at')`
    );

    if (result.rows.length > 0) {
      const settingsMap: Record<string, string> = {};
      result.rows.forEach((row: { setting_key: string; setting_value: string }) => {
        settingsMap[row.setting_key] = row.setting_value;
      });

      const dbEnabled = settingsMap['maintenance_enabled'];
      const isEnabled = dbEnabled !== undefined ? dbEnabled === 'true' : inMemoryMaintenanceState.enabled;

      return res.json({
        enabled: isEnabled,
        message: settingsMap['maintenance_message'] || inMemoryMaintenanceState.message,
        eta: settingsMap['maintenance_eta'] !== undefined ? settingsMap['maintenance_eta'] : inMemoryMaintenanceState.eta,
        updatedAt: settingsMap['maintenance_updated_at'] || inMemoryMaintenanceState.updatedAt
      });
    }

    res.json(inMemoryMaintenanceState);
  } catch (error) {
    console.error('[public/system-status] Error fetching maintenance state, using fallback:', error);
    res.json(inMemoryMaintenanceState);
  }
});

// POST /api/public/system-status (Global update endpoint for maintenance mode)
router.post('/system-status', async (req: Request, res: Response) => {
  try {
    const { enabled, message, eta } = req.body;
    const nowIso = new Date().toISOString();

    inMemoryMaintenanceState = {
      enabled: Boolean(enabled),
      message: message || inMemoryMaintenanceState.message,
      eta: eta !== undefined ? eta : inMemoryMaintenanceState.eta,
      updatedAt: nowIso
    };

    try {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, updated_at)
         VALUES 
           ('maintenance_enabled', $1, NOW()),
           ('maintenance_message', $2, NOW()),
           ('maintenance_eta', $3, NOW()),
           ('maintenance_updated_at', $4, NOW())
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [String(Boolean(enabled)), inMemoryMaintenanceState.message, inMemoryMaintenanceState.eta, nowIso]
      );
    } catch (dbErr) {
      console.warn('[public/system-status] DB write warning, using memory fallback:', dbErr);
    }

    res.json(inMemoryMaintenanceState);
  } catch (error) {
    console.error('[public/system-status] Error updating maintenance state:', error);
    res.status(500).json({ error: 'Failed to update system status' });
  }
});

// ── Fallback in-memory locker maintenance state ──
let inMemoryLockerMaintenanceState = {
  enabled: false,
  title: 'Locker Rentals Temporarily Unavailable',
  message: 'The Locker Management team is currently finalizing locker allocations, maintenance inspections, and inventory audits. Locker applications and reservations are temporarily unavailable as of now. Please check back soon or visit the UC-METC Coop Office.',
  eta: 'Finalizing Lockers',
  updatedAt: new Date().toISOString()
};

// GET /api/public/locker-status (Public locker maintenance status check)
router.get('/locker-status', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('locker_maintenance_enabled', 'locker_maintenance_title', 'locker_maintenance_message', 'locker_maintenance_eta', 'locker_maintenance_updated_at')`
    );

    if (result.rows.length > 0) {
      const settingsMap: Record<string, string> = {};
      result.rows.forEach((row: { setting_key: string; setting_value: string }) => {
        settingsMap[row.setting_key] = row.setting_value;
      });

      const dbEnabled = settingsMap['locker_maintenance_enabled'];
      const isEnabled = dbEnabled !== undefined ? dbEnabled === 'true' : inMemoryLockerMaintenanceState.enabled;

      return res.json({
        enabled: isEnabled,
        title: settingsMap['locker_maintenance_title'] || inMemoryLockerMaintenanceState.title,
        message: settingsMap['locker_maintenance_message'] || inMemoryLockerMaintenanceState.message,
        eta: settingsMap['locker_maintenance_eta'] !== undefined ? settingsMap['locker_maintenance_eta'] : inMemoryLockerMaintenanceState.eta,
        updatedAt: settingsMap['locker_maintenance_updated_at'] || inMemoryLockerMaintenanceState.updatedAt
      });
    }

    res.json(inMemoryLockerMaintenanceState);
  } catch (error) {
    console.error('[public/locker-status] Error fetching locker maintenance state, using fallback:', error);
    res.json(inMemoryLockerMaintenanceState);
  }
});

// POST /api/public/locker-status (Update locker maintenance status)
router.post('/locker-status', async (req: Request, res: Response) => {
  try {
    const { enabled, title, message, eta } = req.body;
    const nowIso = new Date().toISOString();

    inMemoryLockerMaintenanceState = {
      enabled: Boolean(enabled),
      title: title || inMemoryLockerMaintenanceState.title,
      message: message || inMemoryLockerMaintenanceState.message,
      eta: eta !== undefined ? eta : inMemoryLockerMaintenanceState.eta,
      updatedAt: nowIso
    };

    try {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, updated_at)
         VALUES 
           ('locker_maintenance_enabled', $1, NOW()),
           ('locker_maintenance_title', $2, NOW()),
           ('locker_maintenance_message', $3, NOW()),
           ('locker_maintenance_eta', $4, NOW()),
           ('locker_maintenance_updated_at', $5, NOW())
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()`,
        [
          String(Boolean(enabled)),
          inMemoryLockerMaintenanceState.title,
          inMemoryLockerMaintenanceState.message,
          inMemoryLockerMaintenanceState.eta,
          nowIso
        ]
      );
    } catch (dbErr) {
      console.warn('[public/locker-status] DB write warning, using memory fallback:', dbErr);
    }

    res.json(inMemoryLockerMaintenanceState);
  } catch (error) {
    console.error('[public/locker-status] Error updating locker maintenance state:', error);
    res.status(500).json({ error: 'Failed to update locker maintenance status' });
  }
});

export default router;

