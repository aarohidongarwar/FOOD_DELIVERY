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
  Navigation,
  Info
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';
import useNotificationStore from '../stores/notificationStore';
import api from '../api';
import { fetchOSRMRoute, interpolateRoute } from '../utils/osrm';
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
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2830/2830312.png',
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

function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function DriverDashboard() {
  const { user, logout } = useAuthStore();
  const toast = useToastStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [earningsFilter, setEarningsFilter] = useState('This Month');
  const [isOnline, setIsOnline] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Fallback to Nagpur if denied for testing
          setCurrentLocation({ lat: 21.1458, lon: 79.0882 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setCurrentLocation({ lat: 21.1458, lon: 79.0882 });
    }
  }, []);
  
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [socket, setSocket] = useState(null);
  const [simulatingOrder, setSimulatingOrder] = useState(null);
  const [otpType, setOtpType] = useState('delivery');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [deliveryPaymentMethod, setDeliveryPaymentMethod] = useState('COD');
  const [cashCollected, setCashCollected] = useState(false);
  const [newRequest, setNewRequest] = useState(null);
  const [showNavModal, setShowNavModal] = useState(false);
  const [navOrder, setNavOrder] = useState(null);
  const [osrmRoute, setOsrmRoute] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  
  const [stats, setStats] = useState({
    todayEarnings: 75,
    weekEarnings: 75,
    monthEarnings: 75,
    totalDeliveries: 142,
    activeOrders: 1,
    rating: 4.8,
    avgPerDelivery: 38,
    totalEarningsBreakdown: 75,
    cashInHand: 0,
    totalSettled: 0,
    pendingSettled: 0,
    totalDeliveriesBreakdown: 2
  });

  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [driverUtr, setDriverUtr] = useState('');

  // Fetch OSRM route when navigation modal opens or destination changes
  useEffect(() => {
    if (showNavModal && navOrder && currentLocation) {
      const isDelivery = navOrder.status === 'On The Way';
      const destLat = parseFloat(isDelivery ? (navOrder.delivery_lat || navOrder.customer_lat) : navOrder.restaurant_lat) || (isDelivery ? 21.14 : 21.1458);
      const destLon = parseFloat(isDelivery ? (navOrder.delivery_lon || navOrder.customer_lon) : navOrder.restaurant_lon) || (isDelivery ? 79.08 : 79.0882);

      fetchOSRMRoute([currentLocation.lat, currentLocation.lon], [destLat, destLon])
        .then(routeData => {
          if (routeData) {
            setOsrmRoute(routeData.coordinates);
            setRouteInfo({ distance: routeData.distance, duration: routeData.duration });
          } else {
            // Fallback
            setOsrmRoute([[currentLocation.lat, currentLocation.lon], [destLat, destLon]]);
            setRouteInfo(null);
          }
        });
    } else {
      setOsrmRoute(null);
      setRouteInfo(null);
    }
  }, [showNavModal, navOrder]); // Deliberately omit currentLocation to avoid re-fetching on every tick

  const [orders, setOrders] = useState([]);

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
          cashInHand: data.cashInHand || 0,
          totalSettled: data.totalSettled || 0,
          pendingSettled: data.pendingSettled || 0,
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

  const fetchPendingAssignment = async () => {
    try {
      const { data } = await api.get('/delivery/pending-assignment');
      if (data) setNewRequest(data);
    } catch(err) {}
  };

  useEffect(() => {
    fetchStats();
    fetchPendingAssignment();
    
    // Connect socket
    const s = io('/', { path: '/socket.io' });
    setSocket(s);
    
    if (user) {
      s.emit('register', user.id);
    }

    s.on('new-order-request', (data) => {
      setNewRequest(data);
    });

    s.on('order-claimed', (data) => {
      setNewRequest(prev => {
        if (prev && prev.orderId === data.orderId) return null;
        return prev;
      });
    });

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
        payment_method: order.payment_method,
        expanded: false,
        status: order.status === 'out_for_delivery' ? 'On The Way' : 'Preparing/Assigned'
      })));
      setStats(prev => ({ ...prev, activeOrders: data.length }));
    } catch (err) {
      console.error("Failed to fetch active deliveries", err);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await api.post(`/delivery/accept/${newRequest.orderId}`);
      setNewRequest(null);
      fetchActiveDeliveries();
      toast.success('Order Accepted!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        toast.warning('Ah! Another delivery partner already claimed this order.');
      } else {
        toast.error('Failed to accept order. It may have timed out.');
      }
      setNewRequest(null);
    }
  };

  const handleDeclineRequest = async () => {
    // In a broadcast model, declining simply dismisses the modal locally
    setNewRequest(null);
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

  const markAllNotificationsRead = () => {
    markAllAsRead();
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    toast.success('Profile updated successfully!');
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    toast.success('Password updated successfully!');
  };

  const openOtpModal = (id, type) => {
    setSelectedOrderId(id);
    setOtpType(type);
    setDeliveryPaymentMethod('COD');
    setCashCollected(false);
    setShowOtpModal(true);
    setOtpInput('');
  };

  const handleVerifyDelivery = async () => {
    if (otpInput.length === 6 || otpInput === '') { // Allow empty for demo
      try {
        if (otpType === 'pickup') {
          await api.post(`/delivery/pickup/${selectedOrderId}`, { otp: otpInput });
          toast.success('Order picked up successfully!');
        } else {
          await api.post(`/delivery/deliver/${selectedOrderId}`, { 
            otp: otpInput, 
            actualPaymentMethod: deliveryPaymentMethod === 'UPI' ? 'UPI' : 'COD',
            cash_collected: deliveryPaymentMethod === 'UPI' ? true : cashCollected
          });
          toast.success('Order delivered successfully!');
          setActiveDeliveries(activeDeliveries.filter(o => o.id !== selectedOrderId));
          fetchStats(); // Update earnings
        }
        setShowOtpModal(false);
        fetchActiveDeliveries();
      } catch (err) {
        toast.error('Failed to verify OTP');
      }
    } else {
      toast.warning('Please enter a valid 6-digit OTP');
    }
  };

  const simulateJourney = (order) => {
    if (!currentLocation) {
      toast.warning('No current location known to start simulation. Make sure you are online and have location permission.');
      return;
    }
    
    if (simulatingOrder) return;
    setSimulatingOrder(order.id);

    let targetLat, targetLon;
    const stat = order.status.toLowerCase();
    
    // If food is being prepared/pending, drive to restaurant. Else, drive to customer.
    if (['pending', 'confirmed', 'accepted', 'preparing'].includes(stat)) {
      targetLat = parseFloat(order.restaurant_lat);
      targetLon = parseFloat(order.restaurant_lon);
    } else {
      targetLat = parseFloat(order.delivery_lat || order.customer_lat);
      targetLon = parseFloat(order.delivery_lon || order.customer_lon);
    }

    if (!targetLat || !targetLon || isNaN(targetLat) || isNaN(targetLon)) {
      // Fallback destination coordinates if null in DB to allow simulation to proceed
      targetLat = parseFloat(order.restaurant_lat) - 0.005 || 21.1458;
      targetLon = parseFloat(order.restaurant_lon) - 0.005 || 79.0882;
      console.log('Using fallback coordinates for simulation:', targetLat, targetLon);
    }

    const steps = 30; // 30 steps simulation
    let currentStep = 0;
    const startLat = currentLocation.lat;
    const startLon = currentLocation.lon;
    
    // Smooth interpolation settings
    const tickMs = 200; 
    const totalSimDurationMs = 10000; // 10 seconds to reach destination
    const totalSteps = totalSimDurationMs / tickMs;
    
    // We already have an OSRM route if the nav modal is open. But simulateJourney can be triggered outside the modal.
    // Let's fetch it if needed, or use a straight line if not available immediately.
    const routePromise = osrmRoute && showNavModal 
      ? Promise.resolve({ coordinates: osrmRoute }) 
      : fetchOSRMRoute([startLat, startLon], [targetLat, targetLon]);

    routePromise.then(routeData => {
      let pathPoints;
      if (routeData && routeData.coordinates) {
        pathPoints = interpolateRoute(routeData.coordinates, totalSteps);
      } else {
        pathPoints = interpolateRoute([[startLat, startLon], [targetLat, targetLon]], totalSteps);
      }

      let currentStep = 0;
      
      const interval = setInterval(() => {
        if (currentStep >= pathPoints.length) {
          clearInterval(interval);
          setSimulatingOrder(null);
          return;
        }
        
        const newLat = pathPoints[currentStep][0];
        const newLon = pathPoints[currentStep][1];
        
        const loc = { lat: newLat, lon: newLon };
        setCurrentLocation(loc);
        
        // Only emit socket events every ~1 second to prevent flooding the backend
        if (socket && currentStep % (1000 / tickMs) === 0) {
          socket.emit('driver-location', {
            orderId: order.id,
            lat: newLat,
            lon: newLon,
            restaurantLat: parseFloat(order.restaurant_lat),
            restaurantLon: parseFloat(order.restaurant_lon),
            deliveryLat: parseFloat(order.delivery_lat || order.customer_lat),
            deliveryLon: parseFloat(order.delivery_lon || order.customer_lon),
            status: order.status,
            driverName: profileData.fullName
          });
        }
        currentStep++;
      }, tickMs);
    });
  };

  const netBalance = stats.totalEarningsBreakdown - stats.cashInHand - stats.totalSettled;
  const effectiveBalance = netBalance - (stats.pendingSettled || 0);

  const handleSettleToPlatform = async (e) => {
    e.preventDefault();
    if (!driverUtr.trim()) return toast.warning('Please enter the UTR / Reference number');
    try {
      // Driver pays admin -> amount is negative from the driver's perspective in admin ledger,
      // but we'll send it as the exact amount they owe. The backend will insert it as a negative amount.
      const amountToSettle = Math.abs(netBalance);
      // Let's send negative amount to backend to be consistent with admin logic where 
      // positive amount = admin pays driver, negative amount = driver pays admin.
      await api.post('/delivery/settle-cash', { amount: -amountToSettle, transaction_ref: driverUtr });
      toast.success('Settlement request submitted! Waiting for Admin approval.');
      setSettlementModalOpen(false);
      setDriverUtr('');
      fetchStats();
    } catch (err) {
      toast.error('Failed to submit settlement');
    }
  };

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
              {activeTab === 'orders' && `${activeDeliveries.length} active orders`}
              {activeTab === 'earnings' && 'Track your delivery income'}
              {activeTab === 'notifications' && `${unreadCount} unread`}
              {activeTab === 'profile' && 'Manage your account details'}
            </p>
          </div>
          <div className="header-actions">
            {activeTab === 'notifications' && (
              <button className="mark-read-btn" onClick={markAllNotificationsRead}>
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

                    {order.status === 'On The Way' ? (
                      <div className="order-actions-row">
                        <button 
                          className="deliver-otp-btn"
                          onClick={() => openOtpModal(order.id, 'delivery')}
                        >
                          Deliver (OTP)
                        </button>
                        <button 
                          className="btn-outline"
                          onClick={() => simulateJourney(order)}
                          disabled={simulatingOrder === order.id}
                        >
                          {simulatingOrder === order.id ? 'Simulating...' : 'Simulate GPS to Customer'}
                        </button>
                        <button 
                          className="btn-outline nav-icon-btn"
                          onClick={() => { setNavOrder(order); setShowNavModal(true); }}
                          title="Open Navigation"
                        >
                          <Navigation size={20} className="text-blue" />
                        </button>
                      </div>
                    ) : (
                      <div className="order-actions-row">
                        <button 
                          className="deliver-otp-btn"
                          onClick={() => openOtpModal(order.id, 'pickup')}
                        >
                          Pickup (OTP)
                        </button>
                        <button 
                          className="btn-outline"
                          onClick={() => simulateJourney(order)}
                          disabled={simulatingOrder === order.id}
                        >
                          {simulatingOrder === order.id ? 'Driving to Restaurant...' : 'Simulate GPS to Restaurant'}
                        </button>
                        <button 
                          className="btn-outline nav-icon-btn"
                          onClick={() => { setNavOrder(order); setShowNavModal(true); }}
                          title="Open Navigation"
                        >
                          <Navigation size={20} className="text-orange" />
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
            {/* Earnings & Settlement Summary */}
            <div className="earnings-summary-grid">
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Total Delivery Fees</span>
                  <Package size={18} className="card-icon text-green" />
                </div>
                <div className="card-value text-green">₹{stats.totalEarningsBreakdown?.toLocaleString()}</div>
                <p style={{fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0'}}>Your total earnings</p>
              </div>
              <div className="dashboard-card" style={{border: '1px solid var(--ph-orange)'}}>
                <div className="card-top">
                  <span className="card-label">COD Cash Collected</span>
                  <IndianRupee size={18} className="card-icon text-orange" />
                </div>
                <div className="card-value text-orange">₹{stats.cashInHand?.toLocaleString()}</div>
                <p style={{fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0'}}>Cash you hold for platform</p>
              </div>
              <div className="dashboard-card">
                <div className="card-top">
                  <span className="card-label">Already Settled</span>
                  <CheckCircle2 size={18} className="card-icon text-blue" />
                </div>
                <div className="card-value text-blue">₹{Math.abs(stats.totalSettled || 0).toLocaleString()}</div>
                <p style={{fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0 0'}}>Past settlements</p>
              </div>
              <div className="dashboard-card" style={{backgroundColor: netBalance < 0 ? '#FEF2F2' : netBalance > 0 ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${netBalance < 0 ? '#EF4444' : netBalance > 0 ? '#22C55E' : '#E2E8F0'}`}}>
                <div className="card-top">
                  <span className="card-label" style={{color: netBalance < 0 ? '#B91C1C' : netBalance > 0 ? '#166534' : '#64748B'}}>Net Balance</span>
                  <CircleDollarSign size={18} style={{color: netBalance < 0 ? '#EF4444' : netBalance > 0 ? '#22C55E' : '#94A3B8'}} />
                </div>
                <div className="card-value" style={{color: netBalance < 0 ? '#B91C1C' : netBalance > 0 ? '#166534' : '#1E293B'}}>
                  {netBalance < 0 ? `-₹${Math.abs(netBalance).toLocaleString()}` : `₹${Math.max(0, netBalance).toLocaleString()}`}
                </div>
                <p style={{fontSize: '0.8rem', color: netBalance < 0 ? '#991B1B' : netBalance > 0 ? '#15803D' : '#64748B', margin: '4px 0 0 0', fontWeight: 'bold'}}>
                  {netBalance < 0 ? 'You owe platform' : netBalance > 0 ? 'Platform owes you' : 'Fully settled'}
                </p>
              </div>
            </div>

            <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', marginBottom: '24px'}}>
              <Info size={20} color="#3B82F6" style={{flexShrink: 0, marginTop: '2px'}} />
              <div style={{fontSize: '0.9rem', color: '#1E40AF', lineHeight: '1.5'}}>
                <strong>How settlement works:</strong> You earn <strong>Delivery Fees</strong> for every order. 
                When you deliver <strong>COD orders</strong>, you collect cash on behalf of the platform. 
                <br/>Your <strong>Net Balance</strong> = (Delivery Fees Earned) - (COD Cash Collected) - (Already Settled).
                <br/>If the balance is negative, it means you have collected more cash than your earnings, and you need to deposit it to the platform.
              </div>
            </div>

            {effectiveBalance < 0 && (
              <div className="settlement-alert animate-fade-in" style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', color: '#b91c1c' }}>You owe the platform: ₹{Math.abs(effectiveBalance).toLocaleString()}</h3>
                  <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem' }}>Please settle your COD collections to continue receiving orders.</p>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ backgroundColor: '#dc2626' }}
                  onClick={() => setSettlementModalOpen(true)}
                >
                  Settle Balance
                </button>
              </div>
            )}

            {stats.pendingSettled < 0 && netBalance < 0 && effectiveBalance >= 0 && (
              <div className="settlement-alert animate-fade-in" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#b45309' }}>Deposit Pending Approval</h3>
                <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>You have submitted a settlement request of ₹{Math.abs(stats.pendingSettled).toLocaleString()} which is waiting for admin verification.</p>
              </div>
            )}

            {netBalance > 0 && (
              <div className="settlement-alert animate-fade-in" style={{ backgroundColor: '#dcfce7', border: '1px solid #22c55e', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#166534' }}>Net Balance: ₹{netBalance.toLocaleString()}</h3>
                <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem' }}>The platform owes you this amount. It will be settled to your bank account soon.</p>
              </div>
            )}

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
              <div 
                key={notif.id} 
                className={`notification-card ${!notif.is_read ? 'unread' : ''}`}
                onClick={() => { if(!notif.is_read) markAsRead(notif.id); }}
                style={{ cursor: !notif.is_read ? 'pointer' : 'default' }}
              >
                <div className={`notif-icon-box ${notif.type || 'info'}`}>
                  <Package size={20} />
                </div>
                <div className="notif-content">
                  <div className="notif-header">
                    <h3 className="notif-title">
                      {notif.title}
                      {!notif.is_read && <span className="unread-dot"></span>}
                    </h3>
                  </div>
                  <p className="notif-message">{notif.message}</p>
                  <span className="notif-time">{new Date(notif.created_at).toLocaleString()}</span>
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
      {showOtpModal && (() => {
        const currentModalOrder = activeDeliveries.find(o => o.id === selectedOrderId);
        return (
          <div className="modal-overlay">
            <div className="otp-modal animate-fade-in" style={{maxHeight: '90vh', overflowY: 'auto'}}>
              <button className="modal-close" onClick={() => setShowOtpModal(false)}>
                <X size={24} />
              </button>
              
              <div className="modal-header">
                <div className="success-icon-circle">
                  <CheckCircle2 size={28} color={otpType === 'pickup' ? '#F59E0B' : '#10B981'} />
                </div>
                <h2>Verify {otpType === 'pickup' ? 'Pickup' : 'Delivery'} OTP</h2>
              </div>

              <div className="modal-body">
                <p>Enter the 6-digit OTP provided by the {otpType === 'pickup' ? 'Restaurant' : 'Customer'} for order <strong>{selectedOrderId?.substring(0,8)}</strong></p>
                
                <div className="otp-input-wrapper">
                  <input 
                    type="text" 
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="otp-input-field"
                  />
                </div>

                {otpType === 'delivery' && currentModalOrder?.payment_method === 'COD' && (
                  <div className="payment-collection-section" style={{marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                    <h3 style={{fontSize: '1rem', marginBottom: '12px', textAlign: 'center'}}>Collect Payment: <span style={{color: 'var(--primary)', fontSize: '1.2rem'}}>₹{currentModalOrder.total_amount}</span></h3>
                    
                    <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                      <button 
                        style={{
                          flex: 1, padding: '10px', borderRadius: '6px', fontWeight: 'bold',
                          backgroundColor: deliveryPaymentMethod === 'COD' ? '#10B981' : '#fff',
                          color: deliveryPaymentMethod === 'COD' ? '#fff' : '#64748b',
                          border: `1px solid ${deliveryPaymentMethod === 'COD' ? '#10B981' : '#cbd5e1'}`,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onClick={() => { setDeliveryPaymentMethod('COD'); setCashCollected(false); }}
                      >
                        Cash
                      </button>
                      <button 
                        style={{
                          flex: 1, padding: '10px', borderRadius: '6px', fontWeight: 'bold',
                          backgroundColor: deliveryPaymentMethod === 'UPI' ? '#3B82F6' : '#fff',
                          color: deliveryPaymentMethod === 'UPI' ? '#fff' : '#64748b',
                          border: `1px solid ${deliveryPaymentMethod === 'UPI' ? '#3B82F6' : '#cbd5e1'}`,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onClick={() => setDeliveryPaymentMethod('UPI')}
                      >
                        UPI / QR
                      </button>
                    </div>

                    {deliveryPaymentMethod === 'UPI' && (
                      <div className="qr-container" style={{textAlign: 'center', padding: '10px', backgroundColor: 'white', borderRadius: '8px'}}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=quickbite@upi&pn=QuickBite&am=${currentModalOrder.total_amount}`)}`} 
                          alt="UPI QR Code" 
                          style={{width: '180px', height: '180px', margin: '0 auto'}}
                        />
                        <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: '10px'}}>Ask customer to scan and pay ₹{currentModalOrder.total_amount}</p>
                      </div>
                    )}

                    {/* Phase 3: Cash collection confirmation checkbox */}
                    {deliveryPaymentMethod === 'COD' && (
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        marginTop: '12px', padding: '12px', borderRadius: '8px',
                        backgroundColor: cashCollected ? '#F0FDF4' : '#FFF7ED',
                        border: `1.5px solid ${cashCollected ? '#86EFAC' : '#FDBA74'}`,
                        cursor: 'pointer', transition: 'all 0.2s',
                        fontWeight: '500', fontSize: '0.9rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={cashCollected}
                          onChange={(e) => setCashCollected(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                        />
                        <span style={{ color: cashCollected ? '#15803D' : '#9A3412' }}>
                          I have collected ₹{currentModalOrder.total_amount} from the customer
                        </span>
                      </label>
                    )}
                  </div>
                )}

                <button 
                  className="verify-btn"
                  style={{ 
                    backgroundColor: otpType === 'pickup' ? '#F59E0B' : '#10B981', 
                    marginTop: '20px',
                    opacity: (otpType === 'delivery' && currentModalOrder?.payment_method === 'COD' && deliveryPaymentMethod === 'COD' && !cashCollected) ? 0.5 : 1,
                    cursor: (otpType === 'delivery' && currentModalOrder?.payment_method === 'COD' && deliveryPaymentMethod === 'COD' && !cashCollected) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => handleVerifyDelivery(deliveryPaymentMethod)}
                  disabled={otpType === 'delivery' && currentModalOrder?.payment_method === 'COD' && deliveryPaymentMethod === 'COD' && !cashCollected}
                >
                  {otpType === 'pickup' ? 'Verify & Pickup' : (deliveryPaymentMethod === 'UPI' ? 'Verify & Confirm UPI Payment' : 'Verify & Complete Delivery')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settlement Modal (Driver App) */}
      {settlementModalOpen && effectiveBalance < 0 && (
        <div className="modal-overlay fade-in" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content scale-in" style={{backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>Settle Cash to Platform</h2>
              <button onClick={() => setSettlementModalOpen(false)} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20} /></button>
            </div>
            
            <div style={{marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', textAlign: 'center'}}>
              <p style={{margin: '0 0 8px 0', color: '#64748b', fontSize: '0.9rem'}}>Amount to Pay</p>
              <h2 style={{margin: 0, color: '#dc2626', fontSize: '2rem'}}>₹{Math.abs(effectiveBalance).toLocaleString()}</h2>
            </div>

            <div className="qr-container" style={{textAlign: 'center', marginBottom: '20px'}}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=admin@upi&pn=QuickBiteAdmin&am=${Math.abs(effectiveBalance)}`)}`} 
                alt="Admin UPI QR Code" 
                style={{width: '180px', height: '180px', margin: '0 auto', display: 'block'}}
              />
              <p style={{fontSize: '0.85rem', color: '#64748b', marginTop: '10px'}}>Scan this QR code with any UPI app (GPay, PhonePe, Paytm) to pay.</p>
            </div>

            <form onSubmit={handleSettleToPlatform}>
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>Enter UTR / Reference Number *</label>
                <input 
                  type="text" 
                  value={driverUtr}
                  onChange={(e) => setDriverUtr(e.target.value)}
                  placeholder="e.g. 123456789012"
                  required
                  style={{width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box'}}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}}
              >
                Submit Deposit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Request Modal */}`
      {newRequest && (
        <div className="modal-overlay fade-in">
          <div className="new-request-modal scale-in">
            <div style={{background: 'rgba(255, 82, 0, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto'}}>
              <Bell size={32} color="#ff5200" />
            </div>
            <h2 style={{margin: '0 0 8px 0'}}>New Delivery Request!</h2>
            <h3 style={{margin: '0 0 16px 0'}}>{newRequest.restaurant}</h3>
            
            <div className="new-request-stats">
              <div style={{textAlign: 'left'}}>
                <span className="new-request-stats-label">Distance</span>
                <p className="new-request-stats-val" style={{color: '#ffffff', margin: '4px 0 0 0'}}>{(newRequest.distance / 1000).toFixed(1)} km</p>
              </div>
              <div style={{textAlign: 'right'}}>
                <span className="new-request-stats-label">Est. Earning</span>
                <p className="new-request-stats-val" style={{color: '#10B981', margin: '4px 0 0 0'}}>₹{newRequest.fee}</p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '12px'}}>
              <button className="new-request-decline-btn" onClick={handleDeclineRequest}>Decline</button>
              <button className="new-request-accept-btn" onClick={handleAcceptRequest}>Accept</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {showNavModal && navOrder && (
        <div className="nav-modal-overlay fade-in">
          <div className="nav-modal-content scale-in">
            <button className="modal-close" onClick={() => { setShowNavModal(false); setNavOrder(null); }}>
              <X size={24} color="#333" />
            </button>
            
            <div className="nav-modal-header">
              <h2>Navigate to {navOrder.status === 'On The Way' ? 'Customer' : 'Restaurant'}</h2>
              <p>{navOrder.status === 'On The Way' ? navOrder.delivery : navOrder.pickup}</p>
            </div>

            <div className="nav-map-container">
              {currentLocation ? (() => {
                const isDelivery = navOrder.status === 'On The Way';
                const destLat = parseFloat(isDelivery ? (navOrder.delivery_lat || navOrder.customer_lat) : navOrder.restaurant_lat) || (isDelivery ? 21.14 : 21.1458);
                const destLon = parseFloat(isDelivery ? (navOrder.delivery_lon || navOrder.customer_lon) : navOrder.restaurant_lon) || (isDelivery ? 79.08 : 79.0882);
                
                const bounds = osrmRoute && osrmRoute.length > 0 
                  ? osrmRoute 
                  : [
                      [currentLocation.lat, currentLocation.lon],
                      [destLat, destLon]
                    ];

                return (
                  <div style={{width: '100%', height: '100%', position: 'relative'}}>
                    {/* Swiggy Style Info Panel */}
                    {routeInfo && (
                      <div className="osrm-info-panel scale-in">
                        <div className="osrm-info-item">
                          <span className="osrm-info-label">ETA</span>
                          <span className="osrm-info-value">{Math.round(routeInfo.duration / 60)} min</span>
                        </div>
                        <div className="osrm-info-divider"></div>
                        <div className="osrm-info-item">
                          <span className="osrm-info-label">Distance</span>
                          <span className="osrm-info-value">{(routeInfo.distance / 1000).toFixed(1)} km</span>
                        </div>
                      </div>
                    )}
                    
                    <MapContainer center={[currentLocation.lat, currentLocation.lon]} zoom={15} className="nav-leaflet-map" zoomControl={false}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      
                      {/* Driver Marker with animation */}
                      <Marker position={[currentLocation.lat, currentLocation.lon]} icon={driverIcon}>
                        <Popup>You are here</Popup>
                      </Marker>

                      {/* Destination Marker */}
                      <Marker position={[destLat, destLon]} icon={isDelivery ? customerIcon : restaurantIcon}>
                        <Popup>{isDelivery ? navOrder.customer : navOrder.restaurant}</Popup>
                      </Marker>

                      {/* OSRM Route Polyline */}
                      {osrmRoute && (
                        <>
                          <Polyline positions={osrmRoute} color="#1E293B" weight={6} opacity={0.3} lineJoin="round" lineCap="round" />
                          <Polyline positions={osrmRoute} color={isDelivery ? "#10B981" : "#F59E0B"} weight={4} opacity={1} lineJoin="round" lineCap="round" />
                        </>
                      )}

                      <MapBoundsUpdater bounds={bounds} />
                    </MapContainer>
                  </div>
                );
              })() : (
                <div className="nav-map-loading">Waiting for GPS signal...</div>
              )}
            </div>

            <div className="nav-modal-footer">
              <button 
                className="btn-outline"
                onClick={() => simulateJourney(navOrder)}
                disabled={simulatingOrder === navOrder.id}
                style={{ flex: 1 }}
              >
                {simulatingOrder === navOrder.id ? 'Simulating...' : 'Simulate GPS'}
              </button>

              {navOrder.status === 'On The Way' ? (
                <button 
                  className="deliver-otp-btn"
                  onClick={() => { setShowNavModal(false); openOtpModal(navOrder.id, 'delivery'); }}
                  style={{ flex: 1 }}
                >
                  Deliver (OTP)
                </button>
              ) : (
                <button 
                  className="deliver-otp-btn"
                  style={{ flex: 1 }}
                  onClick={() => { setShowNavModal(false); openOtpModal(navOrder.id, 'pickup'); }}
                >
                  Pickup (OTP)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
