-- Migration: Add UNIQUE constraint to id_number column
-- This migration adds a UNIQUE constraint to the id_number column in the users table
-- to prevent duplicate ID numbers in the system

-- First, check if there are any duplicate id_numbers (excluding NULL values)
-- Run this query to see if there are duplicates before applying the constraint:
-- SELECT id_number, COUNT(*) FROM users WHERE id_number IS NOT NULL GROUP BY id_number HAVING COUNT(*) > 1;

-- If duplicates exist, you'll need to resolve them manually before running this migration
-- You can update duplicate id_numbers to make them unique or set them to NULL

-- Add UNIQUE constraint to id_number column
ALTER TABLE users ADD CONSTRAINT users_id_number_unique UNIQUE (id_number);

-- Create index for better query performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_id_number ON users(id_number);

-- Verify the constraint was added successfully
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
-- WHERE table_name = 'users' AND constraint_name = 'users_id_number_unique';
