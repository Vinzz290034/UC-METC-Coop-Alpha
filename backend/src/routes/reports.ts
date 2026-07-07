import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Sales report
router.get('/sales', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_sale
      FROM sales
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    res.json({ sales: result.rows });
  } catch (err) {
    console.error('Error fetching sales report:', err);
    res.status(500).json({ message: 'Failed to fetch sales report' });
  }
});

// Inventory report
router.get('/inventory', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        category,
        quantity,
        unit_price,
        (quantity * unit_price) as total_value
      FROM inventory
      ORDER BY total_value DESC
    `);
    res.json({ inventory: result.rows });
  } catch (err) {
    console.error('Error fetching inventory report:', err);
    res.status(500).json({ message: 'Failed to fetch inventory report' });
  }
});

// Members report
router.get('/members', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_members,
        SUM(CASE WHEN role = 'member' THEN 1 ELSE 0 END) as regular_members,
        SUM(CASE WHEN role IN ('admin', 'manager') THEN 1 ELSE 0 END) as staff_members
      FROM users
      WHERE email NOT LIKE 'walkin-%@uc-metc-walkin.com'
    `);
    res.json({ stats: result.rows[0] });
  } catch (err) {
    console.error('Error fetching members report:', err);
    res.status(500).json({ message: 'Failed to fetch members report' });
  }
});

export default router;
