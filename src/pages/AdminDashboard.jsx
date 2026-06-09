import { useEffect, useState } from 'react';
import { 
  BarChart3, Users, Store, IndianRupee, ShoppingBag, 
  TrendingUp, Clock, CheckCircle, Package, Receipt, CreditCard, X
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
  const [financeOverview, setFinanceOverview] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Payout Modal State
  const [payoutModal, setPayoutModal] = useState({ isOpen: false, entity: null });
  const [transactionRef, setTransactionRef] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, financeRes, settlementsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/finance/overview'),
        api.get('/admin/finance/settlements')
      ]);
      setStats(statsRes.data);
      setFinanceOverview(financeRes.data);
      setSettlementHistory(settlementsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (e) => {
    e.preventDefault();
    if (!transactionRef.trim()) return alert('Transaction Reference is required');
    
    setPayoutLoading(true);
    try {
      const payload = {
        entity_type: payoutModal.entity.role === 'driver' ? 'driver' : 'restaurant',
        entity_id: payoutModal.entity.id,
        amount: payoutModal.entity.pending_balance,
        transaction_ref: transactionRef
      };
      await api.post('/admin/finance/settlements', payload);
      
      // Refresh data
      await fetchData();
      setPayoutModal({ isOpen: false, entity: null });
      setTransactionRef('');
    } catch (err) {
      console.error(err);
      alert('Failed to process payout');
    } finally {
      setPayoutLoading(false);
    }
  };

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

      <div className="admin-tabs" style={{display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
        <button 
          className={`btn-outline ${activeTab === 'overview' ? 'active' : ''}`} 
          style={activeTab === 'overview' ? {backgroundColor: 'var(--primary)', color: 'white'} : {}}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} style={{marginRight: '8px'}} /> Overview
        </button>
        <button 
          className={`btn-outline ${activeTab === 'settlements' ? 'active' : ''}`}
          style={activeTab === 'settlements' ? {backgroundColor: 'var(--primary)', color: 'white'} : {}}
          onClick={() => setActiveTab('settlements')}
        >
          <Receipt size={18} style={{marginRight: '8px'}} /> Settlements
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
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
        </>
      )}

      {activeTab === 'settlements' && financeOverview && (
        <div className="settlements-view animate-fade-in">
          
          <div className="dashboard-layout">
            <div className="dashboard-main">
              {/* Pending Payouts - Restaurants */}
              <div className="dashboard-card mb-4">
                <div className="card-header">
                  <h3>Pending Restaurant Payouts</h3>
                  <Store size={20} className="text-muted" />
                </div>
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Restaurant</th>
                        <th>Orders</th>
                        <th>Total Earnings</th>
                        <th>Pending Balance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeOverview.restaurantPayouts.filter(r => r.pending_balance > 0).map(rest => (
                        <tr key={rest.id}>
                          <td><strong>{rest.name}</strong></td>
                          <td>{rest.orders}</td>
                          <td>₹{parseFloat(rest.total_earnings).toLocaleString()}</td>
                          <td className="text-orange"><strong>₹{parseFloat(rest.pending_balance).toLocaleString()}</strong></td>
                          <td>
                            <button 
                              className="btn-primary" 
                              style={{padding: '6px 12px', fontSize: '0.85rem'}}
                              onClick={() => setPayoutModal({ isOpen: true, entity: { ...rest, role: 'restaurant' } })}
                            >
                              Settle
                            </button>
                          </td>
                        </tr>
                      ))}
                      {financeOverview.restaurantPayouts.filter(r => r.pending_balance > 0).length === 0 && (
                        <tr><td colSpan="5" className="text-center text-muted py-4">No pending payouts</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Payouts - Drivers */}
              <div className="dashboard-card mb-4">
                <div className="card-header">
                  <h3>Pending Driver Payouts</h3>
                  <Package size={20} className="text-muted" />
                </div>
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Driver</th>
                        <th>Deliveries</th>
                        <th>Earnings</th>
                        <th>COD Collected</th>
                        <th>Pending Balance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeOverview.driverPayouts.filter(d => d.pending_balance > 0).map(driver => (
                        <tr key={driver.id}>
                          <td><strong>{driver.name}</strong></td>
                          <td>{driver.deliveries}</td>
                          <td>₹{parseFloat(driver.total_earnings).toLocaleString()}</td>
                          <td className="text-red">₹{parseFloat(driver.cash_in_hand).toLocaleString()}</td>
                          <td className="text-orange"><strong>₹{parseFloat(driver.pending_balance).toLocaleString()}</strong></td>
                          <td>
                            <button 
                              className="btn-primary" 
                              style={{padding: '6px 12px', fontSize: '0.85rem'}}
                              onClick={() => setPayoutModal({ isOpen: true, entity: { ...driver, role: 'driver' } })}
                            >
                              Settle
                            </button>
                          </td>
                        </tr>
                      ))}
                      {financeOverview.driverPayouts.filter(d => d.pending_balance > 0).length === 0 && (
                        <tr><td colSpan="6" className="text-center text-muted py-4">No pending payouts</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="dashboard-sidebar">
              {/* Settlement History */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Settlement History</h3>
                  <CheckCircle size={20} className="text-green" />
                </div>
                <div className="activity-list" style={{maxHeight: '600px', overflowY: 'auto'}}>
                  {settlementHistory.map(settlement => (
                    <div className="activity-item" key={settlement.id}>
                      <div className={`activity-icon ${settlement.entity_type === 'restaurant' ? 'bg-blue-light' : 'bg-purple-light'}`}>
                        {settlement.entity_type === 'restaurant' ? <Store size={16} className="text-blue" /> : <Package size={16} className="text-purple" />}
                      </div>
                      <div className="activity-info" style={{flex: 1}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <h4>{settlement.entity_name}</h4>
                          <strong className="text-green">₹{parseFloat(settlement.amount).toLocaleString()}</strong>
                        </div>
                        <p style={{fontSize: '0.8rem', marginTop: '4px'}}>
                          <span style={{textTransform: 'capitalize'}}>{settlement.entity_type}</span> • Ref: {settlement.transaction_ref}
                        </p>
                        <p style={{fontSize: '0.75rem', color: '#999', marginTop: '2px'}}>
                          {new Date(settlement.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {settlementHistory.length === 0 && (
                    <p className="text-muted text-center py-4">No settlements found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {payoutModal.isOpen && (
        <div className="modal-overlay fade-in" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="modal-content scale-in" style={{backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, fontSize: '1.25rem'}}>Process Payout</h2>
              <button onClick={() => setPayoutModal({ isOpen: false, entity: null })} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20} /></button>
            </div>
            
            <div style={{marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px'}}>
              <p style={{margin: '0 0 8px 0', color: '#64748b', fontSize: '0.9rem'}}>Recipient</p>
              <h3 style={{margin: '0 0 12px 0'}}>{payoutModal.entity.name} <span style={{fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal', textTransform: 'capitalize'}}>({payoutModal.entity.role})</span></h3>
              
              <p style={{margin: '0 0 8px 0', color: '#64748b', fontSize: '0.9rem'}}>Amount to Settle</p>
              <h2 style={{margin: 0, color: 'var(--primary)', fontSize: '2rem'}}>₹{parseFloat(payoutModal.entity.pending_balance).toLocaleString()}</h2>
            </div>

            <form onSubmit={handleProcessPayout}>
              <div className="form-group" style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>Transaction Reference (UTR / UPI ID) *</label>
                <input 
                  type="text" 
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UTR123456789"
                  required
                  style={{width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem'}}
                />
                <p style={{margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b'}}>Please perform the bank transfer first, then enter the reference number here to record it.</p>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center'}}
                disabled={payoutLoading}
              >
                {payoutLoading ? 'Processing...' : <><CreditCard size={18} style={{marginRight: '8px'}} /> Record Payout</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
