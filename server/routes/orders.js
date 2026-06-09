import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateOrderPlacement } from '../middleware/validate.js';
import { assignDriverToOrder } from './delivery.js';
import { createNotification } from './notifications.js';

const router = express.Router();

const getCompleteOrder = async (orderId) => {
  const [orderRows] = await db.execute(
    `SELECT o.*, o.grand_total as total_amount, u.name as customer_name, u.phone as customer_phone, 
            r.name as restaurant_name, r.lat as restaurant_lat, r.lon as restaurant_lon
     FROM orders o 
     JOIN users u ON o.user_id=u.id 
     JOIN restaurants r ON o.restaurant_id=r.id 
     WHERE o.id=?`,
    [orderId]
  );
  const order = orderRows[0];
  if (order) {
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [orderId]);
    order.items = items;
  }
  return order;
};

const checkRestaurantOwnership = async (orderId, userId) => {
  const [orderCheck] = await db.execute('SELECT restaurant_id FROM orders WHERE id=?', [orderId]);
  if (!orderCheck[0]) return false;
  const [restOwner] = await db.execute('SELECT owner_id FROM restaurants WHERE id = ?', [orderCheck[0].restaurant_id]);
  return restOwner[0] && restOwner[0].owner_id === userId;
};

const checkDirectRestaurantOwnership = async (restaurantId, userId) => {
  const [restOwner] = await db.execute('SELECT owner_id FROM restaurants WHERE id = ?', [restaurantId]);
  return restOwner[0] && restOwner[0].owner_id === userId;
};

// Place order
router.post('/', authenticateToken, validateOrderPlacement, async (req, res) => {
  const connection = await db.pool.getConnection();
  await connection.beginTransaction();
  try {
    const { 
      restaurant_id, 
      items, 
      delivery_address, 
      delivery_lat, 
      delivery_lon, 
      payment_method, 
      special_instructions,
      promo_code,
      use_wallet
    } = req.body;

    if (!restaurant_id || !items || items.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Restaurant and items required' });
    }

    const [restaurants] = await connection.execute('SELECT * FROM restaurants WHERE id = ?', [restaurant_id]);
    const restaurant = restaurants[0];
    if (!restaurant) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const [menuItems] = await connection.execute('SELECT * FROM menu_items WHERE id = ?', [item.menu_item_id]);
      const mi = menuItems[0];
      if (!mi) continue;
      subtotal += mi.price * item.quantity;
      orderItems.push({ 
        id: uuidv4(), 
        menu_item_id: mi.id, 
        name: mi.name, 
        quantity: item.quantity, 
        price: mi.price, 
        special_instructions: item.special_instructions || null 
      });
    }

    const delivery_fee = parseFloat(restaurant.delivery_fee) || 29;
    const tax_amount = Math.round(subtotal * 0.05 * 100) / 100;

    // Handle Promo Code
    let discount_amount = 0;
    let promo_code_id = null;
    if (promo_code) {
      const [promos] = await connection.execute('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1', [promo_code]);
      const promo = promos[0];
      if (!promo) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Invalid promo code' });
      }

      if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Promo code is not yet active' });
      }
      if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Promo code has expired' });
      }

      if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Promo code usage limit reached' });
      }

      const minOrderVal = parseFloat(promo.min_order) || 0;
      if (subtotal < minOrderVal) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: `Minimum order value of ₹${minOrderVal} required` });
      }

      const discountVal = parseFloat(promo.discount_value);
      if (promo.discount_type === 'flat') {
        discount_amount = discountVal;
      } else if (promo.discount_type === 'percent') {
        discount_amount = (subtotal * discountVal) / 100;
        if (promo.max_discount) {
          discount_amount = Math.min(discount_amount, parseFloat(promo.max_discount));
        }
      }
      discount_amount = Math.round(discount_amount * 100) / 100;
      promo_code_id = promo.id;
    }

    const grand_total = Math.max(0, subtotal + delivery_fee + tax_amount - discount_amount);
    const commission_amount = Math.round((subtotal * 0.10) * 100) / 100; // 10% commission on subtotal
    const restaurant_earnings = Math.round((subtotal + tax_amount - discount_amount - commission_amount) * 100) / 100;
    const orderId = uuidv4();

    // Handle wallet payment / split payment deduction
    let wallet_deducted = 0;
    if (payment_method === 'wallet' || use_wallet) {
      const [wallets] = await connection.execute('SELECT * FROM wallets WHERE user_id = ? FOR UPDATE', [req.user.id]);
      let wallet = wallets[0];
      if (!wallet) {
        const walletId = uuidv4();
        await connection.execute('INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, 0.00)', [walletId, req.user.id]);
        const [newWallets] = await connection.execute('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
        wallet = newWallets[0];
      }

      const walletBal = parseFloat(wallet.balance) || 0;
      if (payment_method === 'wallet' && walletBal < grand_total) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: `Insufficient wallet balance. You need ₹${grand_total.toFixed(2)} but only have ₹${walletBal.toFixed(2)}.` });
      }

      wallet_deducted = Math.min(walletBal, grand_total);
      if (wallet_deducted > 0) {
        const newBalance = walletBal - wallet_deducted;
        await connection.execute('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);
        await connection.execute(
          'INSERT INTO wallet_transactions (id, wallet_id, type, amount, description, related_order_id) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), wallet.id, 'debit', wallet_deducted, `Payment for order ${orderId.substring(0, 8)}`, orderId]
        );
      }
    }

    // Determine payment details
    const isOnline = ['card', 'upi', 'online'].includes(payment_method?.toLowerCase());
    const actual_payment_method = isOnline ? 'ONLINE' : 'COD';
    const initial_payment_status = (isOnline || wallet_deducted >= grand_total) ? 'paid' : 'pending';

    // Insert Order
    await connection.execute(
      `INSERT INTO orders (id, user_id, restaurant_id, status, item_total, delivery_fee, tax_amount, discount_amount, grand_total, promo_code_id, delivery_address, delivery_lat, delivery_lon, special_instructions, payment_method, payment_status, commission_amount, restaurant_earnings)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, req.user.id, restaurant_id, subtotal, delivery_fee, tax_amount, discount_amount, grand_total,
        promo_code_id, delivery_address || '', delivery_lat || null, delivery_lon || null, special_instructions || null,
        actual_payment_method, initial_payment_status, commission_amount, restaurant_earnings
      ]
    );

    // Insert Order Items
    for (const it of orderItems) {
      await connection.execute(
        'INSERT INTO order_items (id, order_id, menu_item_id, name, quantity, base_price, total_price, special_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [it.id, orderId, it.menu_item_id, it.name, it.quantity, it.price, it.price * it.quantity, it.special_instructions]
      );
    }

    // Insert Payment
    const payId = uuidv4();
    const remaining_payment = grand_total - wallet_deducted;
    if (remaining_payment > 0) {
      const payStatus = payment_method === 'cod' ? 'pending' : 'completed';
      await connection.execute(
        "INSERT INTO payments (id, order_id, method, amount, status, transaction_id) VALUES (?, ?, ?, ?, ?, ?)",
        [payId, orderId, payment_method || 'card', remaining_payment, payStatus, `TXN_${Date.now()}`]
      );
    } else {
      await connection.execute(
        "INSERT INTO payments (id, order_id, method, amount, status, transaction_id) VALUES (?, ?, ?, ?, 'completed', ?)",
        [payId, orderId, 'wallet', grand_total, `WTXN_${Date.now()}`]
      );
    }

    // Update promo code usage count
    if (promo_code_id) {
      await connection.execute('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?', [promo_code_id]);
    }

    // Auto-assignment is removed here. It will be triggered when the restaurant marks the order as ready.

    await connection.commit();
    connection.release();

    const [orderRows] = await db.execute('SELECT *, grand_total as total_amount FROM orders WHERE id=?', [orderId]);
    const order = orderRows[0];
    const [finalItems] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [orderId]);
    const io = req.app.get('io');
    if (io) { io.emit('new-order', {...order, items: finalItems}); }

    res.status(201).json({...order, items: finalItems});
  } catch (err) { 
    await connection.rollback();
    connection.release();
    console.error('Place order error:', err); 
    res.status(500).json({ error: 'Failed to place order' }); 
  }
});

// Get active promo codes
router.get('/promo-codes/active', authenticateToken, async (req, res) => {
  try {
    const [promos] = await db.execute(
      'SELECT * FROM promo_codes WHERE is_active = 1 AND (valid_until IS NULL OR valid_until > NOW()) AND (usage_limit IS NULL OR used_count < usage_limit)'
    );
    res.json(promos);
  } catch (err) {
    console.error('Fetch active promos error:', err);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

// Validate promo code
router.post('/promo-codes/validate', authenticateToken, async (req, res) => {
  try {
    const { code, restaurant_id, item_total } = req.body;
    if (!code) return res.status(400).json({ error: 'Promo code is required' });

    const [promos] = await db.execute('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1', [code]);
    const promo = promos[0];
    if (!promo) return res.status(400).json({ error: 'Invalid promo code' });

    if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
      return res.status(400).json({ error: 'Promo code is not yet active' });
    }
    if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
      return res.status(400).json({ error: 'Promo code has expired' });
    }

    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return res.status(400).json({ error: 'Promo code usage limit reached' });
    }

    const minOrderVal = parseFloat(promo.min_order) || 0;
    if (parseFloat(item_total) < minOrderVal) {
      return res.status(400).json({ error: `Minimum order value of ₹${minOrderVal} required` });
    }

    let discount = 0;
    const discountVal = parseFloat(promo.discount_value);
    if (promo.discount_type === 'flat') {
      discount = discountVal;
    } else if (promo.discount_type === 'percent') {
      discount = (parseFloat(item_total) * discountVal) / 100;
      if (promo.max_discount) {
        discount = Math.min(discount, parseFloat(promo.max_discount));
      }
    }

    res.json({
      id: promo.id,
      code: promo.code,
      discount_amount: Math.round(discount * 100) / 100,
      description: promo.description
    });
  } catch (err) {
    console.error('Validate promo error:', err);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});


// Get my orders
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.execute('SELECT o.*, o.grand_total as total_amount, r.name as restaurant_name, r.image_url as restaurant_image FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE o.user_id=? ORDER BY o.created_at DESC', [req.user.id]);
    for (const o of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [o.id]);
      o.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch orders' }); }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [orderRows] = await db.execute('SELECT o.*, o.grand_total as total_amount, r.name as restaurant_name, r.image_url as restaurant_image, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon FROM orders o JOIN restaurants r ON o.restaurant_id=r.id WHERE o.id=?', [req.params.id]);
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (order.user_id !== req.user.id && order.driver_id !== req.user.id && req.user.role !== 'admin') {
      const isOwner = await checkDirectRestaurantOwnership(order.restaurant_id, req.user.id);
      if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    }

    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [order.id]);
    order.items = items;
    
    if (order.driver_id) {
      const [driverRows] = await db.execute('SELECT u.name, u.phone, da.current_lat, da.current_lon, da.rating FROM users u JOIN delivery_agents da ON da.user_id=u.id WHERE u.id=?', [order.driver_id]);
      order.driver = driverRows[0];
    }
    
    const [paymentRows] = await db.execute('SELECT * FROM payments WHERE order_id=?', [order.id]);
    order.payment = paymentRows[0];
    
    res.json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch order' }); }
});

// Restaurant Accepts Order
router.put('/:id/accept', authenticateToken, requireRole('restaurant'), async (req, res) => {
  try {
    const isOwner = await checkRestaurantOwnership(req.params.id, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    const { estimated_prep_time } = req.body;
    const prepTime = parseInt(estimated_prep_time) || 20;
    
    // Generate OTPs
    const pickup_otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const delivery_otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

    await db.execute(
      "UPDATE orders SET status='accepted', estimated_prep_time=?, pickup_otp=?, delivery_otp=?, accepted_at=NOW(), updated_at=NOW() WHERE id=?", 
      [prepTime, pickup_otp, delivery_otp, req.params.id]
    );
    
    const order = await getCompleteOrder(req.params.id);
    
    const io = req.app.get('io');
    if (io) { 
      io.to(`order-${req.params.id}`).emit('order-status-update', { orderId: req.params.id, status: 'accepted' }); 
      io.to(`order-${req.params.id}`).emit('order-accepted', { orderId: req.params.id, estimated_prep_time: prepTime });
      io.emit('order-updated', order); 
    }
    await createNotification(order.user_id, 'Order Accepted', `Your order from ${order.restaurant_name} has been accepted and is being prepared.`, 'success', io);
    res.json(order);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed to accept order' }); 
  }
});

// Restaurant Rejects Order
router.put('/:id/reject', authenticateToken, requireRole('restaurant'), async (req, res) => {
  try {
    const isOwner = await checkRestaurantOwnership(req.params.id, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });

    const { reason } = req.body;
    await db.execute(
      "UPDATE orders SET status='cancelled', cancel_reason=?, cancelled_at=NOW(), updated_at=NOW() WHERE id=?", 
      [reason || 'Rejected by restaurant', req.params.id]
    );
    
    // Process refund logic would go here
    
    const order = await getCompleteOrder(req.params.id);
    
    const io = req.app.get('io');
    if (io) { 
      io.to(`order-${req.params.id}`).emit('order-status-update', { orderId: req.params.id, status: 'cancelled', reason: order.cancel_reason }); 
      io.emit('order-updated', order); 
    }
    await createNotification(order.user_id, 'Order Cancelled', `Your order from ${order.restaurant_name} was cancelled. Reason: ${order.cancel_reason || 'Rejected'}`, 'error', io);
    res.json(order);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed to reject order' }); 
  }
});

// Restaurant Marks Order as Ready (Triggers Driver Assignment)
router.put('/:id/ready', authenticateToken, requireRole('restaurant'), async (req, res) => {
  try {
    const isOwner = await checkRestaurantOwnership(req.params.id, req.user.id);
    if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    await db.execute(
      "UPDATE orders SET status='ready_for_pickup', ready_at=NOW(), updated_at=NOW() WHERE id=?", 
      [req.params.id]
    );
    
    const order = await getCompleteOrder(req.params.id);
    
    const io = req.app.get('io');
    if (io) { 
      io.to(`order-${req.params.id}`).emit('order-status-update', { orderId: req.params.id, status: 'ready_for_pickup' }); 
      io.to(`order-${req.params.id}`).emit('order-ready', { orderId: req.params.id });
      io.emit('order-updated', order); 
      
      await createNotification(order.user_id, 'Order Ready', `Your order from ${order.restaurant_name} is ready for pickup!`, 'info', io);

      // Find and assign driver asynchronously
      assignDriverToOrder(req.params.id, order.restaurant_lat, order.restaurant_lon, io);
    }
    res.json(order);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed to mark ready' }); 
  }
});

// Update order status (Generic fallback)
router.put('/:id/status', authenticateToken, requireRole('restaurant', 'admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const isOwner = await checkRestaurantOwnership(req.params.id, req.user.id);
      if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    }
    const { status } = req.body;
    const validTransitions = {
      pending: ['accepted', 'cancelled'],
      accepted: ['preparing', 'ready_for_pickup', 'cancelled'],
      preparing: ['ready_for_pickup', 'cancelled'],
      ready_for_pickup: ['driver_assigned', 'cancelled'],
      driver_assigned: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };
    
    const [current] = await db.execute('SELECT status FROM orders WHERE id = ?', [req.params.id]);
    if (!current[0]) return res.status(404).json({ error: 'Order not found' });
    
    if (!validTransitions[current[0].status]?.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${current[0].status} to ${status}` });
    }
    
    await db.execute("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?", [status, req.params.id]);
    
    if (status === 'delivered') {
      const [oRows] = await db.execute('SELECT driver_id FROM orders WHERE id=?', [req.params.id]);
      if (oRows[0]?.driver_id) {
        await db.execute("UPDATE delivery_agents SET status='available', total_deliveries=total_deliveries+1 WHERE user_id=?", [oRows[0].driver_id]);
      }
    }
    
    const order = await getCompleteOrder(req.params.id);
    const io = req.app.get('io');
    if (io) { io.to(`order-${req.params.id}`).emit('order-status-update', {orderId: req.params.id, status}); io.emit('order-updated', order); }
    res.json(order);
  } catch (err) { res.status(500).json({ error: 'Failed to update status' }); }
});

// Get restaurant orders
router.get('/restaurant/:restaurantId', authenticateToken, requireRole('restaurant', 'admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const isOwner = await checkDirectRestaurantOwnership(req.params.restaurantId, req.user.id);
      if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    }
    const [orders] = await db.execute('SELECT o.*, o.grand_total as total_amount, u.name as customer_name, u.phone as customer_phone FROM orders o JOIN users u ON o.user_id=u.id WHERE o.restaurant_id=? ORDER BY o.created_at DESC', [req.params.restaurantId]);
    for (const o of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [o.id]);
      o.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Get restaurant analytics
router.get('/restaurant/:restaurantId/analytics', authenticateToken, requireRole('restaurant', 'admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const isOwner = await checkDirectRestaurantOwnership(req.params.restaurantId, req.user.id);
      if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    }
    const restaurantId = req.params.restaurantId;
    const { days = 30 } = req.query;
    const daysInt = parseInt(days) || 30;

    // Daily revenue and order counts
    const [dailyData] = await db.execute(
      `SELECT DATE(created_at) as date, 
              COUNT(*) as orders, 
              SUM(grand_total) as revenue
       FROM orders 
       WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [restaurantId, daysInt]
    );

    // Top selling products
    const [topProducts] = await db.execute(
      `SELECT oi.name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.restaurant_id = ? AND o.status = 'delivered' AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY oi.name ORDER BY total_sold DESC LIMIT 10`,
      [restaurantId, daysInt]
    );

    // Summary stats
    const [summaryRows] = await db.execute(
      `SELECT COUNT(*) as total_orders, 
              SUM(CASE WHEN status='delivered' THEN grand_total ELSE 0 END) as total_revenue,
              SUM(CASE WHEN status='delivered' THEN commission_amount ELSE 0 END) as total_commission,
              SUM(CASE WHEN status='delivered' THEN restaurant_earnings ELSE 0 END) as total_restaurant_earnings,
              COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as todays_orders,
              SUM(CASE WHEN DATE(created_at) = CURDATE() AND status='delivered' THEN grand_total ELSE 0 END) as todays_revenue,
              COUNT(CASE WHEN status='pending' THEN 1 END) as pending_orders
       FROM orders WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [restaurantId, daysInt]
    );

    // Order status breakdown
    const [statusBreakdown] = await db.execute(
      `SELECT status, COUNT(*) as count FROM orders WHERE restaurant_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY status`,
      [restaurantId, daysInt]
    );

    res.json({
      dailyData: dailyData.map(d => ({
        name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: parseFloat(d.revenue) || 0,
        orders: d.orders
      })),
      topProducts: topProducts.map(tp => ({
        name: tp.name,
        sold: tp.total_sold,
        revenue: parseFloat(tp.total_revenue) || 0
      })),
      summary: {
        totalOrders: summaryRows[0]?.total_orders || 0,
        totalRevenue: parseFloat(summaryRows[0]?.total_revenue) || 0,
        totalCommission: parseFloat(summaryRows[0]?.total_commission) || 0,
        totalRestaurantEarnings: parseFloat(summaryRows[0]?.total_restaurant_earnings) || 0,
        todaysOrders: summaryRows[0]?.todays_orders || 0,
        todaysRevenue: parseFloat(summaryRows[0]?.todays_revenue) || 0,
        pendingOrders: summaryRows[0]?.pending_orders || 0
      },
      statusBreakdown: statusBreakdown.reduce((acc, s) => { acc[s.status] = s.count; return acc; }, {})
    });
  } catch (err) {
    console.error('Restaurant analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Add review
router.post('/:id/review', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const [orderRows] = await db.execute('SELECT * FROM orders WHERE id=?', [req.params.id]);
    const order = orderRows[0];
    if (!order) return res.status(404).json({ error: 'Not found' });
    
    await db.execute(
      'INSERT INTO reviews (id, order_id, restaurant_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.params.id, order.restaurant_id, req.user.id, rating, comment || '']
    );
    
    const [avgRows] = await db.execute('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE restaurant_id=?', [order.restaurant_id]);
    const avg = avgRows[0];
    await db.execute('UPDATE restaurants SET rating=?, total_ratings=? WHERE id=?', [Math.round(avg.avg_rating * 10) / 10, avg.count, order.restaurant_id]);
    
    res.status(201).json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

export default router;
