import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get available orders for drivers
router.get('/available', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.status = 'confirmed' AND o.driver_id IS NULL
      ORDER BY o.created_at DESC
    `).all();
    for (const o of orders) o.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get driver's active deliveries
router.get('/my-deliveries', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon,
             u.name as customer_name, u.phone as customer_phone, u.address as customer_address
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id JOIN users u ON o.user_id = u.id
      WHERE o.driver_id = ? AND o.status IN ('confirmed','preparing','out_for_delivery')
      ORDER BY o.created_at DESC
    `).all(req.user.id);
    for (const o of orders) o.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get driver's delivery history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.driver_id = ? AND o.status IN ('delivered','cancelled')
      ORDER BY o.created_at DESC LIMIT 50
    `).all(req.user.id);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Accept delivery
router.post('/accept/:orderId', authenticateToken, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    db.prepare('UPDATE orders SET driver_id=? WHERE id=?').run(req.user.id, req.params.orderId);
    db.prepare("UPDATE delivery_agents SET status='busy' WHERE user_id=?").run(req.user.id);
    
    const io = req.app.get('io');
    if (io) io.to(`order-${req.params.orderId}`).emit('driver-assigned', { orderId: req.params.orderId, driverId: req.user.id });
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Update driver location
router.post('/location', authenticateToken, (req, res) => {
  try {
    const { lat, lon } = req.body;
    db.prepare('UPDATE delivery_agents SET current_lat=?, current_lon=? WHERE user_id=?').run(lat, lon, req.user.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Toggle driver status
router.post('/toggle-status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE delivery_agents SET status=? WHERE user_id=?').run(status, req.user.id);
    const agent = db.prepare('SELECT * FROM delivery_agents WHERE user_id=?').get(req.user.id);
    res.json(agent);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get driver stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const agent = db.prepare('SELECT * FROM delivery_agents WHERE user_id=?').get(req.user.id);
    const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE driver_id=? AND date(created_at)=date('now')").get(req.user.id);
    const totalEarnings = db.prepare("SELECT SUM(delivery_fee) as total FROM orders WHERE driver_id=? AND status='delivered'").get(req.user.id);
    res.json({ ...agent, todayOrders: todayOrders.count, totalEarnings: totalEarnings.total || 0 });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
