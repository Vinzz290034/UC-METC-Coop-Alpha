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
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_preorder BOOLEAN NOT NULL DEFAULT true');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS made_to_order BOOLEAN NOT NULL DEFAULT false');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT');
    await pool.query('ALTER TABLE products ALTER COLUMN image TYPE TEXT');
    
    // Auto-migrate: ensure attachment exists in stock_intake table
    await pool.query('ALTER TABLE stock_intake ADD COLUMN IF NOT EXISTS attachment TEXT');

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
