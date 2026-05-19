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
