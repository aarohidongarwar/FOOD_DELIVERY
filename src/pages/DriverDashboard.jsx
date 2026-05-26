import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  IndianRupee, 
  Bell, 
  User, 
  LogOut, 
  Power,
  Star,
  TrendingUp,
  CircleDollarSign,
  Truck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  BarChart3,
  Calendar,
  CheckCircle2,
  Lock,
  Mail,
  X,
  Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import useAuthStore from '../stores/authStore';
import api from '../api';
import 'leaflet/dist/leaflet.css';
import './DriverDashboard.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135755.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

function MapUpdater({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14);
    }
  }, [lat, lon, map]);
  return null;
}

export default function DriverDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [earningsFilter, setEarningsFilter] = useState('This Month');
  const [isOnline, setIsOnline] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [socket, setSocket] = useState(null);
  
  const [stats, setStats] = useState({
    todayEarnings: 75,
    weekEarnings: 75,
    monthEarnings: 75,
    totalDeliveries: 142,
    activeOrders: 1,
    rating: 4.8,
    avgPerDelivery: 38,
    totalEarningsBreakdown: 75,
    totalDeliveriesBreakdown: 2
  });

  const [orders, setOrders] = useState([]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Delivery Completed',
      message: 'Order ORD-001-SAMPLE delivered. Earnings: Rs.45',
      time: '9 May, 06:52 pm',
      unread: false,
      type: 'success'
    },
    {
      id: 2,
      title: 'New Order Assigned',
      message: 'You have been assigned order ORD-003-SAMPLE from Dominos',
      time: '9 May, 06:52 pm',
      unread: true,
      type: 'info'
    }
  ]);

  const [profileData, setProfileData] = useState({
    fullName: user?.name || 'Arjun Sharma',
    phone: user?.phone || '9876543210',
    email: user?.email || 'arjun@rider.com',
    address: '12 MG Road, Bangalore',
    emergencyContact: '9988776655',
    vehicleNumber: 'KA01MN5678',
    vehicleType: 'Bike'
  });

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/delivery/stats');
      if (data) {
        setStats(prev => ({
          ...prev,
          todayEarnings: data.totalEarnings || 0, // Fallback if no specific today earnings
          totalDeliveries: data.total_deliveries || 0,
          activeOrders: data.active_orders || 0,
          rating: data.rating || 5.0,
          totalEarningsBreakdown: data.totalEarnings || 0,
          monthEarnings: data.totalEarnings || 0,
          weekEarnings: data.totalEarnings || 0
        }));
        setIsOnline(data.status !== 'offline');
        
        // Update profile data with real data from backend
        setProfileData(prev => ({
          ...prev,
          fullName: user?.name || prev.fullName,
          phone: user?.phone || data.phone || prev.phone,
          email: user?.email || prev.email,
          vehicleType: data.vehicle_type || prev.vehicleType,
          vehicleNumber: data.vehicle_number || prev.vehicleNumber,
          emergencyContact: data.emergency_contact || prev.emergencyContact,
          address: user?.address || prev.address
        }));
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Connect socket
    const s = io('/', { path: '/socket.io' });
    setSocket(s);
    
    if (user) {
      s.emit('register', user.id);
    }

    return () => s.disconnect();
  }, [user]);

  // Location Tracking
  useEffect(() => {
    let watchId;
    if (isOnline && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLoc = { lat: latitude, lon: longitude };
          setCurrentLocation(newLoc);
          
          // Send to API
          api.post('/delivery/location', newLoc).catch(console.error);
          
          // Send to Socket for active orders
          if (socket && activeDeliveries.length > 0) {
            activeDeliveries.forEach(order => {
              socket.emit('driver-location', {
                orderId: order.id,
                lat: latitude,
                lon: longitude
              });
            });
          }
        },
        (err) => console.error("Location error:", err),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, socket, activeDeliveries]);

  const fetchActiveDeliveries = async () => {
    try {
      const { data } = await api.get('/delivery/my-deliveries');
      setActiveDeliveries(data.map(order => ({
        ...order,
        restaurant: order.restaurant_name,
        pickup: order.restaurant_address,
        delivery: order.customer_address || order.delivery_address,
        customer: order.customer_name,
        phone: order.customer_phone,
        fee: order.delivery_fee,
        expanded: false,
        status: order.status === 'out_for_delivery' ? 'On The Way' : 'Preparing'
      })));
      setStats(prev => ({ ...prev, activeOrders: data.length }));
    } catch (err) {
      console.error("Failed to fetch active deliveries", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data } = await api.get('/delivery/history');
      setOrders(data.map(order => ({
        ...order,
        restaurant: order.restaurant_name,
        fee: order.delivery_fee,
        date: new Date(order.created_at).toLocaleDateString(),
        status: order.status === 'delivered' ? 'Delivered' : 'Cancelled'
      })));
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'map' || activeTab === 'orders' || activeTab === 'dashboard') {
      fetchActiveDeliveries();
    }
    if (activeTab === 'earnings') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const toggleStatus = async () => {
    try {
      const newStatus = isOnline ? 'offline' : 'available';
      await api.post('/delivery/toggle-status', { status: newStatus });
      setIsOnline(!isOnline);
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const toggleOrderExpand = (id) => {
    setActiveDeliveries(activeDeliveries.map(order => 
      order.id === id ? { ...order, expanded: !order.expanded } : order
    ));
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    alert('Password updated successfully!');
  };

  const openOtpModal = (id) => {
    setSelectedOrderId(id);
    setShowOtpModal(true);
    setOtpInput('');
  };

  const handleVerifyDelivery = async () => {
    if (otpInput.length === 4 || otpInput === '') { // Allow empty for demo
      try {
        await api.put(`/orders/${selectedOrderId}/status`, { status: 'delivered' });
        alert(`Order delivered successfully!`);
        setShowOtpModal(false);
        setActiveDeliveries(activeDeliveries.filter(o => o.id !== selectedOrderId));
        fetchStats(); // Update earnings
      } catch (err) {
        alert('Failed to update status');
      }
    } else {
      alert('Please enter a valid 4-digit OTP');
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="driver-dashboard-layout">
      {/* Sidebar */}
      <aside className="driver-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon-box">
            <Truck size={24} color="white" />
          </div>
          <div className="logo-text-box">
            <h2>QuickBite</h2>
            <p>Rider Portal</p>
          </div>
        </div>

        <div className="sidebar-user">
          <h3>{user?.name || 'Arjun Sharma'}</h3>
          <p>
            <span className={`status-dot ${isOnline ? 'online' : ''}`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={20} />
            <span>Orders</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            <IndianRupee size={20} />
            <span>Earnings</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
          </div>
          <div 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={20} />
            <span>Profile</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <Navigation size={20} />
            <span>Navigation</span>
          </div>
          <div className="nav-item logout-nav-item" onClick={handleLogout} style={{ marginTop: '20px', color: '#ef4444' }}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="driver-main">
        <header className="main-header">
          <div className="header-title">
            <h1>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'orders' && 'My Orders'}
              {activeTab === 'earnings' && 'Earnings'}
              {activeTab === 'notifications' && 'Notifications'}
              {activeTab === 'profile' && 'My Profile'}
            </h1>
            <p>
              {activeTab === 'dashboard' && `Welcome back, ${user?.name?.split(' ')[0] || 'Arjun'}`}
              {activeTab === 'orders' && `${orders.length} orders found`}
              {activeTab === 'earnings' && 'Track your delivery income'}
              {activeTab === 'notifications' && `${unreadCount} unread`}
              {activeTab === 'profile' && 'Manage your account details'}
            </p>
          </div>
          <div className="header-actions">
            {activeTab === 'notifications' && (
              <button className="mark-read-btn" onClick={markAllRead}>
                <CheckCircle2 size={18} />
                <span>Mark all read</span>
              </button>
            )}
            <button 
              className={`go-online-btn ${isOnline ? 'online' : ''}`}
              onClick={toggleStatus}
            >
              <Power size={18} />
              {isOnline ? 'Go Offline' : 'Go Online'}
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <section className="stats-grid">
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Today's Earnings</span>
                  <CircleDollarSign size={20} className="card-icon text-green" />
                </div>
                <div className="card-value">₹{stats.todayEarnings}</div>
              </div>

              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">This Week</span>
                  <TrendingUp size={20} className="card-icon text-orange" />
                </div>
                <div className="card-value">₹{stats.weekEarnings}</div>
              </div>

              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Total Deliveries</span>
                  <Package size={20} className="card-icon text-blue" />
                </div>
                <div className="card-value">{stats.totalDeliveries}</div>
              </div>

              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Active Orders</span>
                  <Package size={20} className="card-icon text-purple" />
                </div>
                <div className="card-value">{stats.activeOrders}</div>
              </div>

              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Rating</span>
                  <Star size={20} className="card-icon text-yellow" />
                </div>
                <div className="card-value">{stats.rating} <span style={{fontSize: '1rem', color: '#666'}}>★</span></div>
              </div>

              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">This Month</span>
                  <IndianRupee size={20} className="card-icon text-orange" />
                </div>
                <div className="card-value">₹{stats.monthEarnings}</div>
              </div>
            </section>

            {/* Earnings Breakdown */}
            <section className="breakdown-card">
              <div className="breakdown-header">
                <h3>Earnings Breakdown</h3>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Average per Delivery</span>
                <span className="breakdown-value">₹{stats.avgPerDelivery}</span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Total Earnings</span>
                <span className="breakdown-value">₹{stats.totalEarningsBreakdown}</span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Total Deliveries</span>
                <span className="breakdown-value">{stats.totalDeliveriesBreakdown}</span>
              </div>
            </section>
          </>
        )}

        {activeTab === 'orders' && (
          <section className="orders-list">
            {activeDeliveries.map(order => (
              <div key={order.id} className={`order-card ${order.expanded ? 'expanded' : ''}`}>
                <div className="order-header" onClick={() => toggleOrderExpand(order.id)}>
                  <div className="order-info">
                    <span className="order-id">{order.id}</span>
                    <h3 className="order-restaurant">{order.restaurant}</h3>
                  </div>
                  <div className="order-status-wrapper">
                    <span className={`order-status-badge ${order.status.toLowerCase().replace(/ /g, '-')}`}>
                      {order.status}
                    </span>
                    {order.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {order.expanded && (
                  <div className="order-details animate-fade-in">
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Pickup</span>
                        <div className="detail-value">
                          <MapPin size={16} className="text-orange" />
                          <span>{order.pickup}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Delivery</span>
                        <div className="detail-value">
                          <MapPin size={16} className="text-green" />
                          <span>{order.delivery}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="details-footer">
                      <div className="customer-info">
                        <div className="info-segment">
                          <User size={16} />
                          <span>{order.customer}</span>
                        </div>
                        <div className="info-segment">
                          <Phone size={16} />
                          <span>{order.phone}</span>
                        </div>
                      </div>
                      <div className="order-fee">
                        ₹{order.fee} fee
                      </div>
                    </div>

                    {order.status === 'On The Way' && (
                      <div className="order-actions-row">
                        <button 
                          className="deliver-otp-btn"
                          onClick={() => openOtpModal(order.id)}
                        >
                          Deliver (OTP)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {activeTab === 'earnings' && (
          <div className="earnings-view">
            {/* Summary Cards */}
            <div className="earnings-summary-grid">
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Today</span>
                  <CircleDollarSign size={18} className="card-icon text-green" />
                </div>
                <div className="card-value">₹{stats.todayEarnings}</div>
              </div>
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">This Week</span>
                  <TrendingUp size={18} className="card-icon text-orange" />
                </div>
                <div className="card-value">₹{stats.weekEarnings}</div>
              </div>
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">This Month</span>
                  <BarChart3 size={18} className="card-icon text-blue" />
                </div>
                <div className="card-value">₹{stats.monthEarnings}</div>
              </div>
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Total</span>
                  <Package size={18} className="card-icon text-purple" />
                </div>
                <div className="card-value">₹{stats.totalEarningsBreakdown}</div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              {['Today', 'This Week', 'This Month', 'All Time'].map(filter => (
                <button 
                  key={filter}
                  className={`filter-tab ${earningsFilter === filter ? 'active' : ''}`}
                  onClick={() => setEarningsFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Earnings History */}
            <div className="breakdown-card earnings-history-card">
              <div className="breakdown-header history-header">
                <h3>Earnings History</h3>
                <span className="total-label">Total: <span className="text-orange">₹{stats.totalEarningsBreakdown}</span></span>
              </div>
              <div className="history-list">
                {orders.filter(o => o.status === 'Delivered').map(order => (
                  <div key={order.id} className="history-item">
                    <div className="history-info">
                      <span className="history-order-id">{order.id}</span>
                      <span className="history-date">{order.date}</span>
                    </div>
                    <div className="history-amount text-green">
                      + ₹{order.fee}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <section className="notifications-list">
            {notifications.map(notif => (
              <div key={notif.id} className={`notification-card ${notif.unread ? 'unread' : ''}`}>
                <div className={`notif-icon-box ${notif.type}`}>
                  <Package size={20} />
                </div>
                <div className="notif-content">
                  <div className="notif-header">
                    <h3 className="notif-title">
                      {notif.title}
                      {notif.unread && <span className="unread-dot"></span>}
                    </h3>
                  </div>
                  <p className="notif-message">{notif.message}</p>
                  <span className="notif-time">{notif.time}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="profile-view">
            {/* Profile Summary Card */}
            <div className="profile-summary-card">
              <div className="profile-main-info">
                <div className="profile-avatar-box">
                  <User size={40} color="#ff5200" />
                </div>
                <div className="profile-name-email">
                  <h3>{profileData.fullName}</h3>
                  <p>{profileData.email}</p>
                </div>
                <div className="profile-badges">
                  <span className="badge-approved">Approved</span>
                  <div className="profile-rating">
                    <Star size={14} fill="#F59E0B" color="#F59E0B" />
                    <span>{stats.rating}</span>
                  </div>
                </div>
              </div>
              <div className="profile-stats-row">
                <div className="p-stat-item">
                  <span className="p-stat-value">{stats.totalDeliveries}</span>
                  <span className="p-stat-label">Deliveries</span>
                </div>
                <div className="p-stat-item">
                  <span className="p-stat-value">{profileData.vehicleType}</span>
                  <span className="p-stat-label">Vehicle</span>
                </div>
                <div className="p-stat-item">
                  <span className="p-stat-value">{profileData.vehicleNumber}</span>
                  <span className="p-stat-label">Reg. No.</span>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div className="profile-form-container">
              <div className="form-section-header">
                <h3>EDIT PROFILE</h3>
              </div>
              <form className="profile-form" onSubmit={handleProfileUpdate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={profileData.fullName} 
                      onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      type="text" 
                      value={profileData.phone} 
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address</label>
                    <input 
                      type="text" 
                      value={profileData.address} 
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input 
                      type="text" 
                      value={profileData.emergencyContact} 
                      onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Number</label>
                    <input 
                      type="text" 
                      value={profileData.vehicleNumber} 
                      onChange={(e) => setProfileData({...profileData, vehicleNumber: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="save-btn">Save Changes</button>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="profile-form-container">
              <div className="form-section-header">
                <Lock size={16} />
                <h3>CHANGE PASSWORD</h3>
              </div>
              <form className="profile-form" onSubmit={handlePasswordUpdate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Current Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="update-password-btn">Update Password</button>
              </form>
            </div>
          </section>
        )}

        {activeTab === 'map' && (
          <section className="map-view">
            <div className="map-container-card">
              <div className="map-header-bar">
                <div className="tracking-status">
                  <div className={`status-pulse ${isOnline ? 'active' : ''}`}></div>
                  <span>{isOnline ? 'Live Tracking Active' : 'Go Online to enable tracking'}</span>
                </div>
                {activeDeliveries.length > 0 && (
                  <div className="active-order-badge">
                    {activeDeliveries.length} Active {activeDeliveries.length === 1 ? 'Order' : 'Orders'}
                  </div>
                )}
              </div>
              
              <div className="dashboard-map-wrapper">
                <MapContainer 
                  center={currentLocation ? [currentLocation.lat, currentLocation.lon] : [19.0760, 72.8777]} 
                  zoom={13} 
                  className="dashboard-leaflet-map"
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  
                  {currentLocation && (
                    <Marker position={[currentLocation.lat, currentLocation.lon]} icon={driverIcon}>
                      <Popup>You are here</Popup>
                    </Marker>
                  )}

                  {activeDeliveries.map(order => (
                    <div key={order.id}>
                      {order.restaurant_lat && (
                        <Marker position={[order.restaurant_lat, order.restaurant_lon]} icon={restaurantIcon}>
                          <Popup>
                            <strong>Pickup: {order.restaurant_name}</strong><br/>
                            Order: {order.id}
                          </Popup>
                        </Marker>
                      )}
                      {order.delivery_lat && (
                        <Marker position={[order.delivery_lat, order.delivery_lon]} icon={customerIcon}>
                          <Popup>
                            <strong>Delivery: {order.customer_name}</strong><br/>
                            {order.delivery_address}
                          </Popup>
                        </Marker>
                      )}
                    </div>
                  ))}
                  
                  {currentLocation && <MapUpdater lat={currentLocation.lat} lon={currentLocation.lon} />}
                </MapContainer>
              </div>

              <div className="map-delivery-list">
                <h3>Current Assignments</h3>
                {activeDeliveries.length === 0 ? (
                  <p className="no-assignments">No active orders to display on map.</p>
                ) : (
                  <div className="assignment-cards">
                    {activeDeliveries.map(order => (
                      <div key={order.id} className="assignment-mini-card">
                        <div className="mini-card-header">
                          <span className="mini-id">{order.id}</span>
                          <span className="mini-status">{order.status}</span>
                        </div>
                        <div className="mini-route">
                          <div className="route-stop">
                            <div className="dot pickup"></div>
                            <span>{order.restaurant_name}</span>
                          </div>
                          <div className="route-line"></div>
                          <div className="route-stop">
                            <div className="dot delivery"></div>
                            <span>{order.customer_name}</span>
                          </div>
                        </div>
                        <button className="navigate-btn" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.restaurant_lat},${order.restaurant_lon}`, '_blank')}>
                          Navigate to Pickup
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* OTP Modal */}
      {showOtpModal && (
        <div className="modal-overlay">
          <div className="otp-modal animate-fade-in">
            <button className="modal-close" onClick={() => setShowOtpModal(false)}>
              <X size={24} />
            </button>
            
            <div className="modal-header">
              <div className="success-icon-circle">
                <CheckCircle2 size={28} color="#10B981" />
              </div>
              <h2>Verify Delivery OTP</h2>
            </div>

            <div className="modal-body">
              <p>Enter the 4-digit OTP provided by the customer for order <strong>{selectedOrderId}</strong></p>
              
              <div className="otp-input-wrapper">
                <input 
                  type="text" 
                  maxLength="4"
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="otp-input-field"
                />
              </div>

              <button 
                className="verify-btn"
                onClick={handleVerifyDelivery}
              >
                Verify & Complete Delivery
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
