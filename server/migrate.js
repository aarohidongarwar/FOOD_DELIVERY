import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'app.db');
const db = new Database(dbPath);

console.log('Running migration...');

try {
  const columns = db.prepare('PRAGMA table_info(delivery_agents)').all().map(c => c.name);
  
  const newColumns = [
    ['vehicle_type', 'TEXT'],
    ['vehicle_number', 'TEXT'],
    ['license_number', 'TEXT'],
    ['emergency_contact', 'TEXT']
  ];

  for (const [name, type] of newColumns) {
    if (!columns.includes(name)) {
      console.log(`Adding column ${name}...`);
      db.prepare(`ALTER TABLE delivery_agents ADD COLUMN ${name} ${type}`).run();
    }
  }
  
  console.log('Migration successful!');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
}
