import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

// ── GET all lockers (staff/admin/locker_officer) ──────────────────────────────
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT l.*,
        u.first_name, u.last_name, u.id_number, u.course, u.email,
        r.id AS rental_id, r.status AS rental_status, r.payment_status,
        r.semester_count, r.start_date, r.end_date,
        r.rental_fee, r.deposit_fee, r.terms_agreed
      FROM lockers l
      LEFT JOIN users u ON l.assigned_to = u.id
      LEFT JOIN locker_rentals r ON r.locker_id = l.id AND r.status IN ('pending','active')
      ORDER BY l.locker_number
    `);
    res.json({ lockers: result.rows });
  } catch (err) {
    console.error('Error fetching lockers:', err);
    res.status(500).json({ message: 'Failed to fetch lockers' });
  }
});

// ── GET available lockers (any authenticated user) ───────────────────────────
router.get('/available', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT id, locker_number, location, floor, size
      FROM lockers
      WHERE status = 'available'
      ORDER BY locker_number
    `);
    res.json({ lockers: result.rows });
  } catch (err) {
    console.error('Error fetching available lockers:', err);
    res.status(500).json({ message: 'Failed to fetch available lockers' });
  }
});

// ── GET my locker (current student) ──────────────────────────────────────────
router.get('/mine', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const result = await query(`
      SELECT
        l.id, l.locker_number, l.location, l.floor, l.size, l.status, l.key_code,
        r.id AS rental_id, r.status AS rental_status, r.payment_status,
        r.semester_count, r.start_date, r.end_date,
        r.rental_fee, r.deposit_fee, r.terms_agreed, r.agreed_at,
        r.notes, r.created_at AS applied_at
      FROM locker_rentals r
      JOIN lockers l ON l.id = r.locker_id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.json({ rental: null });
    }
    res.json({ rental: result.rows[0] });
  } catch (err) {
    console.error('Error fetching my locker:', err);
    res.status(500).json({ message: 'Failed to fetch locker info' });
  }
});

// ── GET all rental applications (admin/locker_officer) ────────────────────────
router.get('/rentals', authMiddleware, requireRole('admin', 'locker_officer', 'staff'), async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        r.*,
        l.locker_number, l.location, l.floor, l.size, l.key_code,
        u.first_name, u.last_name, u.id_number, u.course, u.year, u.email
      FROM locker_rentals r
      JOIN lockers l ON l.id = r.locker_id
      JOIN users u ON u.id = r.user_id
      ORDER BY r.created_at DESC
    `);
    res.json({ rentals: result.rows });
  } catch (err) {
    console.error('Error fetching rentals:', err);
    res.status(500).json({ message: 'Failed to fetch rentals' });
  }
});

// ── POST apply for locker (student) ──────────────────────────────────────────
router.post('/apply', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { locker_id, semester_count, terms_agreed } = req.body;

    if (!locker_id || !semester_count || !terms_agreed) {
      return res.status(400).json({ message: 'Locker, semester count, and terms agreement are required' });
    }

    // Check if student already has an active or pending rental
    const existing = await query(
      `SELECT id FROM locker_rentals WHERE user_id = $1 AND status IN ('pending','active')`,
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'You already have an active or pending locker rental' });
    }

    // Check locker is still available
    const locker = await query(`SELECT * FROM lockers WHERE id = $1 AND status = 'available'`, [locker_id]);
    if (locker.rows.length === 0) {
      return res.status(409).json({ message: 'This locker is no longer available' });
    }

    const count = parseInt(semester_count);
    const rentalFee = 250 * count;
    const depositFee = 200;

    // Create rental application
    const rental = await query(`
      INSERT INTO locker_rentals
        (locker_id, user_id, semester_count, rental_fee, deposit_fee, terms_agreed, agreed_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [locker_id, userId, count, rentalFee, depositFee, true]);

    // Mark locker as temporarily occupied (pending approval)
    await query(`UPDATE lockers SET status = 'assigned', updated_at = NOW() WHERE id = $1`, [locker_id]);

    res.status(201).json({ message: 'Locker rental application submitted successfully', rental: rental.rows[0] });
  } catch (err) {
    console.error('Error applying for locker:', err);
    res.status(500).json({ message: 'Failed to submit locker application' });
  }
});

// ── POST create locker (admin only) ──────────────────────────────────────────
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { locker_number, location, floor, size } = req.body;
    if (!locker_number) {
      return res.status(400).json({ message: 'Locker number required' });
    }
    const result = await query(
      `INSERT INTO lockers (locker_number, status, location, floor, size)
       VALUES ($1, 'available', $2, $3, $4) RETURNING *`,
      [locker_number, location || 'Main Campus', floor || 'Ground Floor', size || 'Medium']
    );
    res.status(201).json({ message: 'Locker created', locker: result.rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Locker number already exists' });
    }
    console.error('Error creating locker:', err);
    res.status(500).json({ message: 'Failed to create locker' });
  }
});

// ── PUT approve rental — assign key, activate, set dates (admin/locker_officer) ──
router.put('/rentals/:rentalId/approve', authMiddleware, requireRole('admin', 'locker_officer', 'staff'), async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { key_code, start_date, end_date } = req.body;

    const rental = await query(`SELECT * FROM locker_rentals WHERE id = $1`, [rentalId]);
    if (rental.rows.length === 0) return res.status(404).json({ message: 'Rental not found' });

    const r = rental.rows[0];

    // Activate rental
    await query(`
      UPDATE locker_rentals
      SET status = 'active', start_date = $1, end_date = $2, updated_at = NOW()
      WHERE id = $3
    `, [start_date || new Date(), end_date, rentalId]);

    // Assign locker: set assigned_to and key_code
    await query(`
      UPDATE lockers
      SET assigned_to = $1, status = 'assigned', key_code = $2, updated_at = NOW()
      WHERE id = $3
    `, [r.user_id, key_code || null, r.locker_id]);

    res.json({ message: 'Rental approved and locker assigned' });
  } catch (err) {
    console.error('Error approving rental:', err);
    res.status(500).json({ message: 'Failed to approve rental' });
  }
});

// ── PUT reject rental (admin/locker_officer) ──────────────────────────────────
router.put('/rentals/:rentalId/reject', authMiddleware, requireRole('admin', 'locker_officer', 'staff'), async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { notes } = req.body;

    const rental = await query(`SELECT * FROM locker_rentals WHERE id = $1`, [rentalId]);
    if (rental.rows.length === 0) return res.status(404).json({ message: 'Rental not found' });

    const r = rental.rows[0];

    await query(`UPDATE locker_rentals SET status = 'rejected', notes = $1, updated_at = NOW() WHERE id = $2`, [notes || null, rentalId]);
    // Release the locker back to available
    await query(`UPDATE lockers SET assigned_to = NULL, status = 'available', key_code = NULL, updated_at = NOW() WHERE id = $1`, [r.locker_id]);

    res.json({ message: 'Rental rejected' });
  } catch (err) {
    console.error('Error rejecting rental:', err);
    res.status(500).json({ message: 'Failed to reject rental' });
  }
});

// ── PUT mark payment (admin/locker_officer) ───────────────────────────────────
router.put('/rentals/:rentalId/mark-paid', authMiddleware, requireRole('admin', 'locker_officer', 'staff'), async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { payment_status } = req.body; // 'paid' | 'partial'
    if (!['paid', 'partial'].includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid payment_status' });
    }
    const result = await query(
      `UPDATE locker_rentals SET payment_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [payment_status, rentalId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Rental not found' });
    res.json({ message: 'Payment status updated', rental: result.rows[0] });
  } catch (err) {
    console.error('Error marking payment:', err);
    res.status(500).json({ message: 'Failed to update payment status' });
  }
});

// ── PUT terminate rental (admin or student owner) ─────────────────────────────
router.put('/rentals/:rentalId/terminate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const rental = await query(`SELECT * FROM locker_rentals WHERE id = $1`, [rentalId]);
    if (rental.rows.length === 0) return res.status(404).json({ message: 'Rental not found' });

    const r = rental.rows[0];
    const isAdmin = ['admin', 'locker_officer', 'staff'].includes(userRole);
    const isOwner = r.user_id === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await query(`UPDATE locker_rentals SET status = 'terminated', updated_at = NOW() WHERE id = $1`, [rentalId]);
    await query(`UPDATE lockers SET assigned_to = NULL, status = 'available', key_code = NULL, updated_at = NOW() WHERE id = $1`, [r.locker_id]);

    res.json({ message: 'Rental terminated and locker released' });
  } catch (err) {
    console.error('Error terminating rental:', err);
    res.status(500).json({ message: 'Failed to terminate rental' });
  }
});

// ── PUT update locker details (admin/locker_officer) ──────────────────────────
router.put('/:id', authMiddleware, requireRole('admin', 'locker_officer'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, location, floor, size, key_code } = req.body;

    const validStatuses = ['available', 'assigned', 'maintenance'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await query(`
      UPDATE lockers
      SET
        status = COALESCE($1, status),
        location = COALESCE($2, location),
        floor = COALESCE($3, floor),
        size = COALESCE($4, size),
        key_code = COALESCE($5, key_code),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [status || null, location || null, floor || null, size || null, key_code || null, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Locker not found' });
    res.json({ message: 'Locker updated', locker: result.rows[0] });
  } catch (err) {
    console.error('Error updating locker:', err);
    res.status(500).json({ message: 'Failed to update locker' });
  }
});

// ── DELETE locker (admin only) ────────────────────────────────────────────────
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM lockers WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Locker not found' });
    res.json({ message: 'Locker deleted' });
  } catch (err) {
    console.error('Error deleting locker:', err);
    res.status(500).json({ message: 'Failed to delete locker' });
  }
});

export default router;
