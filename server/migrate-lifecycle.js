import db from './db.js';

/**
 * Migration: Order Lifecycle Overhaul
 * 
 * Adds new statuses, OTP columns, timestamps, and delivery_assignments table
 * to support the professional order lifecycle flow.
 * 
 * Safe to run multiple times (uses IF NOT EXISTS / IGNORE patterns).
 */
async function migrateLifecycle() {
  const connection = await db.pool.getConnection();
  try {
    console.log('🔄 Starting Order Lifecycle Migration...\n');

    // 1. Expand the order status enum
    console.log('1️⃣  Expanding order status enum...');
    await connection.query(`
      ALTER TABLE orders 
      MODIFY COLUMN status ENUM(
        'pending', 'accepted', 'confirmed', 'preparing', 'ready_for_pickup', 
        'driver_assigned', 'out_for_delivery', 'delivered', 'cancelled'
      ) DEFAULT 'pending'
    `);
    console.log('   ✅ Status enum expanded\n');

    // 2. Add new columns to orders table
    console.log('2️⃣  Adding lifecycle columns to orders...');
    const newColumns = [
      { name: 'estimated_prep_time', def: 'INT DEFAULT NULL AFTER special_instructions' },
      { name: 'pickup_otp', def: "VARCHAR(6) DEFAULT NULL AFTER estimated_prep_time" },
      { name: 'delivery_otp', def: "VARCHAR(6) DEFAULT NULL AFTER pickup_otp" },
      { name: 'accepted_at', def: 'TIMESTAMP NULL DEFAULT NULL AFTER delivery_otp' },
      { name: 'ready_at', def: 'TIMESTAMP NULL DEFAULT NULL AFTER accepted_at' },
      { name: 'picked_up_at', def: 'TIMESTAMP NULL DEFAULT NULL AFTER ready_at' },
      { name: 'delivered_at', def: 'TIMESTAMP NULL DEFAULT NULL AFTER picked_up_at' },
      { name: 'cancelled_at', def: 'TIMESTAMP NULL DEFAULT NULL AFTER delivered_at' },
      { name: 'cancel_reason', def: 'TEXT DEFAULT NULL AFTER cancelled_at' },
    ];

    for (const col of newColumns) {
      try {
        await connection.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.def}`);
        console.log(`   ✅ Added column: ${col.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ⏭️  Column ${col.name} already exists, skipping`);
        } else {
          throw err;
        }
      }
    }

    // 3. Create delivery_assignments table
    console.log('\n3️⃣  Creating delivery_assignments table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS delivery_assignments (
        id VARCHAR(36) PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        driver_id VARCHAR(36) NOT NULL,
        status ENUM('pending', 'accepted', 'declined', 'timeout') DEFAULT 'pending',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP NULL DEFAULT NULL,
        decline_reason TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✅ delivery_assignments table ready\n');

    // 4. Migrate existing data: map old 'confirmed' status to 'accepted'
    console.log('4️⃣  Migrating existing order data...');
    const [updated] = await connection.query(`
      UPDATE orders SET status = 'accepted' WHERE status = 'confirmed'
    `);
    console.log(`   ✅ Migrated ${updated.affectedRows} orders from 'confirmed' → 'accepted'\n`);

    console.log('🎉 Order Lifecycle Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrateLifecycle();
