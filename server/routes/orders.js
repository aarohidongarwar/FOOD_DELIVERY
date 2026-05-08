import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  try {
    const { restaurant_id, items, delivery_address, delivery_lat, delivery_lon, payment_method, special_instructions } = req.body;
    if (!restaurant_id || !items || items.length === 0) return res.status(400).json({ error: 'Restaurant and items required' });

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurant_id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const mi = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(item.menu_item_id);
      if (!mi) continue;
      subtotal += mi.price * item.quantity;
      orderItems.push({ id: uuidv4(), menu_item_id: mi.id, name: mi.name, quantity: item.quantity, price: mi.price, special_instructions: item.special_instructions || null });
    }

    const delivery_fee = restaurant.delivery_fee || 29;
    const total_amount = subtotal + delivery_fee;
    const orderId = uuidv4();

    db.prepare('INSERT INTO orders (id,user_id,restaurant_id,status,total_amount,delivery_fee,delivery_address,delivery_lat,delivery_lon,special_instructions) VALUES (?,?,?,\'pending\',?,?,?,?,?,?)').run(orderId, req.user.id, restaurant_id, total_amount, delivery_fee, delivery_address||'', delivery_lat||null, delivery_lon||null, special_instructions||null);

    const ins = db.prepare('INSERT INTO order_items (id,order_id,menu_item_id,name,quantity,price,special_instructions) VALUES (?,?,?,?,?,?,?)');
    for (const it of orderItems) ins.run(it.id, orderId, it.menu_item_id, it.name, it.quantity, it.price, it.special_instructions);

    const payId = uuidv4();
    db.prepare('INSERT INTO payments (id,order_id,method,amount,status,transaction_id) VALUES (?,?,?,?,\'completed\',?)').run(payId, orderId, payment_method||'card', total_amount, `TXN_${Date.now()}`);

    const avDriver = db.prepare("SELECT da.*,u.name as driver_name FROM delivery_agents da JOIN users u ON da.user_id=u.id WHERE da.status='available' LIMIT 1").get();
    if (avDriver) {
      db.prepare('UPDATE orders SET driver_id=? WHERE id=?').run(avDriver.user_id, orderId);
      db.prepare("UPDATE delivery_agents SET status='busy' WHERE user_id=?").run(avDriver.user_id);
    }

    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
    const finalItems = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(orderId);
    const io = req.app.get('io');
    if (io) { io.emit('new-order', {...order, items: finalItems}); }

    res.status(201).json({...order, items: finalItems});
  } catch (err) { console.error('Place order error:', err); res.status(500).json({ error: 'Failed to place order' }); }
});

router.get('/my-orders', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare('SELECT o.*,r.name as restaurant_name,r.image_url as restaurant_image FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE o.user_id=? ORDER BY o.created_at DESC').all(req.user.id);
    for (const o of orders) o.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const order = db.prepare('SELECT o.*,r.name as restaurant_name,r.image_url as restaurant_image,r.address as restaurant_address,r.lat as restaurant_lat,r.lon as restaurant_lon FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE o.id=?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
    if (order.driver_id) order.driver = db.prepare('SELECT u.name,u.phone,da.current_lat,da.current_lon,da.rating FROM users u JOIN delivery_agents da ON da.user_id=u.id WHERE u.id=?').get(order.driver_id);
    order.payment = db.prepare('SELECT * FROM payments WHERE order_id=?').get(order.id);
    res.json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    db.prepare("UPDATE orders SET status=?,updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
    if (status === 'delivered') {
      const o = db.prepare('SELECT driver_id FROM orders WHERE id=?').get(req.params.id);
      if (o?.driver_id) db.prepare("UPDATE delivery_agents SET status='available',total_deliveries=total_deliveries+1 WHERE user_id=?").run(o.driver_id);
    }
    const order = db.prepare('SELECT o.*,r.name as restaurant_name FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE o.id=?').get(req.params.id);
    const io = req.app.get('io');
    if (io) { io.to(`order-${req.params.id}`).emit('order-status-update', {orderId: req.params.id, status}); io.emit('order-updated', order); }
    res.json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to update status' }); }
});

router.get('/restaurant/:restaurantId', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare('SELECT o.*,u.name as customer_name,u.phone as customer_phone FROM orders o JOIN users u ON o.user_id=u.id WHERE o.restaurant_id=? ORDER BY o.created_at DESC').all(req.params.restaurantId);
    for (const o of orders) o.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/:id/review', authenticateToken, (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    db.prepare('INSERT INTO reviews (id,order_id,restaurant_id,user_id,rating,comment) VALUES (?,?,?,?,?,?)').run(uuidv4(), req.params.id, order.restaurant_id, req.user.id, rating, comment||'');
    const avg = db.prepare('SELECT AVG(rating) as avg,COUNT(*) as count FROM reviews WHERE restaurant_id=?').get(order.restaurant_id);
    db.prepare('UPDATE restaurants SET rating=?,total_ratings=? WHERE id=?').run(Math.round(avg.avg*10)/10, avg.count, order.restaurant_id);
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
