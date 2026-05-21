import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'app.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','restaurant','driver','admin')),
    avatar_url TEXT,
    address TEXT,
    lat REAL,
    lon REAL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    rating REAL DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    lat REAL,
    lon REAL,
    cuisine_type TEXT,
    image_url TEXT,
    banner_url TEXT,
    is_active INTEGER DEFAULT 1,
    delivery_time TEXT DEFAULT '30-40 min',
    delivery_fee REAL DEFAULT 29,
    min_order REAL DEFAULT 99,
    is_grocery INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'Main Course',
    is_veg INTEGER DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    is_bestseller INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    driver_id TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
    total_amount REAL NOT NULL,
    delivery_fee REAL DEFAULT 29,
    delivery_address TEXT,
    delivery_lat REAL,
    delivery_lon REAL,
    special_instructions TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price REAL NOT NULL,
    special_instructions TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );

  CREATE TABLE IF NOT EXISTS delivery_agents (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'offline' CHECK(status IN ('available','busy','offline')),
    current_lat REAL,
    current_lon REAL,
    rating REAL DEFAULT 5.0,
    total_deliveries INTEGER DEFAULT 0,
    vehicle_type TEXT,
    vehicle_number TEXT,
    license_number TEXT,
    emergency_contact TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    method TEXT DEFAULT 'card' CHECK(method IN ('card','upi','cod','wallet')),
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','failed','refunded')),
    transaction_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    restaurant_id TEXT,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    menu_item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT DEFAULT 'flat' CHECK(discount_type IN ('flat','percent')),
    discount_value REAL NOT NULL,
    min_order REAL DEFAULT 0,
    max_discount REAL,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TEXT,
    valid_until TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Simple migration check for delivery_agents
const columns = db.prepare('PRAGMA table_info(delivery_agents)').all().map(c => c.name);
const newColumns = [
  ['vehicle_type', 'TEXT'],
  ['vehicle_number', 'TEXT'],
  ['license_number', 'TEXT'],
  ['emergency_contact', 'TEXT']
];

for (const [name, type] of newColumns) {
  if (!columns.includes(name)) {
    try {
      db.prepare(`ALTER TABLE delivery_agents ADD COLUMN ${name} ${type}`).run();
    } catch (e) {
      console.warn(`Could not add column ${name}:`, e.message);
    }
  }
}

export default db;
