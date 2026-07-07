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

export default router;
