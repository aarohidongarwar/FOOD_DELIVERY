import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get available orders for drivers
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, o.grand_total as total_amount, r.name as restaurant_name, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.status = 'confirmed' AND o.driver_id IS NULL
      ORDER BY o.created_at DESC
    `);
    for (const o of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [o.id]);
      o.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get driver's active deliveries
router.get('/my-deliveries', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, o.grand_total as total_amount, r.name as restaurant_name, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon,
             u.name as customer_name, u.phone as customer_phone, u.address as customer_address
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id JOIN users u ON o.user_id = u.id
      WHERE o.driver_id = ? AND o.status IN ('confirmed','preparing','out_for_delivery')
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    for (const o of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [o.id]);
      o.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get driver's delivery history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, o.grand_total as total_amount, r.name as restaurant_name FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.driver_id = ? AND o.status IN ('delivered','cancelled')
      ORDER BY o.created_at DESC LIMIT 50
    `, [req.user.id]);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Accept delivery
router.post('/accept/:orderId', authenticateToken, async (req, res) => {
  try {
    const [orderRows] = await db.execute('SELECT * FROM orders WHERE id=?', [req.params.orderId]);
    if (!orderRows[0]) return res.status(404).json({ error: 'Order not found' });
    
    await db.execute('UPDATE orders SET driver_id=? WHERE id=?', [req.user.id, req.params.orderId]);
    await db.execute("UPDATE delivery_agents SET status='busy' WHERE user_id=?", [req.user.id]);
    
    const io = req.app.get('io');
    if (io) io.to(`order-${req.params.orderId}`).emit('driver-assigned', { orderId: req.params.orderId, driverId: req.user.id });
    
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Update driver location
router.post('/location', authenticateToken, async (req, res) => {
  try {
    const { lat, lon } = req.body;
    await db.execute('UPDATE delivery_agents SET current_lat=?, current_lon=? WHERE user_id=?', [lat, lon, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Toggle driver status
router.post('/toggle-status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE delivery_agents SET status=? WHERE user_id=?', [status, req.user.id]);
    const [agents] = await db.execute('SELECT * FROM delivery_agents WHERE user_id=?', [req.user.id]);
    res.json(agents[0]);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get driver stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [agents] = await db.execute('SELECT * FROM delivery_agents WHERE user_id=?', [req.user.id]);
    const agent = agents[0];
    const [todayRows] = await db.execute("SELECT COUNT(*) as count FROM orders WHERE driver_id=? AND DATE(created_at)=CURDATE()", [req.user.id]);
    const [earningsRows] = await db.execute("SELECT COALESCE(SUM(delivery_fee),0) as total FROM orders WHERE driver_id=? AND status='delivered'", [req.user.id]);
    res.json({ ...agent, todayOrders: todayRows[0].count, totalEarnings: earningsRows[0].total || 0 });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
