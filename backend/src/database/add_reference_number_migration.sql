-- Migration: Add reference_number column to orders table
-- Date: 2026-04-29
-- Description: Support e-wallet reference number storage

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100);

-- Add index for faster lookups by reference number
CREATE INDEX IF NOT EXISTS idx_orders_reference_number 
ON orders(reference_number) 
WHERE reference_number IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.reference_number IS 'Optional reference number for e-wallet transactions';
