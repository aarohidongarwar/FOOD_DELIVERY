const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createPool({ host: 'localhost', user: 'root', password: 'Password', database: 'quickbite_db' });
  try {
    await db.query('DROP TABLE IF EXISTS settlements;');
    await db.query(`
      CREATE TABLE settlements (
        id VARCHAR(36) PRIMARY KEY,
        entity_type ENUM('restaurant', 'driver') NOT NULL,
        entity_id VARCHAR(36) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'completed') DEFAULT 'pending',
        transaction_ref VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('Table recreated successfully');
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit();
}
run();
