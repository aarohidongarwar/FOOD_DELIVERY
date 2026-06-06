import db from './server/db.js';
async function test() {
  const driverId = '87f76db8-669d-4871-8778-6692b3226af7';
  try {
    const [orders] = await db.execute(`
      SELECT o.*, o.grand_total as total_amount, r.name as restaurant_name, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon,
             u.name as customer_name, u.phone as customer_phone, u.address as customer_address, u.lat as customer_lat, u.lon as customer_lon
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id JOIN users u ON o.user_id = u.id
      WHERE o.driver_id = ? AND o.status IN ('driver_assigned','out_for_delivery')
      ORDER BY o.created_at DESC
    `, [driverId]);
    console.log('Orders found:', orders.length);
  } catch(e) {
    console.error('Error:', e);
  }
  process.exit(0);
}
test();
