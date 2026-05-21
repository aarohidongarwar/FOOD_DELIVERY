import { useEffect, useState } from 'react';
import { TrendingUp, Clock, XCircle, ShoppingBag, Award } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../../api';
import { LoadingSpinner } from '../../components';

const STATUS_COLORS = {
  pending: '#F59E0B', confirmed: '#3B82F6', preparing: '#8B5CF6',
  out_for_delivery: '#F97316', delivered: '#10B981', cancelled: '#EF4444'
};

export default function AdminAnalytics() {
  const [revenueData, setRevenueData] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    fetchAll();
  }, [period]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [revRes, ordRes, itemRes] = await Promise.all([
        api.get('/admin/analytics/revenue', { params: { period } }),
        api.get('/admin/analytics/orders'),
        api.get('/admin/analytics/top-items')
      ]);
      setRevenueData(revRes.data);
      setOrderData(ordRes.data);
      setTopItems(itemRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <LoadingSpinner />;

  const cancellationData = orderData?.cancellationTrend?.map(d => ({
    ...d,
    rate: d.total > 0 ? Math.round((d.cancelled / d.total) * 100) : 0
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Analytics & Reports</h1>
        <p>Deep insights into your platform's performance</p>
      </div>

      {/* Summary Cards */}
      <div className="admin-stats-grid" style={{ marginBottom: 28 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-green-light"><TrendingUp size={22} className="text-green" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Revenue (Period)</p>
            <h3 className="value">₹{revenueData.reduce((s, d) => s + (d.revenue || 0), 0).toLocaleString()}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-blue-light"><ShoppingBag size={22} className="text-blue" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Orders (Period)</p>
            <h3 className="value">{revenueData.reduce((s, d) => s + (d.orders || 0), 0)}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-purple-light"><Clock size={22} className="text-purple" /></div>
          <div className="admin-stat-info">
            <p className="label">Avg Orders / Day</p>
            <h3 className="value">{orderData?.avgOrdersPerDay || 0}</h3>
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Revenue Trend</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                className={`btn-action ${period === p ? 'primary' : 'neutral'}`}
                onClick={() => setPeriod(p)}
                style={{ textTransform: 'capitalize' }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card-body">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} tickFormatter={v => {
                if (period === 'daily') return new Date(v).getDate();
                if (period === 'weekly') return `W${v.split('-')[1]}`;
                return v;
              }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Peak Hours */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Peak Ordering Hours</h3>
            <Clock size={18} color="var(--text-muted)" />
          </div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orderData?.peakHours || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="hour" tickFormatter={h => `${h}h`} tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={h => `${h}:00 - ${parseInt(h)+1}:00`} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(orderData?.peakHours || []).map((entry, i) => (
                    <Cell key={i} fill={entry.count > 5 ? 'var(--primary)' : 'var(--border)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Order Status Distribution</h3>
          </div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={orderData?.statusDist || []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={4} dataKey="count"
                  nameKey="status"
                >
                  {(orderData?.statusDist || []).map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              {(orderData?.statusDist || []).map(entry => (
                <div key={entry.status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[entry.status] }} />
                  <span style={{ textTransform: 'capitalize' }}>{entry.status.replace(/_/g, ' ')}</span>
                  <span style={{ fontWeight: 700 }}>({entry.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Cancellation Rate Trend */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Cancellation Rate (%)</h3>
            <XCircle size={18} color="var(--status-cancelled)" />
          </div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={cancellationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="date" tickFormatter={v => new Date(v).getDate()} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} formatter={v => [`${v}%`, 'Cancellation Rate']} />
                <Line type="monotone" dataKey="rate" stroke="var(--status-cancelled)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Top Selling Items</h3>
            <Award size={18} color="var(--status-pending)" />
          </div>
          <div className="admin-card-body no-pad">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Restaurant</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{
                        width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                        background: i < 3 ? 'var(--primary-bg)' : 'var(--bg)',
                        color: i < 3 ? 'var(--primary)' : 'var(--text-muted)'
                      }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.restaurant_name}</td>
                    <td style={{ fontWeight: 600 }}>{item.total_qty}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{item.total_revenue?.toLocaleString()}</td>
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
