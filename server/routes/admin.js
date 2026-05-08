import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Dashboard stats
router.get('/stats', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const totalRevenue = db.prepare("SELECT SUM(total_amount) as total FROM orders WHERE status='delivered'").get();
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalRestaurants = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
    const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at)=date('now')").get();
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending','confirmed','preparing')").get();
    const activeDrivers = db.prepare("SELECT COUNT(*) as count FROM delivery_agents WHERE status='available'").get();

    // Orders by status
    const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();
    
    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, u.name as customer_name, r.name as restaurant_name
      FROM orders o JOIN users u ON o.user_id=u.id JOIN restaurants r ON o.restaurant_id=r.id
      ORDER BY o.created_at DESC LIMIT 20
    `).all();

    // Revenue by day (last 7 days)
    const revenueByDay = db.prepare(`
      SELECT date(created_at) as date, SUM(total_amount) as revenue, COUNT(*) as orders
      FROM orders WHERE status='delivered' AND created_at >= datetime('now','-7 days')
      GROUP BY date(created_at) ORDER BY date
    `).all();

    res.json({
      totalOrders: totalOrders.count,
      totalRevenue: totalRevenue.total || 0,
      totalUsers: totalUsers.count,
      totalRestaurants: totalRestaurants.count,
      todayOrders: todayOrders.count,
      pendingOrders: pendingOrders.count,
      activeDrivers: activeDrivers.count,
      ordersByStatus,
      recentOrders,
      revenueByDay
    });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// All orders with filters
router.get('/orders', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { status, search } = req.query;
    let q = 'SELECT o.*,u.name as customer_name,r.name as restaurant_name FROM orders o JOIN users u ON o.user_id=u.id JOIN restaurants r ON o.restaurant_id=r.id';
    const params = [];
    const conditions = [];
    if (status) { conditions.push('o.status=?'); params.push(status); }
    if (search) { conditions.push('(u.name LIKE ? OR r.name LIKE ? OR o.id LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
    q += ' ORDER BY o.created_at DESC LIMIT 100';
    const orders = db.prepare(q).all(...params);
    for (const o of orders) o.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// All users
router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const users = db.prepare('SELECT id,name,email,role,phone,created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Refund order
router.post('/refund/:orderId', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare("UPDATE orders SET status='cancelled' WHERE id=?").run(req.params.orderId);
    db.prepare("UPDATE payments SET status='refunded' WHERE order_id=?").run(req.params.orderId);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
