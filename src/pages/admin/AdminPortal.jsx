import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import {
  LayoutDashboard, ShoppingBag, Truck, Store, Users,
  IndianRupee, BarChart3, Tag, Menu, X, Home, LogOut
} from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminOrders from './AdminOrders';
import AdminDrivers from './AdminDrivers';
import AdminRestaurants from './AdminRestaurants';
import AdminCustomers from './AdminCustomers';
import AdminFinance from './AdminFinance';
import AdminAnalytics from './AdminAnalytics';
import AdminPromos from './AdminPromos';
import './AdminPortal.css';

const NAV_ITEMS = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'drivers', label: 'Delivery Partners', icon: Truck },
  { key: 'restaurants', label: 'Restaurants', icon: Store },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'finance', label: 'Finance', icon: IndianRupee },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'promos', label: 'Promo Codes', icon: Tag },
];

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview onNavigate={setActiveTab} />;
      case 'orders': return <AdminOrders />;
      case 'drivers': return <AdminDrivers />;
      case 'restaurants': return <AdminRestaurants />;
      case 'customers': return <AdminCustomers />;
      case 'finance': return <AdminFinance />;
      case 'analytics': return <AdminAnalytics />;
      case 'promos': return <AdminPromos />;
      default: return <AdminOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="admin-portal">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="admin-modal-overlay" onClick={() => setSidebarOpen(false)} style={{ zIndex: 150 }} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <h3>🛡️ Admin Panel</h3>
          <p>QuickBite Operations</p>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={() => navigate('/home')}>
            <Home />
            <span>Back to Home</span>
          </button>
          <button className="admin-nav-item logout-btn" onClick={handleLogout}>
            <LogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="admin-content">
        {renderContent()}
      </main>

      {/* Mobile toggle */}
      <button className="admin-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </div>
  );
}
