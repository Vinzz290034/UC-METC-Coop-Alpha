import pkg from 'pg';
import { config } from './config.js';

const { Pool } = pkg;

export const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connected successfully');
    return true;
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    return false;
  }
}
