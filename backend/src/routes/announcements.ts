import express, { Request, Response } from 'express';
import { pool } from '../config/database.js';

const router = express.Router();

// Middleware to verify user ID
const verifyUser = (req: Request, res: Response, next: Function) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }
  (req as any).userId = userId;
  next();
};

// Middleware to verify admin/staff role
const verifyAdminOrStaff = async (req: Request, res: Response, next: Function) => {
  try {
    const userId = (req as any).userId;
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = result.rows[0].role;
    if (userRole !== 'admin' && userRole !== 'staff') {
      return res.status(403).json({ error: 'Access denied. Admin or staff role required.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify user role' });
  }
};

// Get all announcements (public - no auth required)
router.get('/public', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, category, image_url, author_name, author_role,
       TO_CHAR(created_at, 'YYYY-MM-DD') as date, created_at, updated_at
       FROM announcements 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get all announcements (admin/staff)
router.get('/', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, category, image_url, author_id, author_name, author_role,
       TO_CHAR(created_at, 'YYYY-MM-DD') as date, created_at, updated_at
       FROM announcements 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, title, content, category, image_url, author_name, author_role,
       TO_CHAR(created_at, 'YYYY-MM-DD') as date, created_at, updated_at
       FROM announcements 
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to fetch announcement:', error);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Create announcement (admin/staff only)
router.post('/', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const { title, content, category, image_url, image } = req.body;
    const userId = (req as any).userId;
    const imageUrl = image_url || image || null;
    
    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    
    // Validate category
    const validCategories = ['Maintenance', 'Services', 'Inventory', 'Registration', 'Events', 'General'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // Get author name and role
    const userResult = await pool.query(
      'SELECT first_name, last_name, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const authorName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;
    const authorRole = userResult.rows[0].role;
    
    // Ensure image_url column exists
    try {
      await pool.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT');
    } catch (e) {
      // Ignore if exists
    }
    
    // Insert announcement
    const result = await pool.query(
      `INSERT INTO announcements (title, content, category, image_url, author_id, author_name, author_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, content, category, image_url, author_id, author_name, author_role,
       TO_CHAR(created_at, 'YYYY-MM-DD') as date, created_at, updated_at`,
      [title, content, category, imageUrl, userId, authorName, authorRole]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Failed to create announcement:', error);
    res.status(500).json({ error: error?.message || 'Failed to create announcement' });
  }
});

// Update announcement (admin/staff only)
router.put('/:id', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, image_url, image } = req.body;
    const imageUrl = image_url || image || null;
    
    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    
    // Validate category
    const validCategories = ['Maintenance', 'Services', 'Inventory', 'Registration', 'Events', 'General'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    // Update announcement
    const result = await pool.query(
      `UPDATE announcements 
       SET title = $1, content = $2, category = $3, image_url = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, title, content, category, image_url, author_id, author_name, author_role,
       TO_CHAR(created_at, 'YYYY-MM-DD') as date, created_at, updated_at`,
      [title, content, category, imageUrl, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update announcement:', error);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (admin/staff only)
router.delete('/:id', verifyUser, verifyAdminOrStaff, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

export default router;
