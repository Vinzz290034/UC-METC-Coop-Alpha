-- UC METC Coop Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  id_number VARCHAR(20) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  course VARCHAR(100),
  year VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user')),
  membership_status VARCHAR(50) NOT NULL DEFAULT 'none' CHECK (membership_status IN ('none', 'pending', 'approved', 'rejected')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  email_verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lockers table
CREATE TABLE IF NOT EXISTS lockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locker_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Key Requests table
CREATE TABLE IF NOT EXISTS key_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Membership Requests table
CREATE TABLE IF NOT EXISTS membership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Billing table
CREATE TABLE IF NOT EXISTS billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('locker_rental', 'service_fee', 'other')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_options JSONB,
  payment_type VARCHAR(50),
  order_type VARCHAR(50) DEFAULT 'regular',
  full_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id, selected_options)
);

-- Orders table (Transactions)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'ewallet')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  reference_number VARCHAR(100),
  order_type VARCHAR(50) DEFAULT 'merchandise' CHECK (order_type IN ('merchandise', 'insurance')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(255),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  selected_options JSONB,
  payment_type VARCHAR(50),
  order_type VARCHAR(50) DEFAULT 'regular',
  full_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages/Inbox table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_role VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  preview TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  folder VARCHAR(50) NOT NULL DEFAULT 'inbox' CHECK (folder IN ('inbox', 'sent')),
  status VARCHAR(50) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived', 'deleted')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  sku VARCHAR(100) UNIQUE NOT NULL,
  note TEXT,
  image TEXT,
  options JSONB,
  variants JSONB,
  allow_preorder BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('Maintenance', 'Services', 'Inventory', 'Registration', 'Events', 'General')),
  image_url TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock intake (inventory receiving)
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
  attachment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_message',
    'pending_order',
    'pending_membership',
    'order_completed',
    'order_cancelled',
    'membership_approved',
    'membership_rejected'
  )),
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_id_number ON users(id_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_membership_status ON users(membership_status);
CREATE INDEX idx_lockers_status ON lockers(status);
CREATE INDEX idx_lockers_assigned_to ON lockers(assigned_to);
CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_sales_created_by ON sales(created_by);
CREATE INDEX idx_sales_item_id ON sales(item_id);
CREATE INDEX idx_key_requests_user_id ON key_requests(user_id);
CREATE INDEX idx_key_requests_status ON key_requests(status);
CREATE INDEX idx_membership_requests_status ON membership_requests(status);
CREATE INDEX idx_membership_requests_user_id ON membership_requests(user_id);
CREATE INDEX idx_billing_user_id ON billing(user_id);
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_reference_number ON orders(reference_number) WHERE reference_number IS NOT NULL;
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_stock_intake_product_id ON stock_intake(product_id);
CREATE INDEX idx_stock_intake_date_received ON stock_intake(date_received);
CREATE INDEX idx_stock_intake_created_at ON stock_intake(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_recipient_role ON messages(recipient_role);
CREATE INDEX idx_messages_folder ON messages(folder);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_billing_status ON billing(status);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_announcements_category ON announcements(category);
CREATE INDEX idx_announcements_author_id ON announcements(author_id);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
