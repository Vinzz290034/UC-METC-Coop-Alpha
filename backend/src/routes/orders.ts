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

// Create order from cart
router.post('/create', verifyUser, async (req: Request, res: Response) => {
  try {
    const { items, totalAmount, paymentMethod, receiptNo } = req.body;
    const userId = (req as any).userId;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (receipt_no, user_id, total_amount, payment_method, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [receiptNo, userId, totalAmount, paymentMethod]
      );

      const orderId = orderResult.rows[0].id;

      // Insert order items with product details
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, selected_options)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            item.productId,
            item.productName || item.name || '',
            item.quantity,
            item.unitPrice,
            item.subtotal,
            item.selectedOptions ? JSON.stringify(item.selectedOptions) : null
          ]
        );
      }

      // Clear cart
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      await client.query('COMMIT');
      res.json(orderResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT o.*, json_agg(json_build_object(
        'id', oi.id,
        'productId', oi.product_id,
        'productName', oi.product_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'subtotal', oi.subtotal,
        'selectedOptions', oi.selected_options
      )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
router.get('/:id', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT o.*, json_agg(json_build_object(
        'id', oi.id,
        'productId', oi.product_id,
        'productName', oi.product_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'subtotal', oi.subtotal,
        'selectedOptions', oi.selected_options
      )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (for staff/admin only)
router.put('/:id/status', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).userId;

    // Verify user is admin or staff
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0] || !['admin', 'staff'].includes(userResult.rows[0].role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Cancel order (user can only cancel pending orders)
router.put('/:id/cancel', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    const orderResult = await pool.query(
      `SELECT status FROM orders WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderResult.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending orders' });
    }

    const result = await pool.query(
      `UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Get all pending orders (for staff/admin)
router.get('/pending/list', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Verify user is admin or staff
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0] || !['admin', 'staff'].includes(userResult.rows[0].role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT o.id, o.receipt_no, o.user_id, o.total_amount, o.payment_method, o.status, o.created_at, o.updated_at,
              u.email, u.first_name, u.last_name, u.id_number,
              json_agg(json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal,
                'selectedOptions', oi.selected_options
              )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.status = 'pending'
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
});

// Delete order completely
router.delete('/:id', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Verify order belongs to user and is pending
    const orderResult = await pool.query(
      `SELECT status FROM orders WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (orderResult.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Can only delete pending orders' });
    }

    // Delete order (order_items will be deleted due to CASCADE constraint)
    const result = await pool.query(
      `DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    res.json({ message: 'Order deleted successfully', order: result.rows[0] });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Get all orders (for staff/admin) or user-specific orders
// This endpoint checks user role and returns appropriate data
router.get('/all/transactions', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get user info to check role
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userResult.rows[0].role;
    let query: string;
    let params: any[];

    if (userRole === 'admin' || userRole === 'staff') {
      // Staff/admin can see all orders
      query = `SELECT o.id, o.receipt_no, o.user_id, o.total_amount, o.payment_method, o.status, o.created_at, o.updated_at,
              u.email, u.first_name, u.last_name, u.id_number,
              json_agg(json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal,
                'selectedOptions', oi.selected_options
              )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN users u ON o.user_id = u.id
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC`;
      params = [];
    } else {
      // Regular users can only see their own orders
      query = `SELECT o.*, json_agg(json_build_object(
        'id', oi.id,
        'productId', oi.product_id,
        'productName', oi.product_name,
        'quantity', oi.quantity,
        'unitPrice', oi.unit_price,
        'subtotal', oi.subtotal,
        'selectedOptions', oi.selected_options
      )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
