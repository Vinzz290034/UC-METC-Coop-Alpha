import { Router, Request, Response } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

// Get inventory
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM inventory ORDER BY name');
    res.json({ items: result.rows });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
});

// Add inventory item (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, description, quantity, unit_price, category } = req.body;

    if (!name || quantity === undefined || unit_price === undefined) {
      return res.status(400).json({ message: 'Name, quantity, and unit_price required' });
    }

    const result = await query(
      'INSERT INTO inventory (name, description, quantity, unit_price, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description || '', quantity, unit_price, category || 'General']
    );

    res.status(201).json({ message: 'Item added', item: result.rows[0] });
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(500).json({ message: 'Failed to add item' });
  }
});

// Update inventory item
router.put('/:id', authMiddleware, requireRole('admin', 'inventory_officer'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, unit_price, category } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    if (description) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount}`);
      values.push(quantity);
      paramCount++;
    }
    if (unit_price !== undefined) {
      updates.push(`unit_price = $${paramCount}`);
      values.push(unit_price);
      paramCount++;
    }
    if (category) {
      updates.push(`category = $${paramCount}`);
      values.push(category);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query_str = `UPDATE inventory SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;

    const result = await query(query_str, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item updated', item: result.rows[0] });
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete inventory item
router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM inventory WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

export default router;
