import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';

const router = Router();

// Get all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, name, category, price, stock, sku, note, options, variants, allowPreorder, image } = req.body;
    
    const result = await pool.query(
      `INSERT INTO products (id, name, category, price, stock, sku, note, options, variants, allow_preorder, image, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        id, 
        name, 
        category, 
        price, 
        stock, 
        sku, 
        note, 
        options ? JSON.stringify(options) : null, 
        variants ? JSON.stringify(variants) : null,
        allowPreorder !== false,
        image || null
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Product with this SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
});

// Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock, sku, note, options, variants, allowPreorder, image } = req.body;
    
    const result = await pool.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           sku = COALESCE($5, sku),
           note = COALESCE($6, note),
           options = COALESCE($7, options),
           variants = COALESCE($8, variants),
           allow_preorder = COALESCE($9, allow_preorder),
           image = COALESCE($10, image),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        name, 
        category, 
        price, 
        stock, 
        sku, 
        note, 
        options ? JSON.stringify(options) : null, 
        variants ? JSON.stringify(variants) : null, 
        allowPreorder, 
        image || null,
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Product with this SKU already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
});

// Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully', product: result.rows[0] });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
