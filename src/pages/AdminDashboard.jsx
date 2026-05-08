import { useEffect, useState } from 'react';
import { 
  BarChart3, Users, Store, IndianRupee, ShoppingBag, 
  TrendingUp, Clock, CheckCircle, Package
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../api';
import { OrderStatusBadge, LoadingSpinner } from '../components';
import './Dashboard.css';

const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!stats) return <div className="container mt-4">Failed to load stats.</div>;

  const pieData = stats.ordersByStatus.map(s => ({
    name: s.status,
    value: s.count
  }));

  return (
    <div className="dashboard-page container">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Overview of your platform's performance</p>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-primary-light">
            <IndianRupee size={24} className="text-primary" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Revenue</p>
            <h3 className="stat-value">₹{stats.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green-light">
            <ShoppingBag size={24} className="text-green" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Orders</p>
            <h3 className="stat-value">{stats.totalOrders}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-light">
            <Store size={24} className="text-blue" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Restaurants</p>
            <h3 className="stat-value">{stats.totalRestaurants}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-purple-light">
            <Users size={24} className="text-purple" />
          </div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <h3 className="stat-value">{stats.totalUsers}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          {/* Revenue Chart */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Revenue (Last 7 Days)</h3>
              <TrendingUp size={20} className="text-muted" />
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { weekday: 'short' })} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#FF5722" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <Package size={20} className="text-muted" />
            </div>
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id.slice(0, 8)}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.restaurant_name}</td>
                      <td>₹{order.total_amount}</td>
                      <td><OrderStatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar">
          {/* Active Status */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Current Activity</h3>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon bg-yellow-light"><Clock size={20} className="text-yellow" /></div>
                <div className="activity-info">
                  <h4>{stats.pendingOrders}</h4>
                  <p>Pending / Active Orders</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon bg-green-light"><CheckCircle size={20} className="text-green" /></div>
                <div className="activity-info">
                  <h4>{stats.todayOrders}</h4>
                  <p>Orders Today</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon bg-blue-light"><Users size={20} className="text-blue" /></div>
                <div className="activity-info">
                  <h4>{stats.activeDrivers}</h4>
                  <p>Active Delivery Partners</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Distribution */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Orders by Status</h3>
              <BarChart3 size={20} className="text-muted" />
            </div>
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="legend-label">{entry.name}</span>
                    <span className="legend-value">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
