import express from 'express';
import { pool } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all stock intake records
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stock_intake ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock intake records:', error);
    res.status(500).json({ error: 'Failed to fetch stock intake records' });
  }
});

// Create new stock intake record
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      productId,
      productName,
      quantity,
      costPerUnit,
      sellingPrice,
      totalCost,
      potentialRevenue,
      profit,
      profitMargin,
      supplier,
      notes,
      dateReceived,
      selectedVariant,
    } = req.body;

    // Insert stock intake record
    const stockIntakeResult = await client.query(
      `INSERT INTO stock_intake (
        product_id, product_name, quantity, cost_per_unit, selling_price,
        total_cost, potential_revenue, profit, profit_margin, supplier,
        notes, date_received, selected_variant
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        productId,
        productName,
        quantity,
        costPerUnit,
        sellingPrice,
        totalCost,
        potentialRevenue,
        profit,
        profitMargin,
        supplier,
        notes,
        dateReceived,
        JSON.stringify(selectedVariant),
      ]
    );

    // Update product inventory
    // Check if product has variants
    if (selectedVariant && Object.keys(selectedVariant).length > 0) {
      // Update specific variant stock
      const productResult = await client.query(
        'SELECT variants FROM products WHERE id = $1',
        [productId]
      );
      
      if (productResult.rows.length > 0) {
        const variants = productResult.rows[0].variants || {};
        
        // Build variant key from selected options
        const variantKey = Object.entries(selectedVariant)
          .map(([key, val]) => `${key}:${val}`)
          .join('|');
        
        // Update the specific variant stock
        if (variants[variantKey]) {
          variants[variantKey].stock += quantity;
        } else {
          // Create variant if it doesn't exist
          variants[variantKey] = {
            stock: quantity,
            options: selectedVariant
          };
        }
        
        await client.query(
          'UPDATE products SET variants = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [JSON.stringify(variants), productId]
        );
      }
    } else {
      // Update main product stock (no variants)
      await client.query(
        'UPDATE products SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [quantity, productId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(stockIntakeResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating stock intake record:', error);
    res.status(500).json({ error: 'Failed to create stock intake record' });
  } finally {
    client.release();
  }
});

// Delete stock intake record
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM stock_intake WHERE id = $1', [id]);
    res.json({ message: 'Stock intake record deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock intake record:', error);
    res.status(500).json({ error: 'Failed to delete stock intake record' });
  }
});

export default router;
