import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'quickbite_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true // Important: allows using :param syntax similar to SQLite
});

// A wrapper to make the transition from better-sqlite3 smoother
// NOTE: This is a basic wrapper. Actual route logic needs to be refactored 
// to use asynchronous await db.execute() instead of synchronous better-sqlite3 calls.
const db = {
  pool,
  execute: async (sql, params) => {
    return await pool.execute(sql, params);
  },
  query: async (sql, params) => {
    return await pool.query(sql, params);
  }
};

export default db;
