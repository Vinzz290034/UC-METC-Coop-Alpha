-- UC METC SILMS - Insert Admin & Staff Accounts
-- =============================================
-- IMPORTANT: Passwords must be bcrypt hashed (salt rounds: 10)
-- This script provides two options for account creation

-- ============================================================
-- OPTION 1: Using pre-generated bcrypt hashed passwords
-- ============================================================
-- Password hashes below are for the plain text passwords shown
-- You can generate these using the helper script: generate-hashes.js

-- ============================================================
-- INSERT ADMIN ACCOUNT
-- ============================================================
-- Plain text password: Admin@2026 (Change this immediately after login!)
-- Bcrypt hash (salt 10): $2a$10$[REPLACE_WITH_GENERATED_HASH]

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
  '$2a$10$REPLACE_WITH_BCRYPT_HASH_HERE',  -- Use hash from generate-hashes.js
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
);

-- ============================================================
-- INSERT STAFF ACCOUNTS (Examples - modify as needed)
-- ============================================================
-- Plain text password: Staff@2026 (Change this immediately after login!)
-- Bcrypt hash (salt 10): $2a$10$[REPLACE_WITH_GENERATED_HASH]

-- Staff Account #1 - Inventory Manager
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
  '$2a$10$REPLACE_WITH_BCRYPT_HASH_HERE',  -- Use hash from generate-hashes.js
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
);

-- Staff Account #2 - Sales Manager
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
  '$2a$10$REPLACE_WITH_BCRYPT_HASH_HERE',  -- Use hash from generate-hashes.js
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
);

-- Staff Account #3 - Locker Manager
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
  '$2a$10$REPLACE_WITH_BCRYPT_HASH_HERE',  -- Use hash from generate-hashes.js
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
);

-- ============================================================
-- VERIFY INSERTED ACCOUNTS
-- ============================================================
SELECT id, email, id_number, first_name, last_name, role, status 
FROM users 
WHERE role IN ('admin', 'staff') 
ORDER BY created_at DESC;
