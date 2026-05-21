import { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, CreditCard, Wallet, Banknote, RefreshCw, ArrowDownCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import api from '../../api';
import { LoadingSpinner } from '../../components';

const METHOD_COLORS = { card: '#3B82F6', upi: '#8B5CF6', cod: '#F59E0B', wallet: '#10B981' };
const METHOD_ICONS = { card: '💳', upi: '📱', cod: '💵', wallet: '👛' };

export default function AdminFinance() {
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txFilter, setTxFilter] = useState({ method: '', status: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ovRes, txRes] = await Promise.all([
        api.get('/admin/finance/overview'),
        api.get('/admin/finance/transactions')
      ]);
      setOverview(ovRes.data);
      setTransactions(txRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTransactions = async () => {
    try {
      const params = {};
      if (txFilter.method) params.method = txFilter.method;
      if (txFilter.status) params.status = txFilter.status;
      const { data } = await api.get('/admin/finance/transactions', { params });
      setTransactions(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (!loading) fetchTransactions(); }, [txFilter]);

  if (loading) return <LoadingSpinner />;
  if (!overview) return <div>Failed to load finance data.</div>;

  const pieData = overview.paymentMethods?.map(m => ({
    name: m.method?.toUpperCase(),
    value: m.total,
    count: m.count
  })) || [];

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Finance & Payments</h1>
        <p>Revenue overview, payment tracking, and payout management</p>
      </div>

      {/* KPI Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-green-light"><IndianRupee size={22} className="text-green" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Revenue</p>
            <h3 className="value">₹{overview.totalRevenue?.toLocaleString()}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-primary-light"><TrendingUp size={22} className="text-primary" /></div>
          <div className="admin-stat-info">
            <p className="label">This Month</p>
            <h3 className="value">₹{overview.monthRevenue?.toLocaleString()}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-blue-light"><CreditCard size={22} className="text-blue" /></div>
          <div className="admin-stat-info">
            <p className="label">Today's Revenue</p>
            <h3 className="value">₹{overview.todayRevenue?.toLocaleString()}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <ArrowDownCircle size={22} style={{ color: 'var(--status-cancelled)' }} />
          </div>
          <div className="admin-stat-info">
            <p className="label">Total Refunds</p>
            <h3 className="value" style={{ color: 'var(--status-cancelled)' }}>₹{overview.totalRefunds?.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-grid-3">
        <div>
          {/* Revenue Trend */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Revenue Trend (30 Days)</h3>
            </div>
            <div className="admin-card-body">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={overview.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="date" tickFormatter={v => new Date(v).getDate()} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => [`₹${v}`, 'Revenue']} labelFormatter={l => new Date(l).toLocaleDateString()} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--accent-green)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Restaurant Payouts */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Restaurant Payouts</h3>
            </div>
            <div className="admin-card-body no-pad">
              <table className="admin-table">
                <thead>
                  <tr><th>Restaurant</th><th>Orders</th><th>Payout</th></tr>
                </thead>
                <tbody>
                  {overview.restaurantPayouts?.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.orders}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{r.payout?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Driver Payouts */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Driver Earnings</h3>
            </div>
            <div className="admin-card-body no-pad">
              <table className="admin-table">
                <thead>
                  <tr><th>Driver</th><th>Deliveries</th><th>Earnings</th></tr>
                </thead>
                <tbody>
                  {overview.driverPayouts?.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td>{d.deliveries}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{d.earnings?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          {/* Payment Method Breakdown */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Payment Methods</h3>
            </div>
            <div className="admin-card-body">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={METHOD_COLORS[entry.name?.toLowerCase()] || '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {pieData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}>
                    <span style={{ marginRight: 10, fontSize: '1.125rem' }}>{METHOD_ICONS[entry.name?.toLowerCase()] || '💳'}</span>
                    <span style={{ flex: 1 }}>{entry.name}</span>
                    <span style={{ fontWeight: 600, marginRight: 8 }}>₹{entry.value?.toLocaleString()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({entry.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Fee Revenue */}
          <div className="admin-card">
            <div className="admin-card-header"><h3>Delivery Fee Revenue</h3></div>
            <div className="admin-card-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
                ₹{overview.totalDeliveryFees?.toLocaleString()}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total delivery fees collected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Transaction History</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="filter-select" value={txFilter.method} onChange={e => setTxFilter(p => ({ ...p, method: e.target.value }))}>
              <option value="">All Methods</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="cod">COD</option>
              <option value="wallet">Wallet</option>
            </select>
            <select className="filter-select" value={txFilter.status} onChange={e => setTxFilter(p => ({ ...p, status: e.target.value }))}>
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Restaurant</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{tx.transaction_id?.slice(0, 16)}</td>
                    <td style={{ fontSize: '0.813rem' }}>{tx.customer_name}</td>
                    <td style={{ fontSize: '0.813rem' }}>{tx.restaurant_name}</td>
                    <td>
                      <span className="badge" style={{ background: `${METHOD_COLORS[tx.method]}15`, color: METHOD_COLORS[tx.method], textTransform: 'uppercase' }}>
                        {tx.method}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{tx.amount}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                        background: tx.status === 'completed' ? 'rgba(16,185,129,0.1)' : tx.status === 'refunded' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: tx.status === 'completed' ? 'var(--accent-green)' : tx.status === 'refunded' ? 'var(--status-cancelled)' : 'var(--status-pending)'
                      }}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
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
