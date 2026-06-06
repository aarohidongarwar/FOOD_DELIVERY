import db from './server/db.js';
async function check() {
  // Find Rushikesh's user
  const [users] = await db.execute("SELECT id, name, email FROM users WHERE name LIKE '%rushikesh%' OR name LIKE '%Rushikesh%'");
  console.log('Users matching Rushikesh:', users);

  if (users.length > 0) {
    const userId = users[0].id;
    // Find all orders by this user
    const [orders] = await db.execute(
      `SELECT o.id, o.status, o.grand_total, o.created_at, r.name as restaurant_name, o.driver_id
       FROM orders o 
       LEFT JOIN restaurants r ON o.restaurant_id = r.id 
       WHERE o.user_id = ? 
       ORDER BY o.created_at DESC`, [userId]
    );
    console.log(`\nAll orders by ${users[0].name} (${orders.length} total):`);
    orders.forEach(o => {
      console.log(`  ${o.id} | ${o.restaurant_name} | ${o.status} | ₹${o.grand_total} | ${o.created_at}`);
    });
  }

  // Also check ALL orders to see the full picture
  const [allOrders] = await db.execute(
    `SELECT o.id, o.user_id, o.status, o.grand_total, o.created_at, r.name as restaurant_name, u.name as customer_name
     FROM orders o 
     LEFT JOIN restaurants r ON o.restaurant_id = r.id 
     LEFT JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC`
  );
  console.log(`\nAll orders in system (${allOrders.length} total):`);
  allOrders.forEach(o => {
    console.log(`  ${o.id.substring(0,8)} | ${o.customer_name} | ${o.restaurant_name} | ${o.status} | ₹${o.grand_total} | ${o.created_at}`);
  });

  process.exit(0);
}
check();
