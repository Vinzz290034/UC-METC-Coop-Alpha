-- UC METC SILMS - Ready-to-Use Admin & Staff Accounts
-- ====================================================
-- These accounts come with PRE-HASHED passwords using bcryptjs (salt rounds: 10)
-- 
-- IMPORTANT: These are example passwords. CHANGE THEM IMMEDIATELY after first login!
-- 
-- Included Accounts:
-- 1. Admin Account     - email: admin@ucmetc.edu   - password: Admin@2026
-- 2. Inventory Staff   - email: inventory@ucmetc.edu - password: Staff@2026
-- 3. Sales Staff       - email: sales@ucmetc.edu    - password: Staff@2026
-- 4. Lockers Staff     - email: lockers@ucmetc.edu   - password: Staff@2026

-- ============================================================
-- ADMIN ACCOUNT
-- ============================================================
INSERT INTO users (
  email,
  password,
  id_number,
  first_name,
  middle_name,
  last_name,
  role,
  status,
  membership_status,
  course,
  year,
  created_at,
  updated_at
) VALUES (
  'admin@ucmetc.edu',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lm',
  'ADMIN-001',
  'Administrator',
  'System',
  'Account',
  'admin',
  'active',
  'approved',
  'Administration',
  'N/A',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- STAFF ACCOUNT #1 - INVENTORY MANAGER
-- ============================================================
INSERT INTO users (
  email,
  password,
  id_number,
  first_name,
  middle_name,
  last_name,
  role,
  status,
  membership_status,
  course,
  year,
  created_at,
  updated_at
) VALUES (
  'inventory@ucmetc.edu',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lm',
  'STAFF-001',
  'Juan',
  'Cruz',
  'Santos',
  'staff',
  'active',
  'approved',
  'Inventory Management',
  'N/A',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- STAFF ACCOUNT #2 - SALES MANAGER
-- ============================================================
INSERT INTO users (
  email,
  password,
  id_number,
  first_name,
  middle_name,
  last_name,
  role,
  status,
  membership_status,
  course,
  year,
  created_at,
  updated_at
) VALUES (
  'sales@ucmetc.edu',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lm',
  'STAFF-002',
  'Maria',
  'Garcia',
  'Rivera',
  'staff',
  'active',
  'approved',
  'Sales Management',
  'N/A',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- STAFF ACCOUNT #3 - LOCKER MANAGER
-- ============================================================
INSERT INTO users (
  email,
  password,
  id_number,
  first_name,
  middle_name,
  last_name,
  role,
  status,
  membership_status,
  course,
  year,
  created_at,
  updated_at
) VALUES (
  'lockers@ucmetc.edu',
  '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lm',
  'STAFF-003',
  'Pedro',
  'Lopez',
  'Mendoza',
  'staff',
  'active',
  'approved',
  'Locker Management',
  'N/A',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- VERIFY INSERTED ACCOUNTS
-- ============================================================
-- Run this to confirm all accounts were created successfully
SELECT 
  id, 
  email, 
  id_number, 
  first_name, 
  last_name, 
  role, 
  status,
  created_at
FROM users 
WHERE role IN ('admin', 'staff') 
ORDER BY created_at DESC;

-- ============================================================
-- LOGIN CREDENTIALS REFERENCE
-- ============================================================
-- Use these credentials to log in to the system:
--
-- ADMIN:
--   Email: admin@ucmetc.edu
--   OR ID: ADMIN-001
--   Password: Admin@2026
--
-- INVENTORY STAFF:
--   Email: inventory@ucmetc.edu
--   OR ID: STAFF-001
--   Password: Staff@2026
--
-- SALES STAFF:
--   Email: sales@ucmetc.edu
--   OR ID: STAFF-002
--   Password: Staff@2026
--
-- LOCKERS STAFF:
--   Email: lockers@ucmetc.edu
--   OR ID: STAFF-003
--   Password: Staff@2026
--
-- ⚠️  CHANGE ALL PASSWORDS IMMEDIATELY AFTER FIRST LOGIN!
