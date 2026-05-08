import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { MapPin, Navigation, IndianRupee, Package, CheckCircle, Power } from 'lucide-react';
import api from '../api';
import useAuthStore from '../stores/authStore';
import { OrderStatusBadge, LoadingSpinner } from '../components';
import './Dashboard.css';

export default function DriverDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDriverData = async () => {
    try {
      const [statsRes, availableRes, activeRes] = await Promise.all([
        api.get('/delivery/stats'),
        api.get('/delivery/available'),
        api.get('/delivery/my-deliveries')
      ]);
      setStats(statsRes.data);
      setAvailableOrders(availableRes.data);
      setActiveDeliveries(activeRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();

    // Setup socket to receive new orders
    const socket = io('/', { path: '/socket.io' });
    
    socket.on('new-order', (order) => {
      // Re-fetch available orders if we receive a new order event
      // Alternatively, we could just append if it doesn't have a driver
      if (!order.driver_id) {
        fetchDriverData();
      }
    });

    socket.on('order-updated', () => {
      fetchDriverData();
    });

    // Simulate location updates if active
    const locationInterval = setInterval(() => {
      if (stats?.status !== 'offline') {
        // Random slight movement around Mumbai
        const lat = 19.0760 + (Math.random() - 0.5) * 0.01;
        const lon = 72.8777 + (Math.random() - 0.5) * 0.01;
        
        api.post('/delivery/location', { lat, lon }).catch(() => {});
        
        // Also emit via socket for active deliveries
        activeDeliveries.forEach(order => {
          socket.emit('driver-location', { orderId: order.id, lat, lon });
        });
      }
    }, 10000); // Update every 10s

    return () => {
      socket.disconnect();
      clearInterval(locationInterval);
    };
  }, [stats?.status, activeDeliveries]);

  const toggleStatus = async () => {
    try {
      const newStatus = stats.status === 'offline' ? 'available' : 'offline';
      const { data } = await api.post('/delivery/toggle-status', { status: newStatus });
      setStats({ ...stats, status: data.status });
    } catch (err) {
      alert('Failed to change status');
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      await api.post(`/delivery/accept/${orderId}`);
      fetchDriverData();
    } catch (err) {
      alert('Failed to accept order');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchDriverData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const isOnline = stats?.status === 'available' || stats?.status === 'busy';

  return (
    <div className="dashboard-page container">
      <div className="driver-header">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="subtitle">Here's your delivery dashboard</p>
        </div>
        <button 
          className={`btn ${isOnline ? 'btn-status-online' : 'btn-status-offline'}`}
          onClick={toggleStatus}
        >
          <Power size={18} />
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-green-light">
            <IndianRupee size={24} className="text-green" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Earnings</p>
            <h3 className="stat-value">₹{stats?.totalEarnings || 0}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-light">
            <Package size={24} className="text-blue" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Deliveries Today</p>
            <h3 className="stat-value">{stats?.todayOrders || 0}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-yellow-light">
            <CheckCircle size={24} className="text-yellow" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Deliveries</p>
            <h3 className="stat-value">{stats?.total_deliveries || 0}</h3>
          </div>
        </div>
      </div>

      {!isOnline ? (
        <div className="offline-state">
          <Navigation size={64} className="text-muted" />
          <h2>You are offline</h2>
          <p>Go online to start receiving delivery requests.</p>
        </div>
      ) : (
        <div className="dashboard-layout">
          <div className="dashboard-main">
            {/* Active Deliveries */}
            {activeDeliveries.length > 0 && (
              <div className="dashboard-card mb-4">
                <div className="card-header">
                  <h3>Active Deliveries</h3>
                  <span className="badge badge-primary">{activeDeliveries.length}</span>
                </div>
                <div className="delivery-list">
                  {activeDeliveries.map(order => (
                    <div key={order.id} className="delivery-card active">
                      <div className="delivery-header">
                        <div>
                          <p className="delivery-id">Order #{order.id.slice(0,8).toUpperCase()}</p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <h3 className="delivery-amount">₹{order.total_amount}</h3>
                      </div>
                      
                      <div className="delivery-route">
                        <div className="route-point">
                          <StoreIcon />
                          <div className="route-info">
                            <p className="route-label">Pickup</p>
                            <p className="route-name">{order.restaurant_name}</p>
                            <p className="route-address">{order.restaurant_address}</p>
                          </div>
                        </div>
                        <div className="route-line" />
                        <div className="route-point">
                          <UserIcon />
                          <div className="route-info">
                            <p className="route-label">Drop-off</p>
                            <p className="route-name">{order.customer_name} ({order.customer_phone})</p>
                            <p className="route-address">{order.delivery_address}</p>
                          </div>
                        </div>
                      </div>

                      <div className="delivery-actions">
                        {order.status === 'confirmed' && (
                          <button className="btn btn-primary" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                            At Restaurant (Preparing)
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button className="btn btn-primary" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}>
                            Picked Up (Out for delivery)
                          </button>
                        )}
                        {order.status === 'out_for_delivery' && (
                          <button className="btn btn-primary" style={{background: 'var(--accent-green)'}} onClick={() => updateOrderStatus(order.id, 'delivered')}>
                            Mark as Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Orders */}
            <div className="dashboard-card">
              <div className="card-header">
                <h3>New Requests</h3>
                <span className="badge badge-green">{availableOrders.length}</span>
              </div>
              
              {availableOrders.length === 0 ? (
                <div className="empty-state">
                  <p>No new delivery requests right now.</p>
                </div>
              ) : (
                <div className="delivery-list">
                  {availableOrders.map(order => (
                    <div key={order.id} className="delivery-card">
                      <div className="delivery-header">
                        <div>
                          <p className="delivery-id">Order #{order.id.slice(0,8).toUpperCase()}</p>
                          <p className="delivery-restaurant">{order.restaurant_name}</p>
                        </div>
                        <div className="text-right">
                          <h3 className="delivery-fee">₹{order.delivery_fee || 29}</h3>
                          <p className="delivery-dist">~3.2 km</p>
                        </div>
                      </div>
                      <div className="delivery-actions">
                        <button className="btn btn-primary w-full" onClick={() => acceptOrder(order.id)}>
                          Accept Delivery
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="dashboard-sidebar">
            <div className="dashboard-card">
              <div className="card-header">
                <h3>Profile</h3>
              </div>
              <div className="driver-profile-mini">
                <div className="dp-avatar">{user.name.charAt(0)}</div>
                <h4>{user.name}</h4>
                <p>★ {stats?.rating?.toFixed(1) || '5.0'} Rating</p>
                <p>{user.phone}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreIcon() {
  return <div className="route-icon pickup"><MapPin size={16} /></div>;
}
function UserIcon() {
  return <div className="route-icon dropoff"><MapPin size={16} /></div>;
}
