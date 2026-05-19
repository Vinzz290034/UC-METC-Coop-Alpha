-- Create stock_intake table
CREATE TABLE IF NOT EXISTS stock_intake (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  cost_per_unit DECIMAL(10, 2) NOT NULL,
  selling_price DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  potential_revenue DECIMAL(10, 2) NOT NULL,
  profit DECIMAL(10, 2) NOT NULL,
  profit_margin VARCHAR(10),
  supplier VARCHAR(255),
  notes TEXT,
  date_received DATE NOT NULL,
  selected_variant JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stock_intake_product_id ON stock_intake(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_intake_date_received ON stock_intake(date_received);
CREATE INDEX IF NOT EXISTS idx_stock_intake_created_at ON stock_intake(created_at);
