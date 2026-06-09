import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateLocationUpdate } from '../middleware/validate.js';
import { connectedUsers } from '../state.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Helper function to calculate distance using Haversine formula (meters)
function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

// Function to broadcast order to ALL available drivers
export async function assignDriverToOrder(orderId, restaurantLat, restaurantLon, io) {
  try {
    // Find all available drivers
    const [availDrivers] = await db.execute("SELECT da.*, u.name as driver_name FROM delivery_agents da JOIN users u ON da.user_id=u.id WHERE da.status='available'");
    
    if (availDrivers.length === 0) {
      console.log(`No available drivers found for order ${orderId}`);
      return false;
    }

    // Get order details to send to driver
    const [orderRows] = await db.execute(`
      SELECT o.*, r.name as restaurant_name, r.address as restaurant_address 
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id 
      WHERE o.id = ?
    `, [orderId]);
    const order = orderRows[0];

    // Broadcast to ALL available drivers
    if (io) {
      // connectedUsers is imported from state.js
      
      availDrivers.forEach(driver => {
        const driverSocketId = connectedUsers.get(driver.user_id);
        if (driverSocketId) {
          const distance = getDistance(driver.current_lat, driver.current_lon, restaurantLat, restaurantLon);
          io.to(driverSocketId).emit('new-order-request', {
            orderId,
            restaurant: order.restaurant_name,
            pickup: order.restaurant_address,
            delivery: order.delivery_address,
            fee: order.delivery_fee,
            distance: Math.round(distance)
          });
        }
      });
    }
    
    return true;
  } catch (err) {
    console.error('Error broadcasting driver assignment:', err);
    return false;
  }
}

// Get broadcasting assignments for driver
router.get('/pending-assignment', authenticateToken, async (req, res) => {
  try {
    // Find an order that needs a driver
    const [orders] = await db.execute(`
      SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon 
      FROM orders o 
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.status = 'ready_for_pickup' AND o.driver_id IS NULL
      ORDER BY o.created_at ASC LIMIT 1
    `);
    
    if (!orders[0]) return res.json(null);
    const order = orders[0];
    
    const [agents] = await db.execute("SELECT current_lat, current_lon FROM delivery_agents WHERE user_id=?", [req.user.id]);
    const agent = agents[0] || {};
    const dist = getDistance(agent.current_lat, agent.current_lon, order.restaurant_lat, order.restaurant_lon);
    
    res.json({
      orderId: order.id,
      restaurant: order.restaurant_name,
      pickup: order.restaurant_address,
      delivery: order.delivery_address,
      fee: order.delivery_fee,
      distance: Math.round(dist)
    });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Accept assignment (Fastest Finger First)
router.post('/accept/:orderId', authenticateToken, async (req, res) => {
  try {
    const io = req.app.get('io');
    const orderId = req.params.orderId;
    
    console.log("Accepting order:", orderId, "Driver:", req.user.id);
    // ATOMIC UPDATE: Only update if driver_id is NULL
    const [result] = await db.execute(
      "UPDATE orders SET driver_id=?, status='driver_assigned', updated_at=NOW() WHERE id=? AND driver_id IS NULL", 
      [req.user.id, orderId]
    );
    console.log("Update result:", result);
    
    if (result.affectedRows === 0) {
      // Someone else got it, or it's invalid
      console.log("Failed to accept. affectedRows=0 for order", orderId);
      return res.status(400).json({ error: 'Order already claimed by another driver' });
    }
    
    // Insert into delivery_assignments for record keeping
    const assignmentId = uuidv4();
    await db.execute(
      "INSERT INTO delivery_assignments (id, order_id, driver_id, status, responded_at) VALUES (?, ?, ?, 'accepted', NOW())",
      [assignmentId, orderId, req.user.id]
    );
    
    // Update driver status
    await db.execute("UPDATE delivery_agents SET status='busy' WHERE user_id=?", [req.user.id]);
    
    // Fetch full data for notifications
    const [driverData] = await db.execute("SELECT u.name, u.phone, da.vehicle_type, da.vehicle_number, da.rating FROM users u JOIN delivery_agents da ON u.id = da.user_id WHERE u.id = ?", [req.user.id]);
    const driver = driverData[0];
    
    const [orderRows] = await db.execute('SELECT * FROM orders WHERE id=?', [orderId]);
    
    // Notify clients
    if (io) {
      io.to(`order-${orderId}`).emit('order-status-update', { orderId, status: 'driver_assigned' });
      io.to(`order-${orderId}`).emit('driver-assigned', { 
        orderId, 
        driverId: req.user.id,
        driver: driver
      });
      io.emit('order-updated', orderRows[0]);
      
      // Emit global event to cancel broadcast for other drivers
      io.emit('order-claimed', { orderId });
      
      await createNotification(orderRows[0].user_id, 'Driver Assigned', `Driver ${driver.name} has been assigned to your order.`, 'info', io);
    }
    
    res.json({ success: true });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed to accept' }); 
  }
});

// Decline assignment (In broadcast model, this just dismisses locally)
router.post('/decline/:orderId', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true });
  } catch (err) { 
    console.error(err);
    res.status(500).json({ error: 'Failed to decline' }); 
  }
});

// Confirm pickup with OTP
router.post('/pickup/:orderId', authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const orderId = req.params.orderId;
    
    const [orders] = await db.execute('SELECT pickup_otp, user_id, restaurant_id FROM orders WHERE id=? AND driver_id=?', [orderId, req.user.id]);
    const order = orders[0];
    
    if (!order) return res.status(404).json({ error: 'Order not found or not assigned to you' });
    
    if (!otp || String(order.pickup_otp) !== String(otp)) {
      return res.status(400).json({ error: 'Invalid pickup OTP' });
    }    
    await db.execute("UPDATE orders SET status='out_for_delivery', picked_up_at=NOW(), updated_at=NOW() WHERE id=?", [orderId]);
    
    const [updatedOrder] = await db.execute('SELECT * FROM orders WHERE id=?', [orderId]);
    
    const io = req.app.get('io');
    if (io) {
      io.to(`order-${orderId}`).emit('order-status-update', { orderId, status: 'out_for_delivery' });
      io.emit('order-updated', updatedOrder[0]);
      await createNotification(order.user_id, 'Out for Delivery', `Your order has been picked up and is on its way!`, 'info', io);
      
      // Notify restaurant owner
      const [restOwner] = await db.execute('SELECT owner_id FROM restaurants WHERE id=?', [order.restaurant_id]);
      if (restOwner[0]) {
        await createNotification(restOwner[0].owner_id, 'Order Picked Up', `Order #${orderId.substring(0,8)} has been picked up by the driver and is out for delivery.`, 'info', io);
      }
    }
    
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: 'Failed to confirm pickup' }); 
  }
});

// Confirm delivery with OTP
router.post('/deliver/:orderId', authenticateToken, async (req, res) => {
  try {
    const { otp, actualPaymentMethod } = req.body;
    const orderId = req.params.orderId;
    
    const [orders] = await db.execute('SELECT delivery_otp, user_id, restaurant_id, payment_method FROM orders WHERE id=? AND driver_id=?', [orderId, req.user.id]);
    const order = orders[0];
    
    if (!order) return res.status(404).json({ error: 'Order not found or not assigned to you' });
    
    if (!otp || String(order.delivery_otp) !== String(otp)) {
      return res.status(400).json({ error: 'Invalid delivery OTP' });
    }

    let finalPaymentMethod = order.payment_method;
    if (order.payment_method === 'COD' && actualPaymentMethod === 'UPI') {
      finalPaymentMethod = 'UPI'; // Update to UPI if paid via QR at door
    }

    await db.execute(
      "UPDATE orders SET status='delivered', payment_status='paid', payment_method=?, delivered_at=NOW(), updated_at=NOW() WHERE id=?", 
      [finalPaymentMethod, orderId]
    );
    await db.execute("UPDATE delivery_agents SET status='available', total_deliveries=total_deliveries+1 WHERE user_id=?", [req.user.id]);
    
    const [updatedOrder] = await db.execute('SELECT * FROM orders WHERE id=?', [orderId]);
    
    const io = req.app.get('io');
    if (io) {
      io.to(`order-${orderId}`).emit('order-status-update', { orderId, status: 'delivered' });
      io.emit('order-updated', updatedOrder[0]);
      await createNotification(order.user_id, 'Order Delivered', `Your order has been delivered successfully. Enjoy your food!`, 'success', io);
      
      // Notify restaurant owner
      const [restOwner] = await db.execute('SELECT owner_id FROM restaurants WHERE id=?', [order.restaurant_id]);
      if (restOwner[0]) {
        await createNotification(restOwner[0].owner_id, 'Order Delivered', `Order #${orderId.substring(0,8)} has been delivered successfully to the customer.`, 'success', io);
      }
    }
    
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: 'Failed to confirm delivery' }); 
  }
});

// Existing routes that remain unchanged (location, status, stats)

router.get('/my-deliveries', authenticateToken, async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, o.grand_total as total_amount, r.name as restaurant_name, r.address as restaurant_address, r.lat as restaurant_lat, r.lon as restaurant_lon,
             u.name as customer_name, u.phone as customer_phone, u.address as customer_address, u.lat as customer_lat, u.lon as customer_lon
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id JOIN users u ON o.user_id = u.id
      WHERE o.driver_id = ? AND o.status IN ('driver_assigned','out_for_delivery')
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    for (const o of orders) {
      const [items] = await db.execute('SELECT * FROM order_items WHERE order_id=?', [o.id]);
      o.items = items;
    }
    res.json(orders);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

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

router.post('/location', authenticateToken, validateLocationUpdate, async (req, res) => {
  try {
    const { lat, lon } = req.body;
    await db.execute('UPDATE delivery_agents SET current_lat=?, current_lon=? WHERE user_id=?', [lat, lon, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/toggle-status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE delivery_agents SET status=? WHERE user_id=?', [status, req.user.id]);
    const [agents] = await db.execute('SELECT * FROM delivery_agents WHERE user_id=?', [req.user.id]);
    res.json(agents[0]);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [agents] = await db.execute('SELECT * FROM delivery_agents WHERE user_id=?', [req.user.id]);
    const agent = agents[0];
    const [todayRows] = await db.execute("SELECT COUNT(*) as count FROM orders WHERE driver_id=? AND DATE(created_at)=CURDATE()", [req.user.id]);
    const [statsRows] = await db.execute(`
      SELECT 
        COALESCE(SUM(delivery_fee),0) as total,
        COALESCE(SUM(CASE WHEN payment_method='COD' THEN grand_total ELSE 0 END),0) as cash_in_hand
      FROM orders 
      WHERE driver_id=? AND status='delivered'
    `, [req.user.id]);
    const [settledRows] = await db.execute(`
      SELECT COALESCE(SUM(amount),0) as total_settled 
      FROM settlements 
      WHERE entity_type='driver' AND entity_id=? AND status='completed'
    `, [req.user.id]);
    const [pendingRows] = await db.execute(`
      SELECT COALESCE(SUM(amount),0) as pending_settled 
      FROM settlements 
      WHERE entity_type='driver' AND entity_id=? AND status='pending'
    `, [req.user.id]);
    res.json({ 
      ...agent, 
      todayOrders: todayRows[0].count, 
      totalEarnings: statsRows[0].total || 0,
      cashInHand: statsRows[0].cash_in_hand || 0,
      totalSettled: settledRows[0].total_settled || 0,
      pendingSettled: pendingRows[0].pending_settled || 0
    });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/settle-cash', authenticateToken, async (req, res) => {
  try {
    const { amount, transaction_ref } = req.body;
    const id = uuidv4();
    await db.execute(
      "INSERT INTO settlements (id, entity_type, entity_id, amount, status, transaction_ref) VALUES (?, 'driver', ?, ?, 'pending', ?)",
      [id, req.user.id, amount, transaction_ref]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request settlement' });
  }
});

export default router;
