import db from './server/db.js';

async function alterDb() {
  try {
    await db.execute("ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'restaurant', 'driver', 'admin', 'grocery') DEFAULT 'customer'");
    console.log("Successfully altered users table to support grocery role.");
    process.exit(0);
  } catch (err) {
    console.error("Error altering db:", err);
    process.exit(1);
  }
}

alterDb();
