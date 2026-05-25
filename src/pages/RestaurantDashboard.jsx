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
  Info
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useAuthStore from '../stores/authStore';
import './RestaurantDashboard.css';

const RestaurantDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [orderTab, setOrderTab] = useState('Delivered');
  const [timeFilter, setTimeFilter] = useState('30 days');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Mock data for UI
  const ownerName = user?.name || "Aarohi";
  
  const stats = {
    totalOrders: 8,
    totalRevenue: 1740,
    todaysOrders: 6,
    pendingOrders: 0,
    totalProducts: 8,
    lowStockItems: 2,
    monthlyGrowth: 100
  };

  const products = [
    { id: 1, name: 'Butter Chicken', category: 'Main Course', price: 280, stock: 50, available: true },
    { id: 2, name: 'Dal Makhani', category: 'Main Course', price: 180, stock: 40, available: true },
    { id: 3, name: 'Garlic Naan', category: 'Breads', price: 50, stock: 100, available: true },
    { id: 4, name: 'Paneer Tikka', category: 'Starters', price: 220, stock: 30, available: true },
    { id: 5, name: 'Biryani', category: 'Main Course', price: 320, stock: 3, available: true },
    { id: 6, name: 'Gulab Jamun', category: 'Desserts', price: 80, stock: 0, available: false },
    { id: 7, name: 'Lassi', category: 'Beverages', price: 60, stock: 80, available: true },
    { id: 8, name: 'Chicken Tikka', category: 'Starters', price: 260, stock: 25, available: true },
  ];

  const ordersData = [
    { id: 'Order #4', customer: 'Sita Devi', items: 1, price: 640, status: 'accepted' },
    { id: 'Order #5', customer: 'Mohan Lal', items: 2, price: 460, status: 'accepted' },
    { id: 'Order #3', customer: 'Ravi Kumar', items: 2, price: 840, status: 'preparing' },
    { id: 'Order #1', customer: 'Amit Sharma', address: '12 Residency Road, Bangalore', items: 2, price: 380, time: '07 May, 01:06 pm', status: 'delivered' },
    { id: 'Order #2', customer: 'Priya Menon', address: '45 Koramangala, Bangalore', items: 2, price: 400, time: '07 May, 11:06 am', status: 'delivered' },
    { id: 'Order #6', customer: 'Anjali Singh', address: '89 HSR Layout, Bangalore', items: 2, price: 640, time: '06 May, 04:06 pm', status: 'delivered' },
    { id: 'Order #7', customer: 'Ramesh Gupta', address: '34 Whitefield, Bangalore', items: 2, price: 320, time: '05 May, 04:06 pm', status: 'delivered' },
  ];

  const notificationsData = [
    { id: 1, type: 'order', title: 'New Order Received', desc: 'Order #4 from Sita Devi for ₹640 is waiting for your acceptance', time: '07 May, 04:01 pm', unread: false, iconColor: 'blue' },
    { id: 2, type: 'order', title: 'New Order Received', desc: 'Order #5 from Mohan Lal for ₹460 has been accepted', time: '07 May, 03:51 pm', unread: false, iconColor: 'blue' },
    { id: 3, type: 'alert', title: 'Low Stock Alert', desc: 'Biryani is running low — only 3 units remaining', time: '07 May, 03:06 pm', unread: false, iconColor: 'yellow' },
    { id: 4, type: 'success', title: 'Account Approved', desc: 'Congratulations! Your Spice Garden account has been approved and is now live', time: '05 May, 04:06 pm', unread: false, iconColor: 'green' },
    { id: 5, type: 'info', title: 'Weekly Report Ready', desc: 'Your weekly earnings report for last week is now available in Revenue section', time: '04 May, 04:06 pm', unread: true, iconColor: 'gray' },
  ];

  const analyticsChartData = [
    { name: '05-01', revenue: 0, orders: 0 },
    { name: '05-02', revenue: 0, orders: 0 },
    { name: '05-03', revenue: 0, orders: 0 },
    { name: '05-04', revenue: 0, orders: 0 },
    { name: '05-05', revenue: 320, orders: 1 },
    { name: '05-06', revenue: 640, orders: 1 },
    { name: '05-07', revenue: 780, orders: 6 }
  ];

  const topProducts = [
    { name: 'Garlic Naan', sold: 6, rev: 300, percentage: 100 },
    { name: 'Paneer Tikka', sold: 3, rev: 660, percentage: 50 },
    { name: 'Lassi', sold: 3, rev: 180, percentage: 50 },
    { name: 'Chicken Tikka', sold: 3, rev: 780, percentage: 50 },
    { name: 'Butter Chicken', sold: 2, rev: 560, percentage: 33 },
  ];

  const revenueStats = { gross: 1740, commission: 313.2, net: 1426.8, pending: 1426.8 };
  const settlements = [{ id: '#1', gross: 1740, commission: 313.2, net: 1426.8, status: 'processed', period: '7/4/2026 - 7/5/2026' }];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: IndianRupee },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: 1 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const orderTabsList = ['Pending', 'Accepted', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'red', bg: 'var(--ph-red-bg)' };
    if (stock <= 5) return { label: 'Low Stock', color: 'var(--ph-yellow)', bg: 'var(--ph-yellow-bg)' };
    return { label: 'In Stock', color: 'var(--ph-green)', bg: 'var(--ph-green-bg)' };
  };

  return (
    <div className="partner-hub-layout">
      {/* Sidebar */}
      <aside className="partner-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🏪</div>
          <h2>Partner Hub</h2>
        </div>

        <div className="partner-profile-card">
          <div className="partner-name">Spice Garden</div>
          <div className="partner-status">APPROVED</div>
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
                <h1>Good morning, Rajesh!</h1>
                <p>Here's how Spice Garden is performing today.</p>
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
                <div className="stat-subtext">₹780 today</div>
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
                        <span className="r-order-name">{order.id} - {order.customer}</span>
                        <span className="r-order-meta">{order.items} items • ₹{order.price}</span>
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
                          <input type="checkbox" checked={product.available} readOnly />
                          <span className="slider round"></span>
                        </label>
                        <span style={{color: product.available ? 'var(--ph-green)' : 'var(--ph-text-muted)'}}>
                          {product.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="p-actions">
                        <button className="p-btn-icon"><Pencil size={14} /></button>
                        <button className="p-btn-icon delete"><Trash2 size={14} /></button>
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
                          <button className="t-edit-btn">
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
              <div className="time-filter-pills">
                {['7 days', '30 days', '90 days'].map(tf => (
                  <button key={tf} className={`tf-btn ${timeFilter === tf ? 'active' : ''}`} onClick={() => setTimeFilter(tf)}>{tf}</button>
                ))}
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
                    <input type="text" defaultValue="Rajesh Kumar" />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input type="text" defaultValue="9876543210" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" defaultValue="rajesh@spicegarden.com" />
                </div>
              </div>

              {/* Business Information */}
              <div className="settings-section">
                <h3>Business Information</h3>
                <div className="s-form-grid">
                  <div className="form-group">
                    <label>Business Name</label>
                    <input type="text" defaultValue="Spice Garden" />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" defaultValue="Indian Cuisine" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Full Address</label>
                  <input type="text" defaultValue="45 MG Road" />
                </div>
                <div className="s-form-grid-3">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" defaultValue="Bangalore" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" defaultValue="Karnataka" />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" defaultValue="560001" />
                  </div>
                </div>
              </div>

              {/* Store Timings & Operations */}
              <div className="settings-section">
                <h3>Store Timings & Operations</h3>
                <div className="s-form-grid">
                  <div className="form-group">
                    <label>Opening Time</label>
                    <div className="time-input-wrap">
                      <input type="time" defaultValue="09:00" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Closing Time</label>
                    <div className="time-input-wrap">
                      <input type="time" defaultValue="23:00" />
                    </div>
                  </div>
                </div>
                <div className="s-form-grid">
                  <div className="form-group">
                    <label>Delivery Radius (km)</label>
                    <input type="number" defaultValue="5" />
                  </div>
                  <div className="form-group">
                    <label>Prep Time (minutes)</label>
                    <input type="number" defaultValue="30" />
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}


      </main>

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
            
            <form className="modal-form">
              <div className="form-group">
                <label>Name *</label>
                <input type="text" placeholder="Product name" />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input type="text" placeholder="Brief description" />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" defaultValue={0} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input type="text" placeholder="e.g. Main Course" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Product Image</label>
                <input type="file" accept="image/jpeg, image/png" />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Stock Qty</label>
                  <input type="number" defaultValue={50} />
                </div>
                <div className="form-group">
                  <label>Low Stock Alert</label>
                  <input type="number" defaultValue={5} />
                </div>
              </div>
              
              <div className="form-toggle">
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="slider round"></span>
                </label>
                <span>Available for sale</span>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsProductModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary">
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
              
              <h4 style={{borderBottom: '1px solid var(--ph-border)', paddingBottom: '8px', marginBottom: '16px'}}>Order Items ({selectedOrder.items})</h4>
              <div style={{marginBottom: '24px'}}>
                {/* Mock items list */}
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem'}}>
                  <span>1x Butter Chicken</span>
                  <span>₹280</span>
                </div>
                {selectedOrder.items > 1 && (
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem'}}>
                    <span>2x Garlic Naan</span>
                    <span>₹100</span>
                  </div>
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
                  <button type="button" className="btn-cancel" onClick={() => setSelectedOrder(null)}>Reject</button>
                  <button type="button" className="btn-primary" style={{backgroundColor: 'var(--ph-green)'}}>Accept Order</button>
                </>
              )}
              {selectedOrder.status === 'accepted' && (
                <button type="button" className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>Mark as Preparing</button>
              )}
              {selectedOrder.status === 'preparing' && (
                <button type="button" className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>Mark as Ready</button>
              )}
              {selectedOrder.status === 'ready' && (
                <button type="button" className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>Mark as Delivered</button>
              )}
              {selectedOrder.status === 'delivered' && (
                <button type="button" className="btn-cancel" style={{width: '100%', justifyContent: 'center'}} onClick={() => setSelectedOrder(null)}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
