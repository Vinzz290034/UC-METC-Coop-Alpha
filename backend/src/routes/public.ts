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

    res.json(result.rows[0]);
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

export default router;

