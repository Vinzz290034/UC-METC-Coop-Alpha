import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Get all key requests
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT k.*, u.email, u.first_name, u.last_name 
      FROM key_requests k 
      JOIN users u ON k.user_id = u.id 
      ORDER BY k.created_at DESC
    `);
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Error fetching key requests:', err);
    res.status(500).json({ message: 'Failed to fetch key requests' });
  }
});

// Create key request
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      'INSERT INTO key_requests (user_id, status) VALUES ($1, $2) RETURNING *',
      [req.user?.id, 'pending']
    );

    res.status(201).json({ message: 'Key request created', request: result.rows[0] });
  } catch (err) {
    console.error('Error creating key request:', err);
    res.status(500).json({ message: 'Failed to create key request' });
  }
});

// Update key request status (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const completedAt = status === 'completed' ? new Date() : null;

    const result = await query(
      `UPDATE key_requests 
       SET status = $1, completed_at = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [status, completedAt, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Request updated', request: result.rows[0] });
  } catch (err) {
    console.error('Error updating request:', err);
    res.status(500).json({ message: 'Failed to update request' });
  }
});

export default router;
