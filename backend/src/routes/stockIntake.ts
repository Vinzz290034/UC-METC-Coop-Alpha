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
      attachment,
    } = req.body;

    // Insert stock intake record
    const stockIntakeResult = await client.query(
      `INSERT INTO stock_intake (
        product_id, product_name, quantity, cost_per_unit, selling_price,
        total_cost, potential_revenue, profit, profit_margin, supplier,
        notes, date_received, selected_variant, attachment
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        attachment || null,
      ]
    );

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
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // 1. Fetch the record to verify existence before deleting
    const recordRes = await client.query('SELECT * FROM stock_intake WHERE id = $1', [id]);
    if (recordRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Stock intake record not found' });
    }
    
    // 2. Delete the record
    await client.query('DELETE FROM stock_intake WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Stock intake record deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting stock intake record:', error);
    res.status(500).json({ error: 'Failed to delete stock intake record' });
  } finally {
    client.release();
  }
});

export default router;
