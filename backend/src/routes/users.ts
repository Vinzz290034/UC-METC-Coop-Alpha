import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { User } from '../types/index.js';

const router = Router();

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT id, email, first_name, last_name, role, status, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless admin
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const result = await query('SELECT id, email, first_name, last_name, role, status, created_at FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, role } = req.body;

    // Users can only update their own profile unless admin
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (first_name) {
      updates.push(`first_name = $${paramCount}`);
      values.push(first_name);
      paramCount++;
    }

    if (last_name) {
      updates.push(`last_name = $${paramCount}`);
      values.push(last_name);
      paramCount++;
    }

    if (role && req.user?.role === 'admin') {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query_str = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, email, first_name, last_name, role`;

    const result = await query(query_str, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;
