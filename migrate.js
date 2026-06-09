import db from './server/db.js';

async function migrate() {
  try {
    console.log("Running migrations...");
    
    // Add columns to orders table if they don't exist
    try {
        await db.execute("ALTER TABLE orders ADD COLUMN payment_method ENUM('COD', 'ONLINE') DEFAULT 'ONLINE'");
    } catch(e) { console.log(e.message) }
    
    try {
        await db.execute("ALTER TABLE orders ADD COLUMN payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending'");
    } catch(e) { console.log(e.message) }

    try {
        await db.execute("ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0.00");
    } catch(e) { console.log(e.message) }

    try {
        await db.execute("ALTER TABLE orders ADD COLUMN restaurant_earnings DECIMAL(10,2) DEFAULT 0.00");
    } catch(e) { console.log(e.message) }

    // Create settlements table
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS settlements (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                paid_at TIMESTAMP NULL DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log("Settlements table created/checked.");
    } catch(e) { console.log(e.message) }
    
    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
