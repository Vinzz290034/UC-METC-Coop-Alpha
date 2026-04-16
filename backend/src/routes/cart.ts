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

// Add item to cart
router.post('/add', verifyUser, async (req: Request, res: Response) => {
  try {
    const { productId, productName, price, quantity, selectedOptions } = req.body;
    const userId = (req as any).userId;

    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, product_name, price, quantity, selected_options)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, product_id, selected_options) 
       DO UPDATE SET quantity = cart_items.quantity + $5, updated_at = NOW()
       RETURNING *`,
      [userId, productId, productName, price, quantity, selectedOptions ? JSON.stringify(selectedOptions) : null]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Get user's cart
router.get('/', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT * FROM cart_items WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const cartItems = result.rows.map(item => ({
      ...item,
      selected_options: item.selected_options ? JSON.parse(item.selected_options) : {}
    }));

    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Update cart item quantity
router.put('/:id', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const userId = (req as any).userId;

    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
      return res.json({ message: 'Item removed' });
    }

    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *`,
      [quantity, id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/:id', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    await pool.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear entire cart
router.delete('/', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
