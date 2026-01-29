import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware, requireRole } from '../middleware/auth.js';
import { Locker } from '../types/index.js';

const router = Router();

// Get all lockers
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM lockers ORDER BY locker_number');
    res.json({ lockers: result.rows });
  } catch (err) {
    console.error('Error fetching lockers:', err);
    res.status(500).json({ message: 'Failed to fetch lockers' });
  }
});

// Create locker (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { locker_number } = req.body;

    if (!locker_number) {
      return res.status(400).json({ message: 'Locker number required' });
    }

    const result = await query(
      'INSERT INTO lockers (locker_number, status) VALUES ($1, $2) RETURNING *',
      [locker_number, 'available']
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

// Update locker status
router.put('/:id', authMiddleware, requireRole('admin', 'locker_officer'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'assigned', 'maintenance'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await query(
      'UPDATE lockers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Locker not found' });
    }

    res.json({ message: 'Locker updated', locker: result.rows[0] });
  } catch (err) {
    console.error('Error updating locker:', err);
    res.status(500).json({ message: 'Failed to update locker' });
  }
});

// Assign locker to member
router.post('/:id/assign', authMiddleware, requireRole('admin', 'locker_officer'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const result = await query(
      'UPDATE lockers SET assigned_to = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [user_id, 'assigned', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Locker not found' });
    }

    res.json({ message: 'Locker assigned', locker: result.rows[0] });
  } catch (err) {
    console.error('Error assigning locker:', err);
    res.status(500).json({ message: 'Failed to assign locker' });
  }
});

// Delete locker (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM lockers WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Locker not found' });
    }

    res.json({ message: 'Locker deleted' });
  } catch (err) {
    console.error('Error deleting locker:', err);
    res.status(500).json({ message: 'Failed to delete locker' });
  }
});

export default router;
