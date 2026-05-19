-- Add order_type column to orders table to support insurance orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'merchandise' 
CHECK (order_type IN ('merchandise', 'insurance'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);

-- Add payment_status column to track insurance payment status separately
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'completed'));

-- Add completed_at column to track when order was marked as paid
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add reference_number column for GCash payments
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);
