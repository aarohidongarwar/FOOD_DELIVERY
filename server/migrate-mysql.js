import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  try {
    console.log('Connecting to MySQL (server root)...');
    
    // Create a temporary connection to ensure the database exists
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    const dbName = process.env.DB_NAME || 'quickbite_db';
    console.log(`Creating database "${dbName}" if it does not exist...`);
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConnection.end();

    console.log(`Successfully ensured database "${dbName}" exists!`);
    console.log('Connecting to database pool...');

    // Now connect to the pool (which relies on quickbite_db existing)
    const connection = await db.pool.getConnection();
    
    try {
      // Read schema.sql
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Split statements by semicolon
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`Found ${statements.length} statements. Executing...`);

      // Execute each statement
      for (const statement of statements) {
        // Strip out single-line comments and clean up whitespace
        const cleanStatement = statement
          .split('\n')
          .map(line => line.trim())
          .filter(line => !line.startsWith('--') && line.length > 0)
          .join('\n')
          .trim();

        if (cleanStatement.length > 0) {
           console.log('Executing:', cleanStatement.substring(0, 60).replace(/\n/g, ' ') + '...');
           await connection.query(cleanStatement);
        }
      }
      console.log('✅ Migration completed successfully!');
    } finally {
      connection.release();
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();
