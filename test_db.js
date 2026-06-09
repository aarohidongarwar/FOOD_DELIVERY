const mysql = require('mysql2/promise'); 
async function run() { 
  const db = await mysql.createPool({ host: 'localhost', user: 'root', password: 'Password', database: 'quickbite_db' }); 
  try { 
    await db.query(`SELECT r.id, r.name, COALESCE(SUM(o.restaurant_earnings), 0) as total_earnings, COUNT(o.id) as orders, (SELECT COALESCE(SUM(amount), 0) FROM settlements WHERE entity_type='restaurant' AND entity_id=r.id) as total_settled FROM restaurants r LEFT JOIN orders o ON r.id=o.restaurant_id AND o.status='delivered' GROUP BY r.id, r.name ORDER BY total_earnings DESC`); 
    console.log('Query 1 Success'); 
  } catch(e) { 
    console.error('Query 1 Error:', e.message); 
  } 
  try { 
    await db.query(`SELECT u.id, u.name, COALESCE(SUM(o.delivery_fee), 0) as total_earnings, COUNT(o.id) as deliveries, (SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE driver_id=u.id AND status='delivered' AND payment_method='COD') as cash_in_hand, (SELECT COALESCE(SUM(amount), 0) FROM settlements WHERE entity_type='driver' AND entity_id=u.id) as total_settled FROM users u LEFT JOIN orders o ON o.driver_id=u.id AND o.status='delivered' WHERE u.role='driver' GROUP BY u.id, u.name ORDER BY total_earnings DESC`); 
    console.log('Query 2 Success'); 
  } catch(e) { 
    console.error('Query 2 Error:', e.message); 
  } 
  process.exit(); 
} 
run();
