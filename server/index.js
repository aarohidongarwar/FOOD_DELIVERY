import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import db from './db.js';
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import deliveryRoutes from './routes/delivery.js';
import adminRoutes from './routes/admin.js';
import cartRoutes from './routes/cart.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Make io accessible in routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Haversine distance calculation in meters
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

import { connectedUsers, notifiedOrders } from './state.js';

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('join-order', (orderId) => {
    socket.join(`order-${orderId}`);
  });

  socket.on('driver-location', (data) => {
    // Broadcast driver location to order room
    if (data.orderId) {
      io.to(`order-${data.orderId}`).emit('driver-location-update', {
        lat: data.lat,
        lon: data.lon,
        orderId: data.orderId
      });

      // Geofencing logic - notify restaurant
      if (data.restaurantLat && data.restaurantLon && ['pending', 'confirmed', 'accepted', 'preparing', 'Preparing'].includes(data.status)) {
        const distRest = getDistanceFromLatLonInMeters(data.lat, data.lon, data.restaurantLat, data.restaurantLon);
        if (distRest < 50 && !notifiedOrders.has(`${data.orderId}-restaurant`)) {
          io.emit('driver-arrived-restaurant', { orderId: data.orderId, driverName: data.driverName || 'Driver' });
          notifiedOrders.add(`${data.orderId}-restaurant`);
        }
      }

      // Geofencing logic - notify customer
      if (data.deliveryLat && data.deliveryLon && ['out_for_delivery', 'Ready', 'On The Way'].includes(data.status)) {
        const distCust = getDistanceFromLatLonInMeters(data.lat, data.lon, data.deliveryLat, data.deliveryLon);
        if (distCust < 50 && !notifiedOrders.has(`${data.orderId}-customer`)) {
          io.to(`order-${data.orderId}`).emit('driver-approaching-customer', { orderId: data.orderId });
          notifiedOrders.add(`${data.orderId}-customer`);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Export for use in routes and testing
export { io, app };

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Database ready`);
  });
}
