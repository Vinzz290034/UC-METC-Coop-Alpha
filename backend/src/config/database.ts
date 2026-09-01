import pkg from 'pg';
import { config } from './config.js';

const { Pool } = pkg;

const isProduction = config.nodeEnv === 'production';

function createPoolConfig(): pkg.PoolConfig {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    };
  }

  return {
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
  };
}

export const pool = new Pool(createPoolConfig());

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export async function testConnection() {
  try {
    if (isProduction && !process.env.DATABASE_URL) {
      console.error(
        '✗ DATABASE_URL is not set. In Railway: add PostgreSQL to the project, then on this service → Variables → ' +
          'add DATABASE_URL (reference from the Postgres service or paste the connection string).'
      );
      return false;
    }

    await pool.query('SELECT NOW()');
    console.log('✓ Database connected successfully');
    
    // Auto-migrate: ensure all required columns exist in the users table
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT true');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS course VARCHAR(100)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS year VARCHAR(50)');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN NOT NULL DEFAULT false');

    // Auto-migrate: drop NOT NULL on orders.user_id and add walk-in columns
    await pool.query('ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN NOT NULL DEFAULT false');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS walk_in_name VARCHAR(255)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS walk_in_id_number VARCHAR(100)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS walk_in_course VARCHAR(100)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS walk_in_year VARCHAR(50)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS walk_in_contact_number VARCHAR(100)');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS walk_in_membership_status VARCHAR(50)');

    // Migrate existing walk-in users data to orders table
    try {
      await pool.query(`
        UPDATE orders o
        SET is_walk_in = true,
            walk_in_name = TRIM(u.first_name || ' ' || u.last_name),
            walk_in_id_number = u.id_number,
            walk_in_course = u.course,
            walk_in_membership_status = u.membership_status
        FROM users u
        WHERE o.user_id = u.id AND u.email LIKE 'walkin-%'
      `);
      
      await pool.query(`
        UPDATE orders o
        SET user_id = NULL
        FROM users u
        WHERE o.user_id = u.id AND u.email LIKE 'walkin-%'
      `);

      const deleteResult = await pool.query("DELETE FROM users WHERE email LIKE 'walkin-%'");
      if (deleteResult.rowCount && deleteResult.rowCount > 0) {
        console.log(`✓ Cleaned up \${deleteResult.rowCount} legacy walk-in user accounts from the users table`);
      }
    } catch (cleanupErr) {
      console.error('⚠️ Failed to migrate/cleanup legacy walk-in users:', cleanupErr);
    }
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_preorder BOOLEAN NOT NULL DEFAULT true');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS made_to_order BOOLEAN NOT NULL DEFAULT false');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT');
    await pool.query('ALTER TABLE products ALTER COLUMN image TYPE TEXT');
    
    // Auto-migrate: convert legacy equipment category & EQUIP- SKUs to PPE-
    try {
      await pool.query("UPDATE products SET category = 'ppe' WHERE category = 'equipment'");
      await pool.query("UPDATE products SET sku = REPLACE(sku, 'EQUIP-', 'PPE-') WHERE sku LIKE 'EQUIP-%'");
    } catch (migErr) {
      console.warn('⚠️ Could not update legacy EQUIP- SKUs:', migErr);
    }
    
    // Auto-migrate: ensure image_url exists in announcements table
    await pool.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT');

    // Auto-migrate: ensure attachment exists in stock_intake table
    await pool.query('ALTER TABLE stock_intake ADD COLUMN IF NOT EXISTS attachment TEXT');

    // Auto-migrate: ensure attachments JSONB column exists in messages table
    await pool.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb");

    // Auto-migrate: ensure the role check constraint matches all valid TypeScript roles
    try {
      await pool.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
      await pool.query("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'staff', 'user', 'cashier', 'locker_officer', 'inventory_officer', 'manager', 'member'))");
    } catch (constraintErr) {
      console.warn('⚠️  Could not update role check constraint (might not exist yet):', constraintErr);
    }

    // Auto-migrate: ensure the orders status check constraint allows 'released'
    try {
      await pool.query('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
      await pool.query("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'completed', 'cancelled', 'released'))");
    } catch (constraintErr) {
      console.warn('⚠️  Could not update orders status check constraint:', constraintErr);
    }
    // ── Auto-migrate: extend lockers table with rental fields ──
    await pool.query("ALTER TABLE lockers ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'Main Campus'");
    await pool.query("ALTER TABLE lockers ADD COLUMN IF NOT EXISTS floor VARCHAR(100) DEFAULT 'Ground Floor'");
    await pool.query("ALTER TABLE lockers ADD COLUMN IF NOT EXISTS size VARCHAR(20) DEFAULT 'Medium'");
    await pool.query("ALTER TABLE lockers ADD COLUMN IF NOT EXISTS key_code VARCHAR(100)");

    // ── Auto-migrate: create locker_rentals table ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS locker_rentals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        locker_id UUID NOT NULL REFERENCES lockers(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        semester_count INTEGER NOT NULL DEFAULT 1,
        start_date DATE,
        end_date DATE,
        rental_fee NUMERIC(10,2) NOT NULL DEFAULT 250.00,
        deposit_fee NUMERIC(10,2) NOT NULL DEFAULT 200.00,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','terminated','expired','rejected')),
        terms_agreed BOOLEAN NOT NULL DEFAULT false,
        agreed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ── Auto-migrate: create system_settings table ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // ── Auto-migrate: update transaction RCP-1786064578456 from Swimming Set to PE Pants 2XL (keeping ₱580.00 total) ──
    try {
      await pool.query(`
        UPDATE order_items oi
        SET product_name = 'PE Pants',
            selected_options = '{"size": "2XL"}'::jsonb,
            unit_price = 290.00,
            subtotal = 580.00
        FROM orders o
        WHERE oi.order_id = o.id
          AND (o.receipt_no ILIKE '%1786064578456%' OR o.walk_in_name ILIKE '%JOHN KLENT ORNOPIA%')
          AND oi.product_name ILIKE '%swimming%'
      `);
      console.log('✓ Successfully updated transaction RCP-1786064578456 to PE Pants 2XL');
    } catch (peErr) {
      console.warn('⚠️ Could not update RCP-1786064578456 to PE Pants:', peErr);
    }

    console.log('✓ Database self-healing migrations checked and applied successfully');
    
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    if (isProduction && !process.env.DATABASE_URL) {
      console.error(
        '  Hint: App is using localhost defaults. Set DATABASE_URL in Railway Variables (not only in backend/.env on your PC).'
      );
    }
    return false;
  }
}
