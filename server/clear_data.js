import db from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const clearDatabase = async () => {
  console.log('🧹 Clearing predefined data...');
  try {
    const tablesToClear = [
      'wallet_transactions',
      'wallets',
      'cart_items',
      'reviews',
      'payments',
      'order_item_addons',
      'order_items',
      'orders',
      'delivery_tracking',
      'delivery_agents',
      'menu_item_addons',
      'menu_items',
      'restaurant_timings',
      'restaurants',
      'promo_codes',
      'users'
    ];

    for (const table of tablesToClear) {
      await db.execute(`DELETE FROM ${table}`);
      console.log(`Cleared ${table}`);
    }

    // Recreate admin user so you can still log into the admin dashboard
    console.log('Recreating admin user...');
    const passwordHash = bcrypt.hashSync('password123', 10);
    const adminId = uuidv4();
    const insertUserSql = 'INSERT INTO users (id, name, email, password_hash, phone, role, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    await db.execute(insertUserSql, [adminId, 'Admin User', 'admin@quickbite.com', passwordHash, '9999999999', 'admin', 'QuickBite HQ, Mumbai', "2025-01-01 10:00:00"]);
    
    const insertWalletSql = 'INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, ?)';
    const insertWalletTxnSql = 'INSERT INTO wallet_transactions (id, wallet_id, type, amount, description) VALUES (?, ?, ?, ?, ?)';
    const walletId = uuidv4();
    await db.execute(insertWalletSql, [walletId, adminId, 10000.00]);
    await db.execute(insertWalletTxnSql, [uuidv4(), walletId, 'credit', 10000.00, 'Initial Signup Balance']);

    console.log('✅ All predefined data cleared successfully!');
  } catch (err) {
    console.error('❌ Error clearing database:', err);
  } finally {
    process.exit(0);
  }
};

clearDatabase();
