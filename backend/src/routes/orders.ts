import express, { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { notificationService } from '../services/notificationService.js';

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
    console.log('[ORDER CREATE] Request received:', {
      body: req.body,
      userId: (req as any).userId,
      headers: req.headers
    });

    const { items, totalAmount, paymentMethod, referenceNumber, receiptNo, orderType } = req.body;
    let userId = (req as any).userId;
    let orderStatus = 'pending';
    let completedAt: Date | null = null;
    let createdAt = new Date();

    // Check if the requesting user is admin/staff
    const requestingUserResult = await pool.query('SELECT role FROM users WHERE id = $1', [(req as any).userId]);
    const isStaffOrAdmin = requestingUserResult.rows[0] && ['admin', 'staff'].includes(requestingUserResult.rows[0].role);

    if (isStaffOrAdmin) {
      if (req.body.isWalkIn) {
        const { walkInName, walkInIdNumber, walkInCourse, walkInMembershipStatus } = req.body;
        
        // Split name into first and last name
        const nameParts = (walkInName || 'Walk-in Student').trim().split(/\s+/);
        const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || 'Walk-in';
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Student';
        
        const email = `walkin-${Date.now()}-${Math.floor(Math.random() * 1000)}@uc-metc-walkin.com`;
        
        const userInsertResult = await pool.query(
          `INSERT INTO users (email, password, id_number, first_name, last_name, course, role, status, membership_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            email,
            '', // No password
            walkInIdNumber || null,
            firstName,
            lastName,
            walkInCourse || null,
            'user',
            'active',
            walkInMembershipStatus || 'none'
          ]
        );
        userId = userInsertResult.rows[0].id;
      } else if (req.body.userId) {
        userId = req.body.userId;
      }
      if (req.body.status) {
        orderStatus = req.body.status;
        if (orderStatus === 'completed' || orderStatus === 'released') {
          completedAt = req.body.completedAt ? new Date(req.body.completedAt) : new Date();
        }
      }
      if (req.body.createdAt) {
        createdAt = new Date(req.body.createdAt);
      }
    }

    // Validate payment method
    if (!['cash', 'ewallet'].includes(paymentMethod)) {
      console.log('[ORDER CREATE] Invalid payment method:', paymentMethod);
      return res.status(400).json({ 
        error: 'Invalid payment method. Must be "cash" or "ewallet".' 
      });
    }

    // Validate reference number length if provided
    if (referenceNumber && referenceNumber.length > 100) {
      console.log('[ORDER CREATE] Reference number too long');
      return res.status(400).json({ 
        error: 'Reference number must be 100 characters or less.' 
      });
    }

    // Determine order type (default to 'merchandise')
    const finalOrderType = orderType || 'merchandise';
    console.log('[ORDER CREATE] Order type:', finalOrderType);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert order with reference_number, order_type, status, completed_at, and created_at
      console.log('[ORDER CREATE] Inserting order...');
      const orderResult = await client.query(
        `INSERT INTO orders (receipt_no, user_id, total_amount, payment_method, reference_number, status, order_type, payment_status, completed_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          receiptNo, 
          userId, 
          totalAmount, 
          paymentMethod, 
          referenceNumber || null, 
          orderStatus, 
          finalOrderType, 
          (orderStatus === 'completed' || orderStatus === 'released') ? 'completed' : 'pending',
          completedAt,
          createdAt
        ]
      );

      const orderId = orderResult.rows[0].id;
      console.log('[ORDER CREATE] Order created with ID:', orderId);

      // Insert order items with product details
      for (const item of items) {
        console.log('[ORDER CREATE] Inserting item:', item);
        const productId = item.productId || item.product_id;
        const quantity = item.quantity;
        const selectedOptions = item.selectedOptions || item.selected_options;
        const unitPrice = item.unitPrice || item.unit_price;

        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal, selected_options, payment_type, order_type, full_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            orderId,
            productId,
            item.productName || item.product_name || item.name || '',
            quantity,
            unitPrice,
            item.subtotal,
            selectedOptions ? (typeof selectedOptions === 'string' ? selectedOptions : JSON.stringify(selectedOptions)) : null,
            item.paymentType || item.payment_type || null,
            item.orderType || item.order_type || 'regular',
            item.fullPrice || item.full_price || null
          ]
        );

        // Deduct inventory stock if the order is created as completed/released immediately (offline walk-in order)
        if ((orderStatus === 'completed' || orderStatus === 'released') && finalOrderType !== 'insurance') {
          // Get product to check if it has variants
          const productResult = await client.query(
            'SELECT stock, variants FROM products WHERE id = $1',
            [productId]
          );

          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];

            // Check if product has variants and selected options
            if (product.variants && selectedOptions && Object.keys(selectedOptions).length > 0) {
              // Build variant key from selected options
              let parsedOptions = selectedOptions;
              if (typeof selectedOptions === 'string') {
                try {
                  parsedOptions = JSON.parse(selectedOptions);
                } catch (e) {
                  parsedOptions = {};
                }
              }

              if (parsedOptions && Object.keys(parsedOptions).length > 0) {
                const variantKey = Object.entries(parsedOptions)
                  .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                  .map(([key, value]) => `${key}:${value}`)
                  .join('|');

                // Update variant stock
                const variants = product.variants;
                if (variants[variantKey] !== undefined) {
                  // Deduct from variant stock
                  variants[variantKey].stock = Math.max(0, (variants[variantKey].stock || 0) - quantity);
                  
                  // Also update the total product stock
                  const totalVariantStock = Object.values(variants).reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
                  
                  await client.query(
                    'UPDATE products SET variants = $1, stock = $2 WHERE id = $3',
                    [JSON.stringify(variants), totalVariantStock, productId]
                  );
                } else {
                  // Variant key not found, deduct from main stock as fallback
                  await client.query(
                    'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                    [quantity, productId]
                  );
                }
              } else {
                // Deduct from main stock
                await client.query(
                  'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                  [quantity, productId]
                );
              }
            } else {
              // Simple product without variants - deduct from main stock
              await client.query(
                'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                [quantity, productId]
              );
            }
          }
        }
      }

      // Clear cart only if this is NOT a manual admin/staff recorded offline order for another student
      if (finalOrderType !== 'insurance' && (!isStaffOrAdmin || userId === (req as any).userId)) {
        await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
      }

      await client.query('COMMIT');
      console.log('[ORDER CREATE] Transaction committed successfully');
      
      // Create notification for admin/staff about new pending order
      const orderTypeLabel = finalOrderType === 'insurance' ? 'Insurance Request' : 'Order';
      if (orderStatus === 'pending') {
        await notificationService.createNotificationsForRole(
          'admin',
          'pending_order',
          `New ${orderTypeLabel} Received`,
          `${orderTypeLabel} #${receiptNo} is pending approval - Total: ₱${totalAmount}`,
          '/sales'
        );
        
        await notificationService.createNotificationsForRole(
          'staff',
          'pending_order',
          `New ${orderTypeLabel} Received`,
          `${orderTypeLabel} #${receiptNo} is pending approval - Total: ₱${totalAmount}`,
          '/sales'
        );
      }
      
      console.log('[ORDER CREATE] Success! Returning order:', orderResult.rows[0]);
      res.json(orderResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[ORDER CREATE] Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[ORDER CREATE] Error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/', verifyUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(
      `SELECT 
        o.id,
        o.receipt_no,
        o.user_id,
        o.total_amount,
        o.payment_method,
        o.reference_number,
        o.status,
        o.order_type,
        o.payment_status,
        o.completed_at,
        o.created_at,
        o.updated_at,
        json_agg(json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'productName', oi.product_name,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price,
          'subtotal', oi.subtotal,
          'selectedOptions', oi.selected_options,
          'paymentType', oi.payment_type,
          'orderType', oi.order_type,
          'fullPrice', oi.full_price
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
        'selectedOptions', oi.selected_options,
        'paymentType', oi.payment_type,
        'orderType', oi.order_type,
        'fullPrice', oi.full_price
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

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current order status
      const orderResult = await client.query(
        'SELECT status FROM orders WHERE id = $1',
        [id]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      const previousStatus = orderResult.rows[0].status;

      // Update order status and set completed_at if status is completed
      let updateQuery;
      let updateParams;
      
      if (status === 'completed') {
        updateQuery = `UPDATE orders 
                       SET status = $1, 
                           updated_at = NOW(), 
                           completed_at = NOW() 
                       WHERE id = $2 
                       RETURNING *`;
        updateParams = [status, id];
      } else {
        updateQuery = `UPDATE orders 
                       SET status = $1, 
                           updated_at = NOW() 
                       WHERE id = $2 
                       RETURNING *`;
        updateParams = [status, id];
      }
      
      const updateResult = await client.query(updateQuery, updateParams);

      // If order is being marked as completed and was previously pending, deduct inventory
      if (status === 'completed' && previousStatus === 'pending') {
        // Get all order items
        const itemsResult = await client.query(
          `SELECT product_id, product_name, quantity, selected_options FROM order_items WHERE order_id = $1`,
          [id]
        );

        // Deduct stock for each item
        for (const item of itemsResult.rows) {
          const productId = item.product_id;
          const quantity = item.quantity;
          const selectedOptions = item.selected_options;

          // Get product to check if it has variants
          const productResult = await client.query(
            'SELECT stock, variants FROM products WHERE id = $1',
            [productId]
          );

          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];

            // Check if product has variants and selected options
            if (product.variants && selectedOptions && Object.keys(selectedOptions).length > 0) {
              // Build variant key from selected options
              const variantKey = Object.entries(selectedOptions)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map(([key, value]) => `${key}:${value}`)
                .join('|');

              // Update variant stock
              const variants = product.variants;
              if (variants[variantKey] !== undefined) {
                // Deduct from variant stock
                variants[variantKey].stock = Math.max(0, (variants[variantKey].stock || 0) - quantity);
                
                // Also update the total product stock
                const totalVariantStock = Object.values(variants).reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
                
                await client.query(
                  'UPDATE products SET variants = $1, stock = $2 WHERE id = $3',
                  [JSON.stringify(variants), totalVariantStock, productId]
                );
              } else {
                // Variant key not found, deduct from main stock as fallback
                await client.query(
                  'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                  [quantity, productId]
                );
              }
            } else {
              // Simple product without variants - deduct from main stock
              await client.query(
                'UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                [quantity, productId]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
      
      const updatedOrder = updateResult.rows[0];
      
      // Create notification for user when order status changes
      if (status === 'completed') {
        // Check if this is an insurance order
        const orderTypeResult = await pool.query(
          'SELECT order_type FROM orders WHERE id = $1',
          [id]
        );
        const isInsurance = orderTypeResult.rows[0]?.order_type === 'insurance';
        
        if (isInsurance) {
          // Congratulatory message for insurance payment
          await notificationService.createNotification({
            user_id: updatedOrder.user_id,
            type: 'insurance_approved',
            title: 'Congratulations! 🎉',
            description: `Your I-CARD Insurance payment has been approved! You are now covered with ₱50,000 death/disability benefits. Stay safe!`,
            link: '/transaction',
          });
        } else {
          // Regular order completion message
          await notificationService.createNotification({
            user_id: updatedOrder.user_id,
            type: 'order_completed',
            title: 'Order Completed',
            description: `Your order #${updatedOrder.receipt_no} has been completed`,
            link: '/transaction',
          });
        }
      } else if (status === 'cancelled') {
        await notificationService.createNotification({
          user_id: updatedOrder.user_id,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          description: `Your order #${updatedOrder.receipt_no} has been cancelled.`,
          link: '/transaction',
        });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update order status error:', error);
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
      `SELECT o.id, o.receipt_no, o.user_id, o.total_amount, o.payment_method, 
              o.reference_number, o.status, o.created_at, o.updated_at,
              u.email, u.first_name, u.last_name, u.id_number,
              json_agg(json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal,
                'selectedOptions', oi.selected_options,
                'paymentType', oi.payment_type,
                'orderType', oi.order_type,
                'fullPrice', oi.full_price
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
    console.error('Get pending orders error:', error);
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

// Admin/staff delete order completely and restore stock if completed
router.delete('/admin/:id', verifyUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Verify user is admin or staff
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (!userResult.rows[0] || !['admin', 'staff'].includes(userResult.rows[0].role)) {
      return res.status(403).json({ error: 'Unauthorized. Staff/Admin privilege required.' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get order details to check status and fetch items for stock restoration
      const orderResult = await client.query(
        'SELECT status, order_type FROM orders WHERE id = $1',
        [id]
      );

      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];

      // If the order was COMPLETED, restore the stock of items
      if (order.status === 'completed' && order.order_type !== 'insurance') {
        const itemsResult = await client.query(
          `SELECT product_id, quantity, selected_options FROM order_items WHERE order_id = $1`,
          [id]
        );

        for (const item of itemsResult.rows) {
          const productId = item.product_id;
          const quantity = item.quantity;
          const selectedOptions = item.selected_options;

          const productResult = await client.query(
            'SELECT stock, variants FROM products WHERE id = $1',
            [productId]
          );

          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];

            if (product.variants && selectedOptions && Object.keys(selectedOptions).length > 0) {
              const variantKey = Object.entries(selectedOptions)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
                .map(([key, value]) => `${key}:${value}`)
                .join('|');

              const variants = product.variants;
              if (variants[variantKey] !== undefined) {
                // Restore variant stock
                variants[variantKey].stock = (variants[variantKey].stock || 0) + quantity;
                const totalVariantStock = Object.values(variants).reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
                
                await client.query(
                  'UPDATE products SET variants = $1, stock = $2 WHERE id = $3',
                  [JSON.stringify(variants), totalVariantStock, productId]
                );
              } else {
                await client.query(
                  'UPDATE products SET stock = stock + $1 WHERE id = $2',
                  [quantity, productId]
                );
              }
            } else {
              await client.query(
                'UPDATE products SET stock = stock + $1 WHERE id = $2',
                [quantity, productId]
              );
            }
          }
        }
      }

      // Delete the order (CASCADE deletes order_items)
      const deleteResult = await client.query(
        'DELETE FROM orders WHERE id = $1 RETURNING *',
        [id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Order deleted and stock restored successfully', order: deleteResult.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin delete order error:', error);
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
      query = `SELECT o.id, o.receipt_no, o.user_id, o.total_amount, o.payment_method, 
                      o.reference_number, o.status, o.order_type, o.created_at, o.updated_at, o.completed_at,
              u.email, u.first_name, u.last_name, u.id_number, u.course, u.year,
              json_agg(json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'quantity', oi.quantity,
                'unitPrice', oi.unit_price,
                'subtotal', oi.subtotal,
                'selectedOptions', oi.selected_options,
                'paymentType', oi.payment_type,
                'orderType', oi.order_type,
                'fullPrice', CAST(oi.full_price AS DECIMAL)
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
        'selectedOptions', oi.selected_options,
        'paymentType', oi.payment_type,
        'orderType', oi.order_type,
        'fullPrice', CAST(oi.full_price AS DECIMAL)
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
