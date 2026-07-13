const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quickbite_db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Disabling foreign key checks...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');

    const tablesToClear = [
      'orders',
      'order_items',
      'order_item_addons',
      'delivery_assignments',
      'delivery_tracking',
      'wallet_transactions',
      'notifications',
      'user_favorites',
      'support_tickets',
      'payments',
      'reviews',
      'cart_items',
      'settlements'
    ];

    for (const table of tablesToClear) {
      console.log(`Clearing ${table}...`);
      await pool.query(`TRUNCATE TABLE ${table}`);
    }

    // Reset wallets balance if needed? Wait, if we keep users we might keep wallet balances.
    // Let's reset wallet balance to 0 for consistency since transactions are gone.
    console.log('Resetting wallet balances...');
    await pool.query(`UPDATE wallets SET balance = 0`);
    
    // Also reset total earnings for delivery agents
    console.log('Resetting driver earnings...');
    await pool.query(`UPDATE delivery_agents SET total_earnings = 0, total_deliveries = 0`);
    
    // Also reset restaurant stats
    console.log('Resetting restaurant stats...');
    await pool.query(`UPDATE restaurants SET total_ratings = 0, rating = 0`);

    console.log('Enabling foreign key checks...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('All transactional data cleared successfully. Master profiles remain intact.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clearData();
