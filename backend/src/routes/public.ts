import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';

const router = Router();

// Get landing page statistics (public endpoint - no auth required)
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Get total products count
    const productsResult = await pool.query(
      'SELECT COUNT(*) as count FROM products'
    );
    const productsCount = parseInt(productsResult.rows[0].count);

    // Get total registered students count (all users with role 'user')
    const studentsResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    );
    const studentsCount = parseInt(studentsResult.rows[0].count);

    // Get approved members count (users with membership_status = 'approved')
    const membersResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE membership_status = 'approved'"
    );
    const membersCount = parseInt(membersResult.rows[0].count);

    res.json({
      products: productsCount,
      students: studentsCount,
      members: membersCount,
    });
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
