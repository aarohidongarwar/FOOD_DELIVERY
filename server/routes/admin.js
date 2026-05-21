import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ═══════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════
router.get('/stats', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE status='delivered'").get();
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role='customer'").get();
    const totalRestaurants = db.prepare('SELECT COUNT(*) as count FROM restaurants').get();
    const todayOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at)=date('now')").get();
    const todayRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE status='delivered' AND date(created_at)=date('now')").get();
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending','confirmed','preparing','out_for_delivery')").get();
    const activeDrivers = db.prepare("SELECT COUNT(*) as count FROM delivery_agents WHERE status='available'").get();
    const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM delivery_agents").get();
    const cancelledToday = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status='cancelled' AND date(created_at)=date('now')").get();

    // Average order value
    const avgOrderValue = db.prepare("SELECT COALESCE(AVG(total_amount),0) as avg FROM orders WHERE status='delivered'").get();

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
      SELECT date(created_at) as date, COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as orders
      FROM orders WHERE status='delivered' AND created_at >= datetime('now','-7 days')
      GROUP BY date(created_at) ORDER BY date
    `).all();

    // Top restaurants by orders
    const topRestaurants = db.prepare(`
      SELECT r.name, r.image_url, r.rating, COUNT(o.id) as order_count, COALESCE(SUM(o.total_amount),0) as total_revenue
      FROM restaurants r LEFT JOIN orders o ON r.id=o.restaurant_id AND o.status='delivered'
      GROUP BY r.id ORDER BY order_count DESC LIMIT 5
    `).all();

    // Peak hours
    const peakHours = db.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count
      FROM orders GROUP BY hour ORDER BY hour
    `).all();

    res.json({
      totalOrders: totalOrders.count,
      totalRevenue: totalRevenue.total || 0,
      totalUsers: totalUsers.count,
      totalRestaurants: totalRestaurants.count,
      todayOrders: todayOrders.count,
      todayRevenue: todayRevenue.total || 0,
      pendingOrders: pendingOrders.count,
      activeDrivers: activeDrivers.count,
      totalDrivers: totalDrivers.count,
      cancelledToday: cancelledToday.count,
      avgOrderValue: Math.round(avgOrderValue.avg) || 0,
      ordersByStatus,
      recentOrders,
      revenueByDay,
      topRestaurants,
      peakHours
    });
  } catch (err) { console.error('Stats error:', err); res.status(500).json({ error: 'Failed to fetch stats' }); }
});

// ═══════════════════════════════════════
// ORDER MANAGEMENT
// ═══════════════════════════════════════
router.get('/orders', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { status, search, date_from, date_to, page = 1, limit = 50 } = req.query;
    let q = 'SELECT o.*,u.name as customer_name,u.phone as customer_phone,u.email as customer_email,r.name as restaurant_name,d.name as driver_name FROM orders o JOIN users u ON o.user_id=u.id JOIN restaurants r ON o.restaurant_id=r.id LEFT JOIN users d ON o.driver_id=d.id';
    const params = [];
    const conditions = [];
    if (status && status !== 'all') { conditions.push('o.status=?'); params.push(status); }
    if (search) { conditions.push('(u.name LIKE ? OR r.name LIKE ? OR o.id LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (date_from) { conditions.push('date(o.created_at)>=?'); params.push(date_from); }
    if (date_to) { conditions.push('date(o.created_at)<=?'); params.push(date_to); }
    if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
    q += ' ORDER BY o.created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    q += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    
    const orders = db.prepare(q).all(...params);
    for (const o of orders) {
      o.items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
      o.payment = db.prepare('SELECT * FROM payments WHERE order_id=?').get(o.id);
    }

    // Total count for pagination
    let countQ = 'SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id=u.id JOIN restaurants r ON o.restaurant_id=r.id';
    if (conditions.length) countQ += ' WHERE ' + conditions.join(' AND ');
    const total = db.prepare(countQ).get(...params);

    res.json({ orders, total: total.total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { console.error('Orders error:', err); res.status(500).json({ error: 'Failed' }); }
});

// Update order status (admin override)
router.put('/orders/:id/status', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    
    db.prepare("UPDATE orders SET status=?,updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
    
    if (status === 'delivered') {
      const o = db.prepare('SELECT driver_id FROM orders WHERE id=?').get(req.params.id);
      if (o?.driver_id) db.prepare("UPDATE delivery_agents SET status='available',total_deliveries=total_deliveries+1 WHERE user_id=?").run(o.driver_id);
    }
    if (status === 'cancelled') {
      db.prepare("UPDATE payments SET status='refunded' WHERE order_id=?").run(req.params.id);
    }
    
    const order = db.prepare('SELECT o.*,u.name as customer_name,r.name as restaurant_name FROM orders o JOIN users u ON o.user_id=u.id JOIN restaurants r ON o.restaurant_id=r.id WHERE o.id=?').get(req.params.id);
    const io = req.app.get('io');
    if (io) { io.to(`order-${req.params.id}`).emit('order-status-update', { orderId: req.params.id, status }); }
    res.json(order);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Reassign driver
router.put('/orders/:id/reassign', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { driver_id } = req.body;
    // Release current driver
    const order = db.prepare('SELECT driver_id FROM orders WHERE id=?').get(req.params.id);
    if (order?.driver_id) {
      db.prepare("UPDATE delivery_agents SET status='available' WHERE user_id=?").run(order.driver_id);
    }
    // Assign new driver
    db.prepare('UPDATE orders SET driver_id=? WHERE id=?').run(driver_id, req.params.id);
    db.prepare("UPDATE delivery_agents SET status='busy' WHERE user_id=?").run(driver_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Cancel/Refund order
router.post('/orders/:id/cancel', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare("UPDATE orders SET status='cancelled',updated_at=datetime('now') WHERE id=?").run(req.params.id);
    db.prepare("UPDATE payments SET status='refunded' WHERE order_id=?").run(req.params.id);
    const o = db.prepare('SELECT driver_id FROM orders WHERE id=?').get(req.params.id);
    if (o?.driver_id) db.prepare("UPDATE delivery_agents SET status='available' WHERE user_id=?").run(o.driver_id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ═══════════════════════════════════════
// DRIVER MANAGEMENT
// ═══════════════════════════════════════
router.get('/drivers', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at, da.status, da.rating, da.total_deliveries, da.current_lat, da.current_lon,
             (SELECT COALESCE(SUM(delivery_fee),0) FROM orders WHERE driver_id=u.id AND status='delivered') as total_earnings,
             (SELECT COUNT(*) FROM orders WHERE driver_id=u.id AND date(created_at)=date('now')) as today_orders
      FROM users u JOIN delivery_agents da ON da.user_id=u.id
      WHERE u.role='driver' ORDER BY da.total_deliveries DESC
    `).all();
    res.json(drivers);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.get('/drivers/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const driver = db.prepare(`
      SELECT u.*, da.status as agent_status, da.rating, da.total_deliveries, da.current_lat, da.current_lon,
             (SELECT COALESCE(SUM(delivery_fee),0) FROM orders WHERE driver_id=u.id AND status='delivered') as total_earnings
      FROM users u JOIN delivery_agents da ON da.user_id=u.id WHERE u.id=?
    `).get(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    
    const recentDeliveries = db.prepare(`
      SELECT o.id, o.status, o.total_amount, o.delivery_fee, o.created_at, r.name as restaurant_name
      FROM orders o JOIN restaurants r ON o.restaurant_id=r.id
      WHERE o.driver_id=? ORDER BY o.created_at DESC LIMIT 20
    `).all(req.params.id);
    
    res.json({ ...driver, recentDeliveries });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/drivers/:id/status', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { status } = req.body;
    db.prepare('UPDATE delivery_agents SET status=? WHERE user_id=?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ═══════════════════════════════════════
// RESTAURANT MANAGEMENT
// ═══════════════════════════════════════
router.get('/restaurants', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const restaurants = db.prepare(`
      SELECT r.*, u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM orders WHERE restaurant_id=r.id) as total_orders,
             (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE restaurant_id=r.id AND status='delivered') as total_revenue,
             (SELECT COUNT(*) FROM menu_items WHERE restaurant_id=r.id) as menu_count
      FROM restaurants r LEFT JOIN users u ON r.owner_id=u.id
      ORDER BY r.rating DESC
    `).all();
    res.json(restaurants);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/restaurants/:id/toggle', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const rest = db.prepare('SELECT is_active FROM restaurants WHERE id=?').get(req.params.id);
    const newStatus = rest.is_active ? 0 : 1;
    db.prepare('UPDATE restaurants SET is_active=? WHERE id=?').run(newStatus, req.params.id);
    res.json({ success: true, is_active: newStatus });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/restaurants/:id/analytics', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const rest = db.prepare('SELECT * FROM restaurants WHERE id=?').get(req.params.id);
    const ordersByDay = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count, SUM(total_amount) as revenue
      FROM orders WHERE restaurant_id=? AND created_at >= datetime('now','-30 days')
      GROUP BY date(created_at) ORDER BY date
    `).all(req.params.id);
    const topItems = db.prepare(`
      SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.price*oi.quantity) as total_revenue
      FROM order_items oi JOIN orders o ON oi.order_id=o.id
      WHERE o.restaurant_id=? GROUP BY oi.menu_item_id ORDER BY total_qty DESC LIMIT 5
    `).all(req.params.id);
    const reviews = db.prepare(`
      SELECT rv.*, u.name as user_name FROM reviews rv JOIN users u ON rv.user_id=u.id
      WHERE rv.restaurant_id=? ORDER BY rv.created_at DESC LIMIT 10
    `).all(req.params.id);
    res.json({ ...rest, ordersByDay, topItems, reviews });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ═══════════════════════════════════════
// CUSTOMER MANAGEMENT
// ═══════════════════════════════════════
router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { search, role } = req.query;
    let q = `SELECT u.id, u.name, u.email, u.phone, u.role, u.address, u.created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id=u.id) as order_count,
             (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE user_id=u.id AND status='delivered') as total_spent
             FROM users u`;
    const conditions = [];
    const params = [];
    if (role && role !== 'all') { conditions.push('u.role=?'); params.push(role); }
    if (search) { conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
    q += ' ORDER BY u.created_at DESC';
    const users = db.prepare(q).all(...params);
    res.json(users);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/users/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const user = db.prepare(`SELECT id,name,email,phone,role,address,created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id=?) as order_count,
      (SELECT COALESCE(SUM(total_amount),0) FROM orders WHERE user_id=? AND status='delivered') as total_spent
      FROM users WHERE id=?`).get(req.params.id, req.params.id, req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const orders = db.prepare(`
      SELECT o.id, o.status, o.total_amount, o.created_at, r.name as restaurant_name
      FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE o.user_id=?
      ORDER BY o.created_at DESC LIMIT 20
    `).all(req.params.id);
    res.json({ ...user, orders });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ═══════════════════════════════════════
// FINANCE
// ═══════════════════════════════════════
router.get('/finance/overview', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE status='delivered'").get();
    const todayRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE status='delivered' AND date(created_at)=date('now')").get();
    const monthRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as total FROM orders WHERE status='delivered' AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')").get();
    const totalDeliveryFees = db.prepare("SELECT COALESCE(SUM(delivery_fee),0) as total FROM orders WHERE status='delivered'").get();
    const totalRefunds = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='refunded'").get();
    
    const paymentMethods = db.prepare(`
      SELECT method, COUNT(*) as count, COALESCE(SUM(amount),0) as total
      FROM payments WHERE status='completed' GROUP BY method
    `).all();

    const revenueByDay = db.prepare(`
      SELECT date(created_at) as date, COALESCE(SUM(total_amount),0) as revenue
      FROM orders WHERE status='delivered' AND created_at >= datetime('now','-30 days')
      GROUP BY date(created_at) ORDER BY date
    `).all();

    // Restaurant payouts (total revenue per restaurant)
    const restaurantPayouts = db.prepare(`
      SELECT r.name, COALESCE(SUM(o.total_amount - o.delivery_fee),0) as payout, COUNT(o.id) as orders
      FROM restaurants r LEFT JOIN orders o ON r.id=o.restaurant_id AND o.status='delivered'
      GROUP BY r.id ORDER BY payout DESC
    `).all();

    // Driver payouts
    const driverPayouts = db.prepare(`
      SELECT u.name, COALESCE(SUM(o.delivery_fee),0) as earnings, COUNT(o.id) as deliveries
      FROM users u JOIN orders o ON o.driver_id=u.id AND o.status='delivered'
      WHERE u.role='driver' GROUP BY u.id ORDER BY earnings DESC
    `).all();

    res.json({
      totalRevenue: totalRevenue.total,
      todayRevenue: todayRevenue.total,
      monthRevenue: monthRevenue.total,
      totalDeliveryFees: totalDeliveryFees.total,
      totalRefunds: totalRefunds.total,
      paymentMethods,
      revenueByDay,
      restaurantPayouts,
      driverPayouts
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.get('/finance/transactions', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { method, status } = req.query;
    let q = `SELECT p.*, o.id as order_id, u.name as customer_name, r.name as restaurant_name
      FROM payments p JOIN orders o ON p.order_id=o.id JOIN users u ON o.user_id=u.id JOIN restaurants r ON o.restaurant_id=r.id`;
    const conditions = [];
    const params = [];
    if (method) { conditions.push('p.method=?'); params.push(method); }
    if (status) { conditions.push('p.status=?'); params.push(status); }
    if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
    q += ' ORDER BY p.created_at DESC LIMIT 100';
    const transactions = db.prepare(q).all(...params);
    res.json(transactions);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ═══════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════
router.get('/analytics/revenue', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    let groupBy, dateRange;
    if (period === 'monthly') { groupBy = "strftime('%Y-%m', created_at)"; dateRange = '-365 days'; }
    else if (period === 'weekly') { groupBy = "strftime('%Y-%W', created_at)"; dateRange = '-90 days'; }
    else { groupBy = 'date(created_at)'; dateRange = '-30 days'; }

    const data = db.prepare(`
      SELECT ${groupBy} as period, COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as orders
      FROM orders WHERE status='delivered' AND created_at >= datetime('now','${dateRange}')
      GROUP BY ${groupBy} ORDER BY period
    `).all();
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/analytics/orders', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    // Peak hours
    const peakHours = db.prepare(`
      SELECT CAST(strftime('%H', created_at) AS INTEGER) as hour, COUNT(*) as count
      FROM orders GROUP BY hour ORDER BY hour
    `).all();

    // Status distribution
    const statusDist = db.prepare('SELECT status, COUNT(*) as count FROM orders GROUP BY status').all();

    // Cancellation rate trend (by day)
    const cancellationTrend = db.prepare(`
      SELECT date(created_at) as date,
             COUNT(*) as total,
             SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM orders WHERE created_at >= datetime('now','-30 days')
      GROUP BY date(created_at) ORDER BY date
    `).all();

    // Average delivery time (placeholder - we don't track actual delivery times)
    const avgOrdersPerDay = db.prepare(`
      SELECT COALESCE(AVG(cnt),0) as avg FROM (SELECT COUNT(*) as cnt FROM orders GROUP BY date(created_at))
    `).get();

    res.json({ peakHours, statusDist, cancellationTrend, avgOrdersPerDay: Math.round(avgOrdersPerDay.avg) });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/analytics/top-items', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const topItems = db.prepare(`
      SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.price * oi.quantity) as total_revenue, r.name as restaurant_name
      FROM order_items oi JOIN orders o ON oi.order_id=o.id JOIN restaurants r ON o.restaurant_id=r.id
      WHERE o.status='delivered'
      GROUP BY oi.menu_item_id ORDER BY total_qty DESC LIMIT 10
    `).all();
    res.json(topItems);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// ═══════════════════════════════════════
// PROMO CODES
// ═══════════════════════════════════════
router.get('/promos', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const promos = db.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
    res.json(promos);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/promos', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until } = req.body;
    if (!code || !discount_value) return res.status(400).json({ error: 'Code and discount value required' });
    const id = uuidv4();
    db.prepare('INSERT INTO promo_codes (id,code,description,discount_type,discount_value,min_order,max_discount,usage_limit,valid_from,valid_until) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, code.toUpperCase(), description||'', discount_type||'flat', discount_value, min_order||0, max_discount||null, usage_limit||null, valid_from||null, valid_until||null);
    const promo = db.prepare('SELECT * FROM promo_codes WHERE id=?').get(id);
    res.status(201).json(promo);
  } catch (err) {
    if (err.message?.includes('UNIQUE')) return res.status(400).json({ error: 'Promo code already exists' });
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/promos/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until, is_active } = req.body;
    db.prepare(`UPDATE promo_codes SET code=?,description=?,discount_type=?,discount_value=?,min_order=?,max_discount=?,usage_limit=?,valid_from=?,valid_until=?,is_active=? WHERE id=?`)
      .run(code?.toUpperCase(), description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until, is_active ?? 1, req.params.id);
    const promo = db.prepare('SELECT * FROM promo_codes WHERE id=?').get(req.params.id);
    res.json(promo);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.delete('/promos/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM promo_codes WHERE id=?').run(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.put('/promos/:id/toggle', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const promo = db.prepare('SELECT is_active FROM promo_codes WHERE id=?').get(req.params.id);
    const newStatus = promo.is_active ? 0 : 1;
    db.prepare('UPDATE promo_codes SET is_active=? WHERE id=?').run(newStatus, req.params.id);
    res.json({ success: true, is_active: newStatus });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
