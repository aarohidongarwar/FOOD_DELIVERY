import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ClipboardList, 
  BarChart3, 
  IndianRupee, 
  Tag, 
  Bell, 
  Settings, 
  LogOut,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Pencil,
  Trash2,
  ChevronRight,
  Info,
  Star,
  Download,
  Moon
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAuthStore from '../stores/authStore';
import api from '../api';
import './RestaurantDashboard.css';

const RestaurantDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [orderTab, setOrderTab] = useState('Pending');
  const [timeFilter, setTimeFilter] = useState('30 days');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Real Data State
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  
  // New Product Form State
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: 0, category: 'Main Course', stock: 50, available: true });

  // Status mapping: DB values → UI-friendly values
  const dbToUiStatus = (status) => {
    if (status === 'confirmed') return 'accepted';
    if (status === 'out_for_delivery') return 'ready';
    return status;
  };
  
  const uiToDbStatus = (status) => {
    if (status === 'accepted') return 'confirmed';
    if (status === 'ready') return 'out_for_delivery';
    return status;
  };

  // Transform raw order from backend to dashboard-friendly format
  const transformOrder = (order) => ({
    ...order,
    customer: order.customer_name || order.customer || 'Customer',
    price: parseFloat(order.grand_total || order.total_amount || order.price || 0),
    address: order.delivery_address || order.address || 'N/A',
    time: order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Just now',
    status: dbToUiStatus(order.status),
    items: order.items || [],
    itemCount: Array.isArray(order.items) ? order.items.length : (order.items || 0)
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: restData } = await api.get('/restaurants/owner/me');
        setRestaurant(restData);
        
        // Populate settings form
        setSettingsForm({
          owner_name: user?.name || '',
          owner_phone: user?.phone || '',
          owner_email: user?.email || '',
          name: restData?.name || '',
          cuisine_type: restData?.cuisine_type || '',
          address: restData?.address || '',
          delivery_time: restData?.delivery_time || '30-40 min',
          delivery_fee: restData?.delivery_fee || 29,
          min_order: restData?.min_order || 99,
        });

        if (restData) {
          const [menuRes, ordRes] = await Promise.all([
            api.get(`/menu/restaurant/${restData.id}`),
            api.get(`/orders/restaurant/${restData.id}`)
          ]);
          
          // Map menu items: is_available → available, add default stock
          setProducts((menuRes.data || []).map(p => ({
            ...p,
            available: p.is_available === 1 || p.is_available === true,
            stock: p.stock ?? 50
          })));
          
          // Transform orders
          setOrdersData((ordRes.data || []).map(transformOrder));
          
          try {
            const { data: restFull } = await api.get(`/restaurants/${restData.id}`);
            if (restFull.reviews) setReviews(restFull.reviews);
          } catch(e) {}
          
          // Fetch analytics
          try {
            const { data: analyticsData } = await api.get(`/orders/restaurant/${restData.id}/analytics?days=30`);
            setAnalytics(analyticsData);
          } catch(e) { console.warn('Analytics fetch failed', e); }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Refresh analytics when time filter changes
  useEffect(() => {
    if (!restaurant) return;
    const daysMap = { '7 days': 7, '30 days': 30, '90 days': 90 };
    const days = daysMap[timeFilter] || 30;
    api.get(`/orders/restaurant/${restaurant.id}/analytics?days=${days}`)
      .then(({ data }) => setAnalytics(data))
      .catch(e => console.warn('Analytics refresh failed', e));
  }, [timeFilter, restaurant]);

  // Calculated Stats (from analytics or raw data as fallback)
  const totalOrders = analytics?.summary?.totalOrders ?? ordersData.length;
  const totalRevenue = analytics?.summary?.totalRevenue ?? ordersData.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.price || 0), 0);
  const todaysOrders = analytics?.summary?.todaysOrders ?? ordersData.filter(o => new Date(o.created_at || new Date()).toDateString() === new Date().toDateString()).length;
  const todaysRevenue = analytics?.summary?.todaysRevenue ?? 0;
  const pendingOrders = analytics?.summary?.pendingOrders ?? ordersData.filter(o => o.status === 'pending').length;
  
  const stats = {
    totalOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    todaysOrders,
    todaysRevenue: Math.round(todaysRevenue * 100) / 100,
    pendingOrders,
    totalProducts: products.length,
    lowStockItems: products.filter(p => (p.stock || 0) <= 5 && (p.stock || 0) > 0).length,
    monthlyGrowth: 15
  };

  const notificationsData = [
    { id: 1, type: 'order', title: 'Welcome', desc: 'Welcome to your partner hub!', time: 'Just now', unread: true, iconColor: 'green' }
  ];

  const analyticsChartData = analytics?.dailyData?.length > 0 
    ? analytics.dailyData 
    : [
        { name: 'Mon', revenue: totalRevenue * 0.1, orders: 1 },
        { name: 'Tue', revenue: totalRevenue * 0.2, orders: 2 },
        { name: 'Wed', revenue: totalRevenue * 0.3, orders: 3 },
        { name: 'Thu', revenue: totalRevenue * 0.4, orders: 4 },
        { name: 'Fri', revenue: totalRevenue, orders: totalOrders }
      ];

  const topProducts = analytics?.topProducts?.length > 0
    ? analytics.topProducts.map((tp, i, arr) => ({
        name: tp.name,
        sold: tp.sold,
        rev: tp.revenue,
        percentage: arr[0].sold > 0 ? Math.round((tp.sold / arr[0].sold) * 100) : 0
      }))
    : products.slice(0,5).map(p => ({
        name: p.name, sold: 0, rev: p.price * 5, percentage: 50
      }));

  const revenueStats = { 
    gross: Math.round(totalRevenue * 100) / 100, 
    commission: Math.round(totalRevenue * 0.18 * 100) / 100, 
    net: Math.round(totalRevenue * 0.82 * 100) / 100, 
    pending: 0 
  };
  const settlements = [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      const { data } = await api.post('/menu', {
        restaurant_id: restaurant.id,
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        category: newProduct.category,
        image_url: newProduct.image_url || null,
        is_veg: true,
        is_bestseller: false,
        is_available: newProduct.available ? 1 : 0
      });
      setProducts([...products, { ...data, available: data.is_available === 1 || data.is_available === true, stock: 50 }]);
      setIsProductModalOpen(false);
      setNewProduct({ name: '', description: '', price: 0, category: 'Main Course', stock: 50, available: true });
    } catch(err) {
      console.error(err);
      alert('Failed to add product');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const { data } = await api.put(`/menu/${editingProduct.id}`, {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        category: editingProduct.category,
        image_url: editingProduct.image_url,
        is_available: editingProduct.available ? 1 : 0
      });
      setProducts(products.map(p => p.id === data.id ? { ...data, available: data.is_available === 1 || data.is_available === true, stock: p.stock } : p));
      setEditingProduct(null);
    } catch(err) {
      console.error(err);
      alert('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/menu/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
    } catch(err) {
      console.error(err);
      alert('Failed to delete product');
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      const { data } = await api.put(`/menu/${product.id}`, { is_available: product.available ? 0 : 1 });
      setProducts(products.map(p => p.id === product.id ? { ...p, available: !p.available } : p));
    } catch(err) {
      console.error(err);
      alert('Failed to toggle availability');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      // Map the UI status for local state update
      const uiStatus = dbToUiStatus(newStatus === 'accepted' ? 'confirmed' : newStatus === 'ready' ? 'out_for_delivery' : newStatus);
      setOrdersData(ordersData.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch(err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleSaveSettings = async () => {
    if (!restaurant) return;
    setSavingSettings(true);
    try {
      const { data } = await api.put('/restaurants/owner/me', settingsForm);
      setRestaurant(data);
      alert('Settings saved successfully!');
    } catch(err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleRestaurantOpen = async () => {
    if (!restaurant) return;
    try {
      const { data } = await api.put('/restaurants/owner/toggle-status', { is_open: !restaurant.is_open });
      setRestaurant(data);
    } catch(err) {
      console.error(err);
      alert('Failed to toggle status');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const header = "Date,Revenue,Orders\n";
    const rows = analyticsChartData.map(d => `${d.name},${d.revenue},${d.orders}`).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: IndianRupee },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  const orderTabsList = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'red', bg: 'var(--ph-red-bg)' };
    if (stock <= 5) return { label: 'Low Stock', color: 'var(--ph-yellow)', bg: 'var(--ph-yellow-bg)' };
    return { label: 'In Stock', color: 'var(--ph-green)', bg: 'var(--ph-green-bg)' };
  };

  return (
    <div className={`partner-hub-layout ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar */}
      <aside className="partner-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🏪</div>
          <h2>Partner Hub</h2>
        </div>

        <div className="partner-profile-card">
          <div className="partner-name">{restaurant?.name || 'My Restaurant'}</div>
          <div className="partner-status" style={{cursor: 'pointer'}} onClick={handleToggleRestaurantOpen}>
            {restaurant?.is_open ? '🟢 OPEN' : '🔴 CLOSED'}
          </div>
        </div>

        <nav className="partner-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="partner-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view fade-in">
            <header className="view-header">
              <div className="header-titles">
                <h1>Good morning, {user?.name?.split(' ')[0] || 'Partner'}!</h1>
                <p>Here's how {restaurant?.name || 'your restaurant'} is performing today.</p>
              </div>
            </header>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Total Orders</span>
                  <div className="icon-wrapper orange">
                    <ClipboardList size={16} />
                  </div>
                </div>
                <div className="stat-value">{stats.totalOrders}</div>
                <div className="stat-subtext">All time</div>
                <div className="stat-trend positive">
                  <TrendingUp size={14} /> 100% vs last month
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Total Revenue</span>
                  <div className="icon-wrapper green">
                    <IndianRupee size={16} />
                  </div>
                </div>
                <div className="stat-value">₹{stats.totalRevenue}</div>
                <div className="stat-subtext">All time earnings</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Today's Orders</span>
                  <div className="icon-wrapper blue">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="stat-value">{stats.todaysOrders}</div>
                <div className="stat-subtext">₹{stats.todaysRevenue} today</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Pending Orders</span>
                  <div className="icon-wrapper yellow">
                    <AlertTriangle size={16} />
                  </div>
                </div>
                <div className="stat-value">{stats.pendingOrders}</div>
                <div className="stat-subtext">Need attention</div>
              </div>
            </div>

            <div className="dashboard-panels">
              <div className="panel inventory-snapshot">
                <div className="panel-header">
                  <Package size={16} />
                  <h3>Inventory Snapshot</h3>
                </div>
                <div className="snapshot-list">
                  <div className="snapshot-item">
                    <span>Total Products</span>
                    <span className="value">{stats.totalProducts}</span>
                  </div>
                  <div className="snapshot-item">
                    <span>Low Stock Items</span>
                    <span className="value text-red">{stats.lowStockItems}</span>
                  </div>
                  <div className="snapshot-item">
                    <span>Monthly Growth</span>
                    <span className="value text-green">{stats.monthlyGrowth}%</span>
                  </div>
                </div>
              </div>

              <div className="panel recent-orders">
                <div className="panel-header">
                  <ClipboardList size={16} />
                  <h3>Recent Orders</h3>
                </div>
                <div className="recent-orders-list">
                  {ordersData.slice(0, 5).map(order => (
                    <div className="recent-order-item" key={order.id}>
                      <div className="r-order-info">
                        <span className="r-order-name">#{order.id?.substring(0,8)} - {order.customer}</span>
                        <span className="r-order-meta">{order.itemCount} items • ₹{order.price}</span>
                      </div>
                      <div className={`r-order-badge ${order.status}`}>{order.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="products-view fade-in">
            <header className="view-header with-action">
              <div className="header-titles">
                <h1>Products</h1>
                <p>Manage your menu or product catalog</p>
              </div>
              <button className="btn-primary" onClick={() => setIsProductModalOpen(true)}>
                <Plus size={16} /> Add Product
              </button>
            </header>

            <div className="products-grid">
              {products.map(product => (
                <div className="product-card" key={product.id}>
                  <div className="p-card-top">
                    <Package size={32} className="p-icon" />
                  </div>
                  <div className="p-card-content">
                    <div className="p-card-header">
                      <h3>{product.name}</h3>
                      <span className="p-price">₹{product.price}</span>
                    </div>
                    <div className="p-category">{product.category}</div>
                    <div className={`p-stock-badge ${product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : ''}`}>
                      Stock: {product.stock}
                    </div>
                    
                    <div className="p-card-footer">
                      <div className="p-toggle">
                        <label className="toggle-switch-small">
                          <input type="checkbox" checked={product.available} onChange={() => handleToggleAvailability(product)} />
                          <span className="slider round"></span>
                        </label>
                        <span style={{color: product.available ? 'var(--ph-green)' : 'var(--ph-text-muted)'}}>
                          {product.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="p-actions">
                        <button className="p-btn-icon" onClick={() => setEditingProduct({...product})}><Pencil size={14} /></button>
                        <button className="p-btn-icon delete" onClick={() => handleDeleteProduct(product.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-view fade-in">
            <header className="view-header">
              <div className="header-titles">
                <h1>Inventory</h1>
                <p>Track and manage your stock levels</p>
              </div>
            </header>

            <div className="inventory-status-cards">
              <div className="status-card in-stock">
                <div className="s-icon">
                  <Package size={20} />
                </div>
                <div className="s-info">
                  <span className="s-val">6</span>
                  <span className="s-label">In Stock</span>
                </div>
              </div>
              <div className="status-card low-stock">
                <div className="s-icon">
                  <TrendingUp size={20} style={{transform: 'scaleY(-1)'}} />
                </div>
                <div className="s-info">
                  <span className="s-val">1</span>
                  <span className="s-label">Low Stock</span>
                </div>
              </div>
              <div className="status-card out-stock">
                <div className="s-icon">
                  <AlertTriangle size={20} />
                </div>
                <div className="s-info">
                  <span className="s-val">1</span>
                  <span className="s-label">Out of Stock</span>
                </div>
              </div>
            </div>

            {/* Out of Stock Alert Banner */}
            {products.filter(p => p.stock === 0).length > 0 && (
              <div className="inventory-alert-section">
                <div className="i-alert-title out-stock">
                  <AlertTriangle size={16} />
                  <span>Out of Stock</span>
                </div>
                {products.filter(p => p.stock === 0).map(product => (
                  <div className="i-alert-card out-stock" key={product.id}>
                    <div className="i-alert-info">
                      <h4>{product.name}</h4>
                      <p>{product.category} · Alert at 10 units</p>
                    </div>
                    <div className="i-alert-action">
                      <span className="i-alert-val">{product.stock}</span>
                      <button className="btn-outline">
                        <Pencil size={14} /> Update Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Low Stock Alert Banner */}
            {products.filter(p => p.stock > 0 && p.stock <= 5).length > 0 && (
              <div className="inventory-alert-section">
                <div className="i-alert-title low-stock">
                  <TrendingUp size={16} style={{transform: 'scaleY(-1)'}} />
                  <span>Low Stock</span>
                </div>
                {products.filter(p => p.stock > 0 && p.stock <= 5).map(product => (
                  <div className="i-alert-card low-stock" key={product.id}>
                    <div className="i-alert-info">
                      <h4>{product.name}</h4>
                      <p>{product.category} · Alert at 5 units</p>
                    </div>
                    <div className="i-alert-action">
                      <span className="i-alert-val">{product.stock}</span>
                      <button className="btn-outline">
                        <Pencil size={14} /> Update Stock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="inventory-table-container">
              <h3>All Products</h3>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const status = getStockStatus(product.stock);
                    return (
                      <tr key={product.id}>
                        <td className="t-product-name">{product.name}</td>
                        <td className="t-category">{product.category}</td>
                        <td className="t-stock">{product.stock}</td>
                        <td>
                          <span className="t-badge" style={{ color: status.color, backgroundColor: status.bg }}>
                            {status.label}
                          </span>
                        </td>
                        <td>
                          <button className="t-edit-btn" onClick={() => setEditingProduct({...product})}>
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-view fade-in">
            <header className="view-header">
              <div className="header-titles">
                <h1>Orders</h1>
                <p>Manage and track your incoming orders</p>
              </div>
            </header>

            <div className="order-tabs">
              {orderTabsList.map(tab => (
                <button 
                  key={tab} 
                  className={`order-tab-btn ${orderTab === tab ? 'active' : ''}`}
                  onClick={() => setOrderTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="orders-list-full">
              {ordersData.filter(o => o.status === orderTab.toLowerCase()).map(order => (
                <div className="full-order-card" key={order.id}>
                  <div className="full-order-content">
                    <div className="f-o-header">
                      <h3>{order.id}</h3>
                      <span className={`r-order-badge ${order.status}`}>{order.status}</span>
                    </div>
                    <p className="f-o-customer">{order.customer} - {order.address}</p>
                    <p className="f-o-meta">{order.items} items &nbsp;&nbsp; <strong>₹{order.price}</strong> &nbsp;&nbsp; <span style={{color: 'var(--ph-text-muted)'}}>{order.time}</span></p>
                  </div>
                  <button className="f-o-view-btn" onClick={() => setSelectedOrder(order)}>
                    View <ChevronRight size={16} />
                  </button>
                </div>
              ))}
              {ordersData.filter(o => o.status === orderTab.toLowerCase()).length === 0 && (
                <div className="empty-state-simple" style={{height: '200px'}}>
                  <p>No orders in this status.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-view fade-in">
            <header className="view-header with-action">
              <div className="header-titles">
                <h1>Analytics</h1>
                <p>Sales insights and performance trends</p>
              </div>
              <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
                <div className="time-filter-pills">
                  {['7 days', '30 days', '90 days'].map(tf => (
                    <button key={tf} className={`tf-btn ${timeFilter === tf ? 'active' : ''}`} onClick={() => setTimeFilter(tf)}>{tf}</button>
                  ))}
                </div>
                <button className="btn-outline" onClick={handleExportCSV}>
                  <Download size={16} /> Export CSV
                </button>
              </div>
            </header>

            <div className="a-stats-grid">
              <div className="a-stat-card green-bg">
                <span className="a-stat-label">Total Revenue</span>
                <span className="a-stat-value text-green">₹{stats.totalRevenue}</span>
              </div>
              <div className="a-stat-card orange-bg">
                <span className="a-stat-label">Total Orders</span>
                <span className="a-stat-value text-orange">{stats.totalOrders}</span>
              </div>
            </div>

            <div className="a-chart-card">
              <div className="a-chart-header">
                <TrendingUp size={16} />
                <h3>Revenue Over Time</h3>
              </div>
              <div className="a-chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analyticsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={true} tickLine={true} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={true} tickLine={true} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="a-chart-card">
              <div className="a-chart-header">
                <BarChart3 size={16} />
                <h3>Orders Per Day</h3>
              </div>
              <div className="a-chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={true} tickLine={true} tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis axisLine={true} tickLine={true} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="a-chart-card">
              <div className="a-chart-header">
                <h3>Top Selling Products</h3>
              </div>
              <div className="top-products-list">
                {topProducts.map((tp, idx) => (
                  <div className="tp-item" key={idx}>
                    <div className="tp-rank">{idx + 1}</div>
                    <div className="tp-bar-container">
                      <div className="tp-bar-info">
                        <span className="tp-name">{tp.name}</span>
                        <div className="tp-stats">
                          <span className="tp-sold">{tp.sold} sold</span>
                          <span className="tp-rev">₹{tp.rev}</span>
                        </div>
                      </div>
                      <div className="tp-bar-bg">
                        <div className="tp-bar-fill" style={{ width: `${tp.percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="revenue-view fade-in">
            <header className="view-header with-action">
              <div className="header-titles">
                <h1>Revenue</h1>
                <p>Earnings, commissions, and settlement history</p>
              </div>
              <div className="time-filter-pills">
                {['7 days', '30 days', '90 days'].map(tf => (
                  <button key={tf} className={`tf-btn ${timeFilter === tf ? 'active' : ''}`} onClick={() => setTimeFilter(tf)}>{tf}</button>
                ))}
              </div>
            </header>

            <div className="rev-stats-grid">
              <div className="rev-stat-card bg-green-light">
                <span className="rev-s-label">Gross Earnings</span>
                <span className="rev-s-val text-green">₹{revenueStats.gross}</span>
              </div>
              <div className="rev-stat-card bg-red-light">
                <span className="rev-s-label">Platform Commission (18%)</span>
                <span className="rev-s-val text-red">₹{revenueStats.commission}</span>
              </div>
              <div className="rev-stat-card bg-orange-light">
                <span className="rev-s-label">Net Settlement</span>
                <span className="rev-s-val text-orange">₹{revenueStats.net}</span>
              </div>
              <div className="rev-stat-card bg-yellow-light">
                <span className="rev-s-label">Pending Payout</span>
                <span className="rev-s-val text-yellow">₹{revenueStats.pending}</span>
              </div>
            </div>

            <div className="inventory-table-container">
              <div className="a-chart-header" style={{marginBottom: '20px'}}>
                <IndianRupee size={16} />
                <h3>Settlement History</h3>
              </div>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Gross</th>
                    <th>Commission</th>
                    <th>Net</th>
                    <th>Status</th>
                    <th>Period</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map(settlement => (
                    <tr key={settlement.id}>
                      <td className="t-stock">{settlement.id}</td>
                      <td>₹{settlement.gross}</td>
                      <td className="text-red">-₹{settlement.commission}</td>
                      <td className="text-green t-stock">₹{settlement.net}</td>
                      <td><span className="r-order-badge delivered" style={{backgroundColor: '#e0e7ff', color: '#4f46e5'}}>{settlement.status}</span></td>
                      <td style={{color: 'var(--ph-text-muted)'}}>{settlement.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="notifications-view fade-in">
            <header className="view-header with-action">
              <div className="header-titles">
                <h1>Notifications</h1>
                <p>1 unread notification</p>
              </div>
              <button className="btn-outline">
                Mark all read
              </button>
            </header>

            <div className="notif-list">
              {notificationsData.map(notif => (
                <div className={`notif-card ${notif.unread ? 'unread' : ''}`} key={notif.id}>
                  <div className={`notif-icon-box ${notif.iconColor}`}>
                    {notif.type === 'order' && <Package size={16} />}
                    {notif.type === 'alert' && <AlertTriangle size={16} />}
                    {notif.type === 'success' && <CheckCircle2 size={16} />}
                    {notif.type === 'info' && <Info size={16} />}
                  </div>
                  <div className="notif-content">
                    <h4 className="notif-title">{notif.title}</h4>
                    <p className="notif-desc">{notif.desc}</p>
                    <span className="notif-time">{notif.time}</span>
                  </div>
                  {notif.unread && <div className="notif-dot"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="offers-view fade-in">
            <header className="view-header with-action">
              <div className="header-titles">
                <h1>Offers</h1>
                <p>Create and manage discount coupons</p>
              </div>
              <button className="btn-primary" onClick={() => setIsOfferModalOpen(true)}>
                <Plus size={16} /> Create Offer
              </button>
            </header>

            <div className="empty-state-card">
              <div className="empty-icon">
                <Tag size={48} />
              </div>
              <h3>No active offers</h3>
              <p>Create your first offer to attract more customers</p>
              <button className="btn-primary" onClick={() => setIsOfferModalOpen(true)}>
                <Plus size={16} /> Create Offer
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-view fade-in">
            <header className="view-header">
              <div className="header-titles">
                <h1>Customer Reviews</h1>
                <p>Monitor and respond to customer feedback</p>
              </div>
            </header>
            
            <div className="reviews-list">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="review-card" style={{padding: '20px', background: 'var(--ph-bg)', border: '1px solid var(--ph-border)', borderRadius: '12px', marginBottom: '16px'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px'}}>
                      <h4 style={{margin: 0}}>{review.user?.name || 'Customer'}</h4>
                      <div style={{display: 'flex', color: 'var(--ph-orange)'}}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < review.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p style={{margin: 0, color: 'var(--ph-text-muted)'}}>{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state-simple">
                  <Star size={48} style={{color: 'var(--ph-text-muted)', marginBottom: '16px', opacity: 0.5}} />
                  <p>No reviews yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-view fade-in">
            <header className="view-header">
              <div className="header-titles">
                <h1>Settings</h1>
                <p>Manage your business profile and preferences</p>
              </div>
            </header>

            <div className="settings-form-container">
              {/* Personal Information */}
              <div className="settings-section">
                <h3>Personal Information</h3>
                <div className="s-form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={settingsForm.owner_name || ''} onChange={e => setSettingsForm({...settingsForm, owner_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input type="text" value={settingsForm.owner_phone || ''} onChange={e => setSettingsForm({...settingsForm, owner_phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={settingsForm.owner_email || ''} onChange={e => setSettingsForm({...settingsForm, owner_email: e.target.value})} />
                </div>
              </div>

              {/* Business Information */}
              <div className="settings-section">
                <h3>Business Information</h3>
                <div className="s-form-grid">
                  <div className="form-group">
                    <label>Business Name</label>
                    <input type="text" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Category (Cuisine)</label>
                    <input type="text" value={settingsForm.cuisine_type || ''} onChange={e => setSettingsForm({...settingsForm, cuisine_type: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Address</label>
                  <input type="text" value={settingsForm.address || ''} onChange={e => setSettingsForm({...settingsForm, address: e.target.value})} />
                </div>
              </div>

              {/* Store Timings & Operations */}
              <div className="settings-section">
                <h3>Store Timings & Operations</h3>
                <div className="s-form-grid">
                  <div className="form-group">
                    <label>Delivery Time (e.g. 30-40 min)</label>
                    <input type="text" value={settingsForm.delivery_time || ''} onChange={e => setSettingsForm({...settingsForm, delivery_time: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Delivery Fee (₹)</label>
                    <input type="number" value={settingsForm.delivery_fee || 0} onChange={e => setSettingsForm({...settingsForm, delivery_fee: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="s-form-grid">
                  <div className="form-group">
                    <label>Min Order Value (₹)</label>
                    <input type="number" value={settingsForm.min_order || 0} onChange={e => setSettingsForm({...settingsForm, min_order: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn-primary" onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}


      </main>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="modal-overlay fade-in">
          <div className="modal-content scale-in">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="close-btn" onClick={() => setEditingProduct(null)}>
                <X size={20} />
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handleEditProduct}>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" placeholder="Product name" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="Brief description" value={editingProduct.description || ''} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input type="text" placeholder="e.g. Main Course" required value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Product Image URL</label>
                <input type="text" placeholder="https://..." value={editingProduct.image_url || ''} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} />
              </div>
              
              <div className="form-toggle">
                <label className="toggle-switch">
                  <input type="checkbox" checked={editingProduct.available} onChange={e => setEditingProduct({...editingProduct, available: e.target.checked})} />
                  <span className="slider round"></span>
                </label>
                <span>Available for sale</span>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isProductModalOpen && (
        <div className="modal-overlay fade-in">
          <div className="modal-content scale-in">
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button className="close-btn" onClick={() => setIsProductModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form className="modal-form" onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" placeholder="Product name" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="Brief description" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input type="text" placeholder="e.g. Main Course" required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Product Image URL</label>
                <input type="text" placeholder="https://..." value={newProduct.image_url || ''} onChange={e => setNewProduct({...newProduct, image_url: e.target.value})} />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Stock Qty</label>
                  <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Low Stock Alert</label>
                  <input type="number" defaultValue={5} />
                </div>
              </div>
              
              <div className="form-toggle">
                <label className="toggle-switch">
                  <input type="checkbox" checked={newProduct.available} onChange={e => setNewProduct({...newProduct, available: e.target.checked})} />
                  <span className="slider round"></span>
                </label>
                <span>Available for sale</span>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {isOfferModalOpen && (
        <div className="modal-overlay fade-in">
          <div className="modal-content scale-in" style={{maxWidth: '400px'}}>
            <div className="modal-header">
              <h2>Create New Offer</h2>
              <button className="close-btn" onClick={() => setIsOfferModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input type="text" placeholder="e.g. Weekend Special" />
              </div>
              
              <div className="form-group">
                <label>Coupon Code *</label>
                <input type="text" placeholder="E.G. SAVE20" style={{textTransform: 'uppercase'}} />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Discount Type</label>
                  <select>
                    <option>Percentage (%)</option>
                    <option>Flat Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value</label>
                  <input type="number" defaultValue={10} />
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Min Order (₹)</label>
                  <input type="number" defaultValue={0} />
                </div>
                <div className="form-group">
                  <label>Max Discount (₹)</label>
                  <input type="number" defaultValue={0} />
                </div>
              </div>
              
              <div className="form-toggle">
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
                <span>Active</span>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsOfferModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary">
                  Create Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay fade-in" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content scale-in" style={{maxWidth: '500px'}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.id}</h2>
              <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body" style={{padding: '24px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                <div>
                  <h4 style={{margin: '0 0 4px 0'}}>{selectedOrder.customer}</h4>
                  <p style={{margin: 0, color: 'var(--ph-text-muted)', fontSize: '0.9rem'}}>{selectedOrder.address || 'Pickup'}</p>
                </div>
                <div style={{textAlign: 'right'}}>
                  <span className={`r-order-badge ${selectedOrder.status}`}>{selectedOrder.status}</span>
                  <p style={{margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--ph-text-muted)'}}>{selectedOrder.time || 'Just now'}</p>
                </div>
              </div>
              
              <h4 style={{borderBottom: '1px solid var(--ph-border)', paddingBottom: '8px', marginBottom: '16px'}}>Order Items ({selectedOrder.items?.length || 0})</h4>
              <div style={{marginBottom: '24px'}}>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem'}}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <p style={{color: 'var(--ph-text-muted)'}}>No items found.</p>
                )}
              </div>
              
              <div style={{borderTop: '1px solid var(--ph-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem'}}>
                <span>Total Amount</span>
                <span style={{color: 'var(--ph-orange)'}}>₹{selectedOrder.price}</span>
              </div>
            </div>
            
            <div className="modal-actions" style={{padding: '0 24px 24px 24px', display: 'flex', gap: '12px'}}>
              {selectedOrder.status === 'pending' && (
                <>
                  <button type="button" className="btn-cancel" onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelled')}>Reject</button>
                  <button type="button" className="btn-primary" style={{backgroundColor: 'var(--ph-green)'}} onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'accepted')}>Accept Order</button>
                </>
              )}
              {selectedOrder.status === 'accepted' && (
                <button type="button" className="btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'preparing')}>Mark as Preparing</button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button type="button" className="btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'ready')}>Mark as Ready</button>
              )}
              {selectedOrder.status === 'ready' && (
                <button type="button" className="btn-primary" style={{width: '100%', justifyContent: 'center'}} onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}>Mark as Delivered</button>
              )}
              {selectedOrder.status === 'delivered' && (
                <button type="button" className="btn-cancel" style={{width: '100%', justifyContent: 'center'}} onClick={() => setSelectedOrder(null)}>Close</button>
              )}
              <button type="button" className="btn-outline" onClick={handlePrintReceipt}>Print Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
