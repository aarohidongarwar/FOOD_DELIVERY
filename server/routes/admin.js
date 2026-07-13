import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ═══════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════
router.get('/stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [totalOrdersRows] = await db.execute('SELECT COUNT(*) as count FROM orders');
    const [totalRevenueRows] = await db.execute("SELECT COALESCE(SUM(grand_total),0) as total FROM orders WHERE status='delivered'");
    const [totalUsersRows] = await db.execute("SELECT COUNT(*) as count FROM users WHERE role='customer'");
    const [totalRestaurantsRows] = await db.execute('SELECT COUNT(*) as count FROM restaurants');
    const [todayOrdersRows] = await db.execute("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at)=CURDATE()");
    const [todayRevenueRows] = await db.execute("SELECT COALESCE(SUM(grand_total),0) as total FROM orders WHERE status='delivered' AND DATE(created_at)=CURDATE()");
    const [pendingOrdersRows] = await db.execute("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending','confirmed','preparing','out_for_delivery')");
    const [activeDriversRows] = await db.execute("SELECT COUNT(*) as count FROM delivery_agents WHERE status='available'");
    const [totalDriversRows] = await db.execute("SELECT COUNT(*) as count FROM delivery_agents");
    const [cancelledTodayRows] = await db.execute("SELECT COUNT(*) as count FROM orders WHERE status='cancelled' AND DATE(created_at)=CURDATE()");

    // Average order value
    const [avgOrderValueRows] = await db.execute("SELECT COALESCE(AVG(grand_total),0) as avg FROM orders WHERE status='delivered'");

    // Orders by status
    const [ordersByStatus] = await db.execute('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
    
    // Recent orders (alias grand_total as total_amount for client compatibility)
    const [recentOrders] = await db.execute(`
      SELECT o.*, o.grand_total as total_amount, u.name as customer_name, r.name as restaurant_name
      FROM orders o 
      JOIN users u ON o.user_id=u.id 
      JOIN restaurants r ON o.restaurant_id=r.id
      ORDER BY o.created_at DESC LIMIT 20
    `);

    // Revenue by day (last 7 days)
    const [revenueByDay] = await db.execute(`
      SELECT DATE(created_at) as date, COALESCE(SUM(grand_total),0) as revenue, COUNT(*) as orders
      FROM orders 
      WHERE status='delivered' AND created_at >= NOW() - INTERVAL 7 DAY
      GROUP BY DATE(created_at) 
      ORDER BY date
    `);

    // Top restaurants by orders
    const [topRestaurants] = await db.execute(`
      SELECT r.id, r.name, r.image_url, r.rating, COUNT(o.id) as order_count, COALESCE(SUM(o.grand_total),0) as total_revenue
      FROM restaurants r 
      LEFT JOIN orders o ON r.id=o.restaurant_id AND o.status='delivered'
      GROUP BY r.id, r.name, r.image_url, r.rating 
      ORDER BY order_count DESC LIMIT 5
    `);

    // Peak hours
    const [peakHours] = await db.execute(`
      SELECT HOUR(created_at) as hour, COUNT(*) as count
      FROM orders 
      GROUP BY hour 
      ORDER BY hour
    `);

    res.json({
      totalOrders: totalOrdersRows[0].count,
      totalRevenue: parseFloat(totalRevenueRows[0].total) || 0,
      totalUsers: totalUsersRows[0].count,
      totalRestaurants: totalRestaurantsRows[0].count,
      todayOrders: todayOrdersRows[0].count,
      todayRevenue: parseFloat(todayRevenueRows[0].total) || 0,
      pendingOrders: pendingOrdersRows[0].count,
      activeDrivers: activeDriversRows[0].count,
      totalDrivers: totalDriversRows[0].count,
      cancelledToday: cancelledTodayRows[0].count,
      avgOrderValue: Math.round(parseFloat(avgOrderValueRows[0].avg)) || 0,
      ordersByStatus,
      recentOrders,
      revenueByDay,
      topRestaurants,
      peakHours
    });
  } catch (err) { 
    console.error('Stats error:', err); 
    res.status(500).json({ error: 'Failed to fetch stats' }); 
  }
});

// ═══════════════════════════════════════
// ORDER MANAGEMENT
// ═══════════════════════════════════════
router.get('/orders', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, search, date_from, date_to, page = 1, limit = 50 } = req.query;
    let q = `
      SELECT o.*, o.grand_total as total_amount, u.name as customer_name, u.phone as customer_phone, u.email as customer_email, 
             r.name as restaurant_name, d.name as driver_name 
      FROM orders o 
      JOIN users u ON o.user_id=u.id 
      JOIN restaurants r ON o.restaurant_id=r.id 
      LEFT JOIN users d ON o.driver_id=d.id
    `;
    const params = [];
    const conditions = [];
    if (status && status !== 'all') { conditions.push('o.status=?'); params.push(status); }
    if (search) { 
      conditions.push('(u.name LIKE ? OR r.name LIKE ? OR o.id LIKE ?)'); 
      params.push(`%${search}%`, `%${search}%`, `%${search}%`); 
    }
    if (date_from) { conditions.push('DATE(o.created_at)>=?'); params.push(date_from); }
    if (date_to) { conditions.push('DATE(o.created_at)<=?'); params.push(date_to); }
    if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
    q += ' ORDER BY o.created_at DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    q += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    
    const [orders] = await db.execute(q, params);
    for (const o of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [o.id]);
      o.items = items;
      const [payments] = await db.execute('SELECT * FROM payments WHERE order_id=?', [o.id]);
      o.payment = payments[0] || null;
    }

    // Total count for pagination
    let countQ = 'SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id=u.id JOIN restaurants r ON o.restaurant_id=r.id';
    if (conditions.length) countQ += ' WHERE ' + conditions.join(' AND ');
    const [countRows] = await db.execute(countQ, params);

    res.json({ orders, total: countRows[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { 
    console.error('Orders error:', err); 
    res.status(500).json({ error: 'Failed' }); 
  }
});

// Update order status (admin override)
router.put('/orders/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','preparing','out_for_delivery','delivered','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    
    // Fetch order details before updating (needed for refund/payment logic)
    const [preOrderRows] = await db.execute('SELECT user_id, payment_method, payment_status FROM orders WHERE id=?', [req.params.id]);
    const preOrder = preOrderRows[0];

    if (status === 'delivered') {
      // Mark order delivered and payment as paid
      await db.execute("UPDATE orders SET status='delivered', payment_status='paid', delivered_at=NOW(), updated_at=NOW() WHERE id=?", [req.params.id]);
      
      if (preOrder?.payment_method === 'COD') {
        await db.execute(
          "UPDATE payments SET status='completed', transaction_id=? WHERE order_id=? AND status='pending'",
          [`COD_ADMIN_${Date.now()}`, req.params.id]
        );
      }

      const [oRows] = await db.execute('SELECT driver_id FROM orders WHERE id=?', [req.params.id]);
      const o = oRows[0];
      if (o?.driver_id) {
        await db.execute("UPDATE delivery_agents SET status='available', total_deliveries=total_deliveries+1 WHERE user_id=?", [o.driver_id]);
      }
    } else if (status === 'cancelled') {
      await db.execute("UPDATE orders SET status='cancelled', payment_status='failed', cancelled_at=NOW(), updated_at=NOW() WHERE id=?", [req.params.id]);
      await db.execute("UPDATE payments SET status='refunded' WHERE order_id=?", [req.params.id]);

      // Refund wallet deduction if customer used wallet
      if (preOrder) {
        const [wallets] = await db.execute('SELECT * FROM wallets WHERE user_id=?', [preOrder.user_id]);
        const wallet = wallets[0];
        if (wallet) {
          const [walletDebits] = await db.execute(
            "SELECT * FROM wallet_transactions WHERE wallet_id=? AND related_order_id=? AND type='debit'",
            [wallet.id, req.params.id]
          );
          if (walletDebits.length > 0) {
            const debitAmount = parseFloat(walletDebits[0].amount);
            const newBalance = parseFloat(wallet.balance) + debitAmount;
            await db.execute('UPDATE wallets SET balance=? WHERE id=?', [newBalance, wallet.id]);
            await db.execute(
              "INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, related_order_id) VALUES (?, ?, 'credit', ?, ?, ?)",
              [uuidv4(), wallet.id, debitAmount, `Refund for cancelled order ${req.params.id.substring(0, 8)}`, req.params.id]
            );
          }
        }
      }

      // Release driver
      const [oRows] = await db.execute('SELECT driver_id FROM orders WHERE id=?', [req.params.id]);
      if (oRows[0]?.driver_id) {
        await db.execute("UPDATE delivery_agents SET status='available' WHERE user_id=?", [oRows[0].driver_id]);
      }
    } else {
      await db.execute("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?", [status, req.params.id]);
    }
    
    const [orderRows] = await db.execute(`
      SELECT o.*, o.grand_total as total_amount, u.name as customer_name, r.name as restaurant_name 
      FROM orders o 
      JOIN users u ON o.user_id=u.id 
      JOIN restaurants r ON o.restaurant_id=r.id 
      WHERE o.id=?
    `, [req.params.id]);
    const order = orderRows[0];
    
    const io = req.app.get('io');
    if (io) { io.to(`order-${req.params.id}`).emit('order-status-update', { orderId: req.params.id, status }); }
    res.json(order);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

// Reassign driver
router.put('/orders/:id/reassign', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { driver_id } = req.body;
    // Release current driver
    const [orderRows] = await db.execute('SELECT driver_id FROM orders WHERE id=?', [req.params.id]);
    const order = orderRows[0];
    if (order?.driver_id) {
      await db.execute("UPDATE delivery_agents SET status='available' WHERE user_id=?", [order.driver_id]);
    }
    // Assign new driver
    await db.execute('UPDATE orders SET driver_id=? WHERE id=?', [driver_id, req.params.id]);
    await db.execute("UPDATE delivery_agents SET status='busy' WHERE user_id=?", [driver_id]);
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: 'Failed' }); 
  }
});

// Cancel/Refund order
router.post('/orders/:id/cancel', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Fetch order details before cancelling (needed for wallet refund)
    const [orderDetailRows] = await db.execute('SELECT user_id, grand_total, payment_status FROM orders WHERE id=?', [req.params.id]);
    const orderDetail = orderDetailRows[0];

    await db.execute("UPDATE orders SET status='cancelled', payment_status='failed', cancelled_at=NOW(), updated_at=NOW() WHERE id=?", [req.params.id]);
    await db.execute("UPDATE payments SET status='refunded' WHERE order_id=?", [req.params.id]);
    
    // Release driver if assigned
    const [orderRows] = await db.execute('SELECT driver_id FROM orders WHERE id=?', [req.params.id]);
    const o = orderRows[0];
    if (o?.driver_id) {
      await db.execute("UPDATE delivery_agents SET status='available' WHERE user_id=?", [o.driver_id]);
    }

    // Refund wallet deduction if customer used wallet for this order
    if (orderDetail) {
      const [wallets] = await db.execute('SELECT * FROM wallets WHERE user_id=?', [orderDetail.user_id]);
      const wallet = wallets[0];
      if (wallet) {
        const [walletDebits] = await db.execute(
          "SELECT * FROM wallet_transactions WHERE wallet_id=? AND related_order_id=? AND type='debit'",
          [wallet.id, req.params.id]
        );
        if (walletDebits.length > 0) {
          const debitAmount = parseFloat(walletDebits[0].amount);
          const newBalance = parseFloat(wallet.balance) + debitAmount;
          await db.execute('UPDATE wallets SET balance=? WHERE id=?', [newBalance, wallet.id]);
          await db.execute(
            "INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, related_order_id) VALUES (?, ?, 'credit', ?, ?, ?)",
            [uuidv4(), wallet.id, debitAmount, `Refund for admin-cancelled order ${req.params.id.substring(0, 8)}`, req.params.id]
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err) { 
    console.error('Admin cancel order error:', err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

// ═══════════════════════════════════════
// DRIVER MANAGEMENT
// ═══════════════════════════════════════
router.get('/drivers', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [drivers] = await db.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.created_at, da.status, da.rating, da.total_deliveries, da.current_lat, da.current_lon,
             (SELECT COALESCE(SUM(delivery_fee),0) FROM orders WHERE driver_id=u.id AND status='delivered') as total_earnings,
             (SELECT COUNT(*) FROM orders WHERE driver_id=u.id AND DATE(created_at)=CURDATE()) as today_orders
      FROM users u 
      JOIN delivery_agents da ON da.user_id=u.id
      WHERE u.role='driver' 
      ORDER BY da.total_deliveries DESC
    `);
    res.json(drivers);
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.get('/drivers/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [driverRows] = await db.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.address, u.created_at, da.status as agent_status, da.rating, da.total_deliveries, da.current_lat, da.current_lon,
             (SELECT COALESCE(SUM(delivery_fee),0) FROM orders WHERE driver_id=u.id AND status='delivered') as total_earnings
      FROM users u 
      JOIN delivery_agents da ON da.user_id=u.id 
      WHERE u.id=?
    `, [req.params.id]);
    const driver = driverRows[0];
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    
    const [recentDeliveries] = await db.execute(`
      SELECT o.id, o.status, o.grand_total as total_amount, o.delivery_fee, o.created_at, r.name as restaurant_name
      FROM orders o 
      JOIN restaurants r ON o.restaurant_id=r.id
      WHERE o.driver_id=? 
      ORDER BY o.created_at DESC LIMIT 20
    `, [req.params.id]);
    
    res.json({ ...driver, recentDeliveries });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.put('/drivers/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE delivery_agents SET status=? WHERE user_id=?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: 'Failed' }); 
  }
});

// ═══════════════════════════════════════
// RESTAURANT MANAGEMENT
// ═══════════════════════════════════════
router.get('/restaurants', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [restaurants] = await db.execute(`
      SELECT r.*, u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM orders WHERE restaurant_id=r.id) as total_orders,
             (SELECT COALESCE(SUM(grand_total),0) FROM orders WHERE restaurant_id=r.id AND status='delivered') as total_revenue,
             (SELECT COUNT(*) FROM menu_items WHERE restaurant_id=r.id) as menu_count
      FROM restaurants r 
      LEFT JOIN users u ON r.owner_id=u.id
      ORDER BY r.rating DESC
    `);
    res.json(restaurants);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.put('/restaurants/:id/toggle', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [restRows] = await db.execute('SELECT is_active FROM restaurants WHERE id=?', [req.params.id]);
    const rest = restRows[0];
    const newStatus = rest.is_active ? 0 : 1;
    await db.execute('UPDATE restaurants SET is_active=? WHERE id=?', [newStatus, req.params.id]);
    res.json({ success: true, is_active: newStatus });
  } catch (err) { 
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.get('/restaurants/:id/analytics', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [restRows] = await db.execute('SELECT * FROM restaurants WHERE id=?', [req.params.id]);
    const rest = restRows[0];
    const [ordersByDay] = await db.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count, SUM(grand_total) as revenue
      FROM orders 
      WHERE restaurant_id=? AND created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(created_at) 
      ORDER BY date
    `, [req.params.id]);

    const [topItems] = await db.execute(`
      SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.total_price) as total_revenue
      FROM order_items oi 
      JOIN orders o ON oi.order_id=o.id
      WHERE o.restaurant_id=? 
      GROUP BY oi.menu_item_id, oi.name 
      ORDER BY total_qty DESC LIMIT 5
    `, [req.params.id]);

    const [reviews] = await db.execute(`
      SELECT rv.*, u.name as user_name 
      FROM reviews rv 
      JOIN users u ON rv.user_id=u.id
      WHERE rv.restaurant_id=? 
      ORDER BY rv.created_at DESC LIMIT 10
    `, [req.params.id]);

    res.json({ ...rest, ordersByDay, topItems, reviews });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

// ═══════════════════════════════════════
// CUSTOMER MANAGEMENT
// ═══════════════════════════════════════
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { search, role } = req.query;
    let q = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.address, u.created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id=u.id) as order_count,
             (SELECT COALESCE(SUM(grand_total),0) FROM orders WHERE user_id=u.id AND status='delivered') as total_spent
      FROM users u
    `;
    const conditions = [];
    const params = [];
    if (role && role !== 'all') { conditions.push('u.role=?'); params.push(role); }
    if (search) { 
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'); 
      params.push(`%${search}%`, `%${search}%`, `%${search}%`); 
    }
    if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
    q += ' ORDER BY u.created_at DESC';
    const [users] = await db.execute(q, params);
    res.json(users);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.get('/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [userRows] = await db.execute(`
      SELECT id,name,email,phone,role,address,created_at,
             (SELECT COUNT(*) FROM orders WHERE user_id=?) as order_count,
             (SELECT COALESCE(SUM(grand_total),0) FROM orders WHERE user_id=? AND status='delivered') as total_spent
      FROM users 
      WHERE id=?
    `, [req.params.id, req.params.id, req.params.id]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const [orders] = await db.execute(`
      SELECT o.id, o.status, o.grand_total as total_amount, o.created_at, r.name as restaurant_name
      FROM orders o 
      JOIN restaurants r ON o.restaurant_id=r.id 
      WHERE o.user_id=?
      ORDER BY o.created_at DESC LIMIT 20
    `, [req.params.id]);
    
    res.json({ ...user, orders });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

// ═══════════════════════════════════════
// FINANCE
// ═══════════════════════════════════════
router.get('/finance/overview', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [totalRevenueRows] = await db.execute("SELECT COALESCE(SUM(grand_total),0) as total FROM orders WHERE status='delivered'");
    const [todayRevenueRows] = await db.execute("SELECT COALESCE(SUM(grand_total),0) as total FROM orders WHERE status='delivered' AND DATE(created_at)=CURDATE()");
    const [monthRevenueRows] = await db.execute("SELECT COALESCE(SUM(grand_total),0) as total FROM orders WHERE status='delivered' AND DATE_FORMAT(created_at, '%Y-%m')=DATE_FORMAT(NOW(), '%Y-%m')");
    const [totalDeliveryFeesRows] = await db.execute("SELECT COALESCE(SUM(delivery_fee),0) as total FROM orders WHERE status='delivered'");
    const [totalRefundsRows] = await db.execute("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='refunded'");
    
    // Commission & Restaurant Earnings aggregates
    const [totalCommissionRows] = await db.execute("SELECT COALESCE(SUM(commission_amount),0) as total FROM orders WHERE status='delivered'");
    const [totalRestEarningsRows] = await db.execute("SELECT COALESCE(SUM(restaurant_earnings),0) as total FROM orders WHERE status='delivered'");
    const [totalSettledRestRows] = await db.execute("SELECT COALESCE(SUM(amount),0) as total FROM settlements WHERE entity_type='restaurant' AND status='completed'");
    const [driverPayoutsTotal] = await db.execute("SELECT COALESCE(SUM(amount),0) as total FROM settlements WHERE entity_type='driver' AND status='completed' AND amount > 0");
    const [driverDepositsTotal] = await db.execute("SELECT COALESCE(SUM(ABS(amount)),0) as total FROM settlements WHERE entity_type='driver' AND status='completed' AND amount < 0");
    const [deliveredOrderCount] = await db.execute("SELECT COUNT(*) as count FROM orders WHERE status='delivered'");

    const [paymentMethods] = await db.execute(`
      SELECT method, COUNT(*) as count, COALESCE(SUM(amount),0) as total
      FROM payments 
      WHERE status='completed' 
      GROUP BY method
    `);

    const [revenueByDay] = await db.execute(`
      SELECT DATE(created_at) as date, COALESCE(SUM(grand_total),0) as revenue
      FROM orders 
      WHERE status='delivered' AND created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(created_at) 
      ORDER BY date
    `);

    // Restaurant payouts with per-restaurant commission & gross revenue
    const [restaurantPayouts] = await db.execute(`
      SELECT 
        r.id, 
        r.name, 
        COUNT(o.id) as orders,
        COALESCE(SUM(o.item_total), 0) as gross_revenue,
        COALESCE(SUM(o.commission_amount), 0) as total_commission,
        COALESCE(SUM(o.restaurant_earnings), 0) as total_earnings, 
        (SELECT COALESCE(SUM(amount), 0) FROM settlements WHERE entity_type='restaurant' AND entity_id=r.id AND status='completed') as total_settled
      FROM restaurants r 
      LEFT JOIN orders o ON r.id=o.restaurant_id AND o.status='delivered'
      GROUP BY r.id, r.name 
      ORDER BY total_earnings DESC
    `);

    // Map to calculate pending
    const mappedRestaurantPayouts = restaurantPayouts.map(r => ({
      ...r,
      pending_balance: Math.max(0, parseFloat(r.total_earnings) - parseFloat(r.total_settled))
    }));

    // Driver payouts (delivery fees minus cash collected from COD)
    const [driverPayouts] = await db.execute(`
      SELECT 
        u.id, 
        u.name, 
        COALESCE(SUM(o.delivery_fee), 0) as total_earnings, 
        COUNT(o.id) as deliveries,
        (SELECT COALESCE(SUM(grand_total), 0) FROM orders WHERE driver_id=u.id AND status='delivered' AND payment_method='COD') as cash_in_hand,
        (SELECT COALESCE(SUM(amount), 0) FROM settlements WHERE entity_type='driver' AND entity_id=u.id AND status='completed') as total_settled
      FROM users u 
      LEFT JOIN orders o ON o.driver_id=u.id AND o.status='delivered'
      WHERE u.role='driver' 
      GROUP BY u.id, u.name 
      ORDER BY total_earnings DESC
    `);

    // Map to calculate pending (can be negative if driver owes platform)
    const mappedDriverPayouts = driverPayouts.map(d => ({
      ...d,
      pending_balance: parseFloat(d.total_earnings) - parseFloat(d.cash_in_hand) - parseFloat(d.total_settled)
    }));

    res.json({
      totalRevenue: parseFloat(totalRevenueRows[0].total) || 0,
      todayRevenue: parseFloat(todayRevenueRows[0].total) || 0,
      monthRevenue: parseFloat(monthRevenueRows[0].total) || 0,
      totalDeliveryFees: parseFloat(totalDeliveryFeesRows[0].total) || 0,
      totalRefunds: parseFloat(totalRefundsRows[0].total) || 0,
      totalCommission: parseFloat(totalCommissionRows[0].total) || 0,
      totalRestaurantEarnings: parseFloat(totalRestEarningsRows[0].total) || 0,
      totalSettledToRestaurants: parseFloat(totalSettledRestRows[0].total) || 0,
      totalSettledToDrivers: parseFloat(driverPayoutsTotal[0].total) || 0,
      totalDriverDeposits: parseFloat(driverDepositsTotal[0].total) || 0,
      deliveredOrders: deliveredOrderCount[0].count || 0,
      paymentMethods,
      revenueByDay,
      restaurantPayouts: mappedRestaurantPayouts,
      driverPayouts: mappedDriverPayouts
    });
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.get('/finance/transactions', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { method, status } = req.query;
    let q = `
      SELECT p.*, o.id as order_id, u.name as customer_name, r.name as restaurant_name
      FROM payments p 
      JOIN orders o ON p.order_id=o.id 
      JOIN users u ON o.user_id=u.id 
      JOIN restaurants r ON o.restaurant_id=r.id
    `;
    const conditions = [];
    const params = [];
    if (method) { conditions.push('p.method=?'); params.push(method); }
    if (status) { conditions.push('p.status=?'); params.push(status); }
    if (conditions.length) q += ' WHERE ' + conditions.join(' AND ');
    q += ' ORDER BY p.created_at DESC LIMIT 100';
    const [transactions] = await db.execute(q, params);
    res.json(transactions);
  } catch (err) { 
    res.status(500).json({ error: 'Failed' }); 
  }
});

// GET Settlements History
router.get('/finance/settlements', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { entity_type } = req.query;
    let q = `
      SELECT s.*, 
             COALESCE(r.name, u.name) as entity_name
      FROM settlements s
      LEFT JOIN restaurants r ON s.entity_type = 'restaurant' AND s.entity_id = r.id
      LEFT JOIN users u ON s.entity_type = 'driver' AND s.entity_id = u.id
    `;
    const params = [];
    if (entity_type) {
      q += ' WHERE s.entity_type = ?';
      params.push(entity_type);
    }
    q += ' ORDER BY s.created_at DESC';
    
    const [settlements] = await db.execute(q, params);
    res.json(settlements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

// POST Create Settlement
router.post('/finance/settlements', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { entity_type, entity_id, amount, transaction_ref } = req.body;
    
    if (!['restaurant', 'driver'].includes(entity_type) || !entity_id || !amount || !transaction_ref) {
      return res.status(400).json({ error: 'Missing required fields or invalid entity_type' });
    }

    const id = uuidv4();
    await db.execute(
      `INSERT INTO settlements (id, entity_type, entity_id, amount, status, transaction_ref, created_at) 
       VALUES (?, ?, ?, ?, 'completed', ?, NOW())`,
      [id, entity_type, entity_id, amount, transaction_ref]
    );

    res.status(201).json({ success: true, id, message: 'Settlement recorded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create settlement' });
  }
});

router.post('/finance/settlements/approve/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await db.execute("UPDATE settlements SET status='completed', updated_at=NOW() WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve settlement' });
  }
});

// ═══════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════
router.get('/analytics/revenue', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    let groupBy, dateRange;
    if (period === 'monthly') { 
      groupBy = "DATE_FORMAT(created_at, '%Y-%m')"; 
      dateRange = 'NOW() - INTERVAL 365 DAY'; 
    } else if (period === 'weekly') { 
      groupBy = "DATE_FORMAT(created_at, '%Y-%u')"; 
      dateRange = 'NOW() - INTERVAL 90 DAY'; 
    } else { 
      groupBy = 'DATE(created_at)'; 
      dateRange = 'NOW() - INTERVAL 30 DAY'; 
    }

    const [data] = await db.execute(`
      SELECT ${groupBy} as period, COALESCE(SUM(grand_total),0) as revenue, COUNT(*) as orders
      FROM orders 
      WHERE status='delivered' AND created_at >= ${dateRange}
      GROUP BY ${groupBy} 
      ORDER BY period
    `);
    res.json(data);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.get('/analytics/orders', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Peak hours
    const [peakHours] = await db.execute(`
      SELECT HOUR(created_at) as hour, COUNT(*) as count
      FROM orders 
      GROUP BY hour 
      ORDER BY hour
    `);

    // Status distribution
    const [statusDist] = await db.execute('SELECT status, COUNT(*) as count FROM orders GROUP BY status');

    // Cancellation rate trend (by day)
    const [cancellationTrend] = await db.execute(`
      SELECT DATE(created_at) as date,
             COUNT(*) as total,
             SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL 30 DAY
      GROUP BY DATE(created_at) 
      ORDER BY date
    `);

    // Average orders per day
    const [avgOrdersPerDayRows] = await db.execute(`
      SELECT COALESCE(AVG(cnt),0) as avg 
      FROM (SELECT COUNT(*) as cnt FROM orders GROUP BY DATE(created_at)) as temp
    `);

    res.json({ 
      peakHours, 
      statusDist, 
      cancellationTrend, 
      avgOrdersPerDay: Math.round(parseFloat(avgOrdersPerDayRows[0].avg)) || 0 
    });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.get('/analytics/top-items', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [topItems] = await db.execute(`
      SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.base_price * oi.quantity) as total_revenue, r.name as restaurant_name
      FROM order_items oi 
      JOIN orders o ON oi.order_id=o.id 
      JOIN restaurants r ON o.restaurant_id=r.id
      WHERE o.status='delivered'
      GROUP BY oi.menu_item_id, oi.name, r.name 
      ORDER BY total_qty DESC LIMIT 10
    `);
    res.json(topItems);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

// ═══════════════════════════════════════
// PROMO CODES
// ═══════════════════════════════════════
router.get('/promos', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [promos] = await db.execute('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json(promos);
  } catch (err) { 
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.post('/promos', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until } = req.body;
    if (!code || !discount_value) return res.status(400).json({ error: 'Code and discount value required' });
    const id = uuidv4();
    
    await db.execute(
      `INSERT INTO promo_codes (id,code,description,discount_type,discount_value,min_order,max_discount,usage_limit,valid_from,valid_until) 
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        id, 
        code.toUpperCase(), 
        description || '', 
        discount_type || 'flat', 
        discount_value, 
        min_order || 0, 
        max_discount || null, 
        usage_limit || null, 
        valid_from || null, 
        valid_until || null
      ]
    );
    
    const [promoRows] = await db.execute('SELECT * FROM promo_codes WHERE id=?', [id]);
    res.status(201).json(promoRows[0]);
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/promos/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { code, description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until, is_active } = req.body;
    
    await db.execute(
      `UPDATE promo_codes 
       SET code=?, description=?, discount_type=?, discount_value=?, min_order=?, max_discount=?, usage_limit=?, valid_from=?, valid_until=?, is_active=? 
       WHERE id=?`,
      [
        code?.toUpperCase(), 
        description, 
        discount_type, 
        discount_value, 
        min_order, 
        max_discount, 
        usage_limit, 
        valid_from, 
        valid_until, 
        is_active ?? 1, 
        req.params.id
      ]
    );
    
    const [promoRows] = await db.execute('SELECT * FROM promo_codes WHERE id=?', [req.params.id]);
    res.json(promoRows[0]);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.delete('/promos/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await db.execute('DELETE FROM promo_codes WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: 'Failed' }); 
  }
});

router.put('/promos/:id/toggle', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [promoRows] = await db.execute('SELECT is_active FROM promo_codes WHERE id=?', [req.params.id]);
    const promo = promoRows[0];
    const newStatus = promo.is_active ? 0 : 1;
    await db.execute('UPDATE promo_codes SET is_active=? WHERE id=?', [newStatus, req.params.id]);
    res.json({ success: true, is_active: newStatus });
  } catch (err) { 
    res.status(500).json({ error: 'Failed' }); 
  }
});

export default router;
