-- Add allow_preorder column to products table to support gating pre-orders
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS allow_preorder BOOLEAN DEFAULT true;
