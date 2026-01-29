import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Get billing records
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    let query_str = `
      SELECT b.*, u.email, u.first_name, u.last_name 
      FROM billing b 
      JOIN users u ON b.user_id = u.id
    `;
    const params: any[] = [];

    // Non-admin users only see their own records
    if (req.user?.role !== 'admin') {
      query_str += ' WHERE b.user_id = $1';
      params.push(req.user?.id);
    }

    query_str += ' ORDER BY b.created_at DESC';

    const result = await query(query_str, params.length > 0 ? params : undefined);
    res.json({ records: result.rows });
  } catch (err) {
    console.error('Error fetching billing:', err);
    res.status(500).json({ message: 'Failed to fetch billing records' });
  }
});

// Create billing record (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { user_id, amount, type, due_date } = req.body;

    if (!user_id || !amount || !type) {
      return res.status(400).json({ message: 'user_id, amount, and type required' });
    }

    const result = await query(
      `INSERT INTO billing (user_id, amount, type, status, due_date) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, amount, type, 'pending', due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
    );

    res.status(201).json({ message: 'Billing record created', record: result.rows[0] });
  } catch (err) {
    console.error('Error creating billing:', err);
    res.status(500).json({ message: 'Failed to create billing record' });
  }
});

// Update billing status
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'overdue'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await query(
      `UPDATE billing 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.json({ message: 'Record updated', record: result.rows[0] });
  } catch (err) {
    console.error('Error updating billing:', err);
    res.status(500).json({ message: 'Failed to update billing record' });
  }
});

export default router;
