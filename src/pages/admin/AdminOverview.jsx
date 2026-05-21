import { useEffect, useState } from 'react';
import {
  IndianRupee, ShoppingBag, Store, Users, TrendingUp, Clock,
  CheckCircle, Truck, XCircle, BarChart3, Package
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import api from '../../api';
import { OrderStatusBadge, LoadingSpinner } from '../../components';

const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];

export default function AdminOverview({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/stats');
        setStats(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) return <div>Failed to load dashboard stats.</div>;

  const pieData = stats.ordersByStatus?.map(s => ({ name: s.status, value: s.count })) || [];

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" onClick={() => onNavigate('finance')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon bg-primary-light">
            <IndianRupee size={22} className="text-primary" />
          </div>
          <div className="admin-stat-info">
            <p className="label">Total Revenue</p>
            <h3 className="value">₹{stats.totalRevenue.toLocaleString()}</h3>
            <span className="trend up">Today: ₹{stats.todayRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => onNavigate('orders')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon bg-green-light">
            <ShoppingBag size={22} className="text-green" />
          </div>
          <div className="admin-stat-info">
            <p className="label">Total Orders</p>
            <h3 className="value">{stats.totalOrders}</h3>
            <span className="trend up">Today: {stats.todayOrders}</span>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => onNavigate('customers')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon bg-blue-light">
            <Users size={22} className="text-blue" />
          </div>
          <div className="admin-stat-info">
            <p className="label">Customers</p>
            <h3 className="value">{stats.totalUsers}</h3>
            <span className="trend up">Avg Order: ₹{stats.avgOrderValue}</span>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => onNavigate('restaurants')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon bg-purple-light">
            <Store size={22} className="text-purple" />
          </div>
          <div className="admin-stat-info">
            <p className="label">Restaurants</p>
            <h3 className="value">{stats.totalRestaurants}</h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-yellow-light">
            <Clock size={22} className="text-yellow" />
          </div>
          <div className="admin-stat-info">
            <p className="label">Active Orders</p>
            <h3 className="value">{stats.pendingOrders}</h3>
            <span className="trend down">Cancelled: {stats.cancelledToday}</span>
          </div>
        </div>

        <div className="admin-stat-card" onClick={() => onNavigate('drivers')} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <Truck size={22} className="text-green" />
          </div>
          <div className="admin-stat-info">
            <p className="label">Delivery Partners</p>
            <h3 className="value">{stats.activeDrivers} / {stats.totalDrivers}</h3>
            <span className="trend up">Online</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="admin-grid-3">
        <div>
          {/* Revenue Chart */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Revenue (Last 7 Days)</h3>
              <TrendingUp size={18} color="var(--text-muted)" />
            </div>
            <div className="admin-card-body">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={stats.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="date" tickFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={v => [`₹${v}`, 'Revenue']} labelFormatter={l => new Date(l).toLocaleDateString()} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Restaurants */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Top Restaurants</h3>
              <Store size={18} color="var(--text-muted)" />
            </div>
            <div className="admin-card-body no-pad">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Restaurant</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topRestaurants?.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <div className="entity-row">
                          <div className="entity-avatar" style={{ background: COLORS[i % COLORS.length] }}>
                            {r.name[0]}
                          </div>
                          <div className="entity-details">
                            <div className="name">{r.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{r.order_count}</td>
                      <td>₹{r.total_revenue?.toLocaleString()}</td>
                      <td><span className="star-rating">⭐ {r.rating}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          {/* Order Status Pie */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Orders by Status</h3>
              <BarChart3 size={18} color="var(--text-muted)" />
            </div>
            <div className="admin-card-body">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {pieData.map((entry, i) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', fontSize: '0.813rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], marginRight: 10 }} />
                    <span style={{ flex: 1, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{entry.name}</span>
                    <span style={{ fontWeight: 600 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Peak Hours */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Peak Ordering Hours</h3>
              <Clock size={18} color="var(--text-muted)" />
            </div>
            <div className="admin-card-body">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={h => `${h}:00 - ${h+1}:00`} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Recent Orders</h3>
          <button className="btn-action primary" onClick={() => onNavigate('orders')}>View All →</button>
        </div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                {stats.recentOrders?.slice(0, 10).map(order => (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.813rem' }}>#{order.id.slice(0, 8)}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.restaurant_name}</td>
                    <td style={{ fontWeight: 600 }}>₹{order.total_amount}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
