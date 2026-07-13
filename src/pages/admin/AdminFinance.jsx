import { useEffect, useState } from 'react';
import {
  IndianRupee, TrendingUp, CreditCard, ArrowDownCircle, X, CheckCircle2,
  Store, Truck, BarChart3, ArrowRight, Info, Wallet, Banknote, PiggyBank,
  ArrowUpRight, ArrowDownRight, Clock, Receipt
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../api';
import { LoadingSpinner } from '../../components';

const PIE_COLORS = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6'];

export default function AdminFinance() {
  const [overview, setOverview] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('overview');

  // Payout Modal State
  const [payoutModal, setPayoutModal] = useState({ isOpen: false, entity: null });
  const [transactionRef, setTransactionRef] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ovRes, setRes] = await Promise.all([
        api.get('/admin/finance/overview'),
        api.get('/admin/finance/settlements')
      ]);
      setOverview(ovRes.data);
      setSettlementHistory(setRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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

  const handleApproveDeposit = async (id) => {
    if(!window.confirm("Approve this deposit? The driver's debt will be cleared.")) return;
    try {
      await api.post(`/admin/finance/settlements/approve/${id}`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to approve deposit');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!overview) return <div>Failed to load finance data.</div>;

  const pendingDeposits = settlementHistory.filter(s => s.status === 'pending');
  const completedSettlements = settlementHistory.filter(s => s.status === 'completed');
  const restaurantSettlements = completedSettlements.filter(s => s.entity_type === 'restaurant');
  const driverSettlements = completedSettlements.filter(s => s.entity_type === 'driver');

  // Calculated values
  const totalPendingRestaurant = overview.restaurantPayouts?.reduce((sum, r) => sum + Math.max(0, r.pending_balance), 0) || 0;
  const driversOwingPlatform = overview.driverPayouts?.filter(d => d.pending_balance < 0).reduce((sum, d) => sum + Math.abs(d.pending_balance), 0) || 0;
  const platformOwingDrivers = overview.driverPayouts?.filter(d => d.pending_balance > 0).reduce((sum, d) => sum + d.pending_balance, 0) || 0;

  // Pie data for overview
  const pieData = [
    { name: 'Platform Commission', value: overview.totalCommission || 0 },
    { name: 'Restaurant Earnings', value: overview.totalRestaurantEarnings || 0 },
    { name: 'Delivery Partner Fees', value: overview.totalDeliveryFees || 0 },
  ].filter(d => d.value > 0);

  const SUB_TABS = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'restaurants', label: 'Restaurant Settlements', icon: Store },
    { key: 'drivers', label: 'Driver Settlements', icon: Truck },
  ];

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Finance & Settlements</h1>
        <p>Track revenue, commissions, and manage payouts clearly.</p>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="finance-sub-tabs">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            className={`finance-sub-tab ${activeSubTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab.key)}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
      {activeSubTab === 'overview' && (
        <div className="finance-tab-content animate-fade-in">
          {/* KPI Cards */}
          <div className="admin-stats-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-green-light"><IndianRupee size={22} className="text-green" /></div>
              <div className="admin-stat-info">
                <p className="label">Total Revenue</p>
                <h3 className="value">₹{overview.totalRevenue?.toLocaleString()}</h3>
                <span className="trend up">{overview.deliveredOrders} orders delivered</span>
              </div>
            </div>
            <div className="admin-stat-card" style={{borderLeft: '3px solid #F97316'}}>
              <div className="admin-stat-icon" style={{background: 'rgba(249,115,22,0.1)'}}><PiggyBank size={22} style={{color: '#F97316'}} /></div>
              <div className="admin-stat-info">
                <p className="label">Platform Commission</p>
                <h3 className="value" style={{color: '#F97316'}}>₹{overview.totalCommission?.toLocaleString()}</h3>
                <span className="trend up">Your net earning</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-blue-light"><CreditCard size={22} className="text-blue" /></div>
              <div className="admin-stat-info">
                <p className="label">This Month</p>
                <h3 className="value">₹{overview.monthRevenue?.toLocaleString()}</h3>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{background: 'rgba(239,68,68,0.1)'}}>
                <ArrowDownCircle size={22} style={{color: '#EF4444'}} />
              </div>
              <div className="admin-stat-info">
                <p className="label">Total Refunds</p>
                <h3 className="value" style={{color: '#EF4444'}}>₹{overview.totalRefunds?.toLocaleString()}</h3>
              </div>
            </div>
          </div>

          {/* Money Flow Visualization */}
          <div className="admin-card" style={{marginBottom: '24px'}}>
            <div className="admin-card-header">
              <h3>💸 How Money Flows — Per Order</h3>
            </div>
            <div className="admin-card-body">
              <div className="money-flow-visual">
                <div className="flow-step">
                  <div className="flow-icon customer"><Wallet size={24} /></div>
                  <div className="flow-label">Customer Pays</div>
                  <div className="flow-desc">Grand Total<br/>(Food + Delivery + Tax)</div>
                </div>
                <div className="flow-arrow"><ArrowRight size={24} /></div>
                <div className="flow-step">
                  <div className="flow-icon platform"><PiggyBank size={24} /></div>
                  <div className="flow-label">Platform Keeps</div>
                  <div className="flow-desc">Commission<br/>(% of food value)</div>
                </div>
                <div className="flow-arrow"><ArrowRight size={24} /></div>
                <div className="flow-step">
                  <div className="flow-icon restaurant"><Store size={24} /></div>
                  <div className="flow-label">Restaurant Gets</div>
                  <div className="flow-desc">Food Revenue<br/>minus Commission</div>
                </div>
                <div className="flow-arrow"><ArrowRight size={24} /></div>
                <div className="flow-step">
                  <div className="flow-icon driver"><Truck size={24} /></div>
                  <div className="flow-label">Driver Gets</div>
                  <div className="flow-desc">Delivery Fee<br/>(per order)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Distribution + Quick Summary */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
            {/* Pie Chart */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Revenue Distribution</h3>
              </div>
              <div className="admin-card-body" style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
                <div style={{width: '200px', height: '200px'}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="pie-legend-list">
                  {pieData.map((item, idx) => (
                    <div key={item.name} className="pie-legend-row">
                      <span className="legend-dot" style={{backgroundColor: PIE_COLORS[idx]}}></span>
                      <span className="legend-name">{item.name}</span>
                      <span className="legend-val">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Settlements Summary */}
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Settlement Summary</h3>
              </div>
              <div className="admin-card-body">
                <div className="settlement-summary-list">
                  <div className="summary-row">
                    <div className="summary-label"><Store size={16} style={{color: '#10B981'}} /> Settled to Restaurants</div>
                    <div className="summary-value" style={{color: '#10B981'}}>₹{overview.totalSettledToRestaurants?.toLocaleString()}</div>
                  </div>
                  <div className="summary-row">
                    <div className="summary-label"><Store size={16} style={{color: '#F59E0B'}} /> Pending to Restaurants</div>
                    <div className="summary-value" style={{color: '#F59E0B'}}>₹{totalPendingRestaurant.toLocaleString()}</div>
                  </div>
                  <div className="summary-row separator"></div>
                  <div className="summary-row">
                    <div className="summary-label"><Truck size={16} style={{color: '#10B981'}} /> Settled to Drivers</div>
                    <div className="summary-value" style={{color: '#10B981'}}>₹{Math.abs(overview.totalSettledToDrivers || 0).toLocaleString()}</div>
                  </div>
                  <div className="summary-row">
                    <div className="summary-label"><Truck size={16} style={{color: '#3B82F6'}} /> Platform Owes Drivers</div>
                    <div className="summary-value" style={{color: '#3B82F6'}}>₹{platformOwingDrivers.toLocaleString()}</div>
                  </div>
                  <div className="summary-row">
                    <div className="summary-label"><Banknote size={16} style={{color: '#EF4444'}} /> Drivers Owe Platform (COD)</div>
                    <div className="summary-value" style={{color: '#EF4444'}}>₹{driversOwingPlatform.toLocaleString()}</div>
                  </div>
                  <div className="summary-row separator"></div>
                  <div className="summary-row">
                    <div className="summary-label"><Clock size={16} style={{color: '#F59E0B'}} /> Pending Driver Deposits</div>
                    <div className="summary-value" style={{color: '#F59E0B'}}>{pendingDeposits.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ RESTAURANT SETTLEMENTS ═══════════════════ */}
      {activeSubTab === 'restaurants' && (
        <div className="finance-tab-content animate-fade-in">
          {/* Summary Cards */}
          <div className="admin-stats-grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-green-light"><IndianRupee size={22} className="text-green" /></div>
              <div className="admin-stat-info">
                <p className="label">Total Restaurant Earnings</p>
                <h3 className="value">₹{overview.totalRestaurantEarnings?.toLocaleString()}</h3>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-blue-light"><CheckCircle2 size={22} className="text-blue" /></div>
              <div className="admin-stat-info">
                <p className="label">Already Settled</p>
                <h3 className="value" style={{color: '#10B981'}}>₹{overview.totalSettledToRestaurants?.toLocaleString()}</h3>
              </div>
            </div>
            <div className="admin-stat-card" style={{borderLeft: '3px solid #F59E0B'}}>
              <div className="admin-stat-icon" style={{background: 'rgba(245,158,11,0.1)'}}><Clock size={22} style={{color: '#F59E0B'}} /></div>
              <div className="admin-stat-info">
                <p className="label">Pending Payouts</p>
                <h3 className="value" style={{color: '#F59E0B'}}>₹{totalPendingRestaurant.toLocaleString()}</h3>
                <span className="trend">{overview.restaurantPayouts?.filter(r => r.pending_balance > 0).length || 0} restaurants</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="finance-info-box">
            <Info size={18} />
            <div>
              <strong>How restaurant settlement works:</strong> When an order is delivered, the platform deducts its commission from the food total. 
              The remaining amount is the restaurant's earnings. This table shows how much each restaurant has earned, how much has been paid out, and what's still pending.
            </div>
          </div>

          {/* Restaurant Table */}
          <div className="admin-card" style={{marginBottom: '24px'}}>
            <div className="admin-card-header">
              <h3>🏪 Restaurant-wise Breakdown</h3>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th>Orders</th>
                      <th>Gross Revenue</th>
                      <th>Commission (Platform)</th>
                      <th>Net Earnings</th>
                      <th>Already Paid</th>
                      <th>Pending</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.restaurantPayouts?.map((r, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 600}}>{r.name}</td>
                        <td>{r.orders}</td>
                        <td>₹{parseFloat(r.gross_revenue || 0).toLocaleString()}</td>
                        <td style={{color: '#F97316', fontWeight: 500}}>₹{parseFloat(r.total_commission || 0).toLocaleString()}</td>
                        <td style={{fontWeight: 600}}>₹{parseFloat(r.total_earnings).toLocaleString()}</td>
                        <td style={{color: '#10B981'}}>₹{parseFloat(r.total_settled).toLocaleString()}</td>
                        <td>
                          {r.pending_balance > 0 ? (
                            <span style={{color: '#F59E0B', fontWeight: 700}}>₹{r.pending_balance.toLocaleString()}</span>
                          ) : (
                            <span style={{color: '#10B981', fontWeight: 500}}>✓ Settled</span>
                          )}
                        </td>
                        <td>
                          {r.pending_balance > 0 && (
                            <button
                              className="btn-action success"
                              onClick={() => setPayoutModal({ isOpen: true, entity: { ...r, role: 'restaurant' } })}
                            >
                              <IndianRupee size={14} /> Settle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!overview.restaurantPayouts || overview.restaurantPayouts.length === 0) && (
                      <tr><td colSpan="8" style={{textAlign: 'center', padding: '30px', color: '#6B7280'}}>No restaurant data found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Restaurant Settlement History */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>📜 Restaurant Settlement History</h3>
              <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{restaurantSettlements.length} records</span>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Restaurant</th><th>Amount Paid</th><th>Reference</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {restaurantSettlements.slice(0, 20).map(s => (
                      <tr key={s.id}>
                        <td style={{fontWeight: 600}}>{s.entity_name}</td>
                        <td style={{color: '#10B981', fontWeight: 600}}>₹{parseFloat(s.amount).toLocaleString()}</td>
                        <td style={{fontFamily: 'monospace', fontSize: '0.8rem'}}>{s.transaction_ref}</td>
                        <td style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                          {new Date(s.paid_at || s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {restaurantSettlements.length === 0 && (
                      <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px', color: '#6B7280'}}>No restaurant settlements yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ DRIVER SETTLEMENTS ═══════════════════ */}
      {activeSubTab === 'drivers' && (
        <div className="finance-tab-content animate-fade-in">
          {/* Summary Cards */}
          <div className="admin-stats-grid" style={{gridTemplateColumns: 'repeat(4, 1fr)'}}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-green-light"><IndianRupee size={22} className="text-green" /></div>
              <div className="admin-stat-info">
                <p className="label">Total Delivery Fees</p>
                <h3 className="value">₹{overview.totalDeliveryFees?.toLocaleString()}</h3>
                <span className="trend up">Earned by all drivers</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{background: 'rgba(239,68,68,0.1)'}}><Banknote size={22} style={{color: '#EF4444'}} /></div>
              <div className="admin-stat-info">
                <p className="label">COD Cash with Drivers</p>
                <h3 className="value" style={{color: '#EF4444'}}>₹{driversOwingPlatform.toLocaleString()}</h3>
                <span className="trend">Drivers owe this to platform</span>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon bg-blue-light"><ArrowUpRight size={22} className="text-blue" /></div>
              <div className="admin-stat-info">
                <p className="label">Platform Owes Drivers</p>
                <h3 className="value" style={{color: '#3B82F6'}}>₹{platformOwingDrivers.toLocaleString()}</h3>
                <span className="trend">Need to pay these drivers</span>
              </div>
            </div>
            <div className="admin-stat-card" style={{borderLeft: pendingDeposits.length > 0 ? '3px solid #F59E0B' : 'none'}}>
              <div className="admin-stat-icon" style={{background: 'rgba(245,158,11,0.1)'}}><Clock size={22} style={{color: '#F59E0B'}} /></div>
              <div className="admin-stat-info">
                <p className="label">Pending Deposit Approvals</p>
                <h3 className="value" style={{color: '#F59E0B'}}>{pendingDeposits.length}</h3>
                <span className="trend">Drivers submitted, awaiting approval</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="finance-info-box">
            <Info size={18} />
            <div>
              <strong>How driver settlement works:</strong> Drivers earn a <strong>delivery fee</strong> per order from the platform. 
              When they deliver <strong>COD orders</strong>, they collect cash from the customer on behalf of the platform. 
              <br/><strong>Net Balance = Delivery Fees Earned – COD Cash Collected – Already Settled.</strong>
              <br/>🟢 <strong>Positive balance</strong> = Platform needs to pay the driver.
              <br/>🔴 <strong>Negative balance</strong> = Driver collected more COD cash than they earned, so they owe the platform.
            </div>
          </div>

          {/* Pending Deposits to Approve */}
          {pendingDeposits.length > 0 && (
            <div className="admin-card" style={{marginBottom: '24px', border: '1px solid #F59E0B'}}>
              <div className="admin-card-header" style={{backgroundColor: '#FEF3C7'}}>
                <h3>⏳ Pending Driver Deposits — Awaiting Your Approval</h3>
                <span className="badge-pending">{pendingDeposits.length} pending</span>
              </div>
              <div className="admin-card-body no-pad">
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Driver</th><th>Amount Deposited</th><th>UTR / Reference</th><th>Submitted</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {pendingDeposits.map(s => (
                        <tr key={s.id}>
                          <td style={{fontWeight: 600}}>{s.entity_name}</td>
                          <td style={{color: '#EF4444', fontWeight: 600}}>₹{Math.abs(s.amount).toLocaleString()}</td>
                          <td style={{fontFamily: 'monospace', fontSize: '0.85rem'}}>{s.transaction_ref}</td>
                          <td style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                            {new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td>
                            <button className="btn-action success" onClick={() => handleApproveDeposit(s.id)}>
                              <CheckCircle2 size={14} /> Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Driver Balances Table */}
          <div className="admin-card" style={{marginBottom: '24px'}}>
            <div className="admin-card-header">
              <h3>🚚 Driver-wise Breakdown</h3>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Deliveries</th>
                      <th>Delivery Fee Earned</th>
                      <th>COD Cash Collected</th>
                      <th>Already Settled</th>
                      <th>Net Balance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.driverPayouts?.map((d, i) => (
                      <tr key={i}>
                        <td style={{fontWeight: 600}}>{d.name}</td>
                        <td>{d.deliveries}</td>
                        <td style={{color: '#10B981'}}>₹{parseFloat(d.total_earnings).toLocaleString()}</td>
                        <td style={{color: '#EF4444'}}>₹{parseFloat(d.cash_in_hand).toLocaleString()}</td>
                        <td>₹{Math.abs(parseFloat(d.total_settled)).toLocaleString()}</td>
                        <td>
                          {d.pending_balance > 0 ? (
                            <span className="balance-badge positive">
                              <ArrowUpRight size={14} /> Platform owes ₹{d.pending_balance.toLocaleString()}
                            </span>
                          ) : d.pending_balance < 0 ? (
                            <span className="balance-badge negative">
                              <ArrowDownRight size={14} /> Driver owes ₹{Math.abs(d.pending_balance).toLocaleString()}
                            </span>
                          ) : (
                            <span className="balance-badge settled">✓ Settled</span>
                          )}
                        </td>
                        <td>
                          {Math.abs(d.pending_balance) > 0.01 && (
                            <button
                              className={`btn-action ${d.pending_balance > 0 ? 'success' : 'danger'}`}
                              onClick={() => setPayoutModal({ isOpen: true, entity: { ...d, role: 'driver' } })}
                            >
                              {d.pending_balance > 0 ? (
                                <><IndianRupee size={14} /> Pay Driver</>
                              ) : (
                                <><Receipt size={14} /> Record Deposit</>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!overview.driverPayouts || overview.driverPayouts.length === 0) && (
                      <tr><td colSpan="7" style={{textAlign: 'center', padding: '30px', color: '#6B7280'}}>No driver data found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Driver Settlement History */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>📜 Driver Settlement History</h3>
              <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{driverSettlements.length} records</span>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Driver</th><th>Amount</th><th>Type</th><th>Reference</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {driverSettlements.slice(0, 20).map(s => (
                      <tr key={s.id}>
                        <td style={{fontWeight: 600}}>{s.entity_name}</td>
                        <td style={{fontWeight: 600, color: s.amount < 0 ? '#EF4444' : '#10B981'}}>
                          {s.amount < 0 ? `-₹${Math.abs(s.amount).toLocaleString()}` : `₹${parseFloat(s.amount).toLocaleString()}`}
                        </td>
                        <td>
                          {s.amount < 0 ? (
                            <span className="type-badge deposit">Driver → Platform</span>
                          ) : (
                            <span className="type-badge payout">Platform → Driver</span>
                          )}
                        </td>
                        <td style={{fontFamily: 'monospace', fontSize: '0.8rem'}}>{s.transaction_ref}</td>
                        <td style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                          {new Date(s.paid_at || s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                    {driverSettlements.length === 0 && (
                      <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px', color: '#6B7280'}}>No driver settlements yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ PAYOUT MODAL ═══════════════════ */}
      {payoutModal.isOpen && (() => {
        const isDeposit = payoutModal.entity.role === 'driver' && payoutModal.entity.pending_balance < 0;
        return (
          <div className="admin-modal-overlay" style={{zIndex: 1000}}>
            <div className="admin-modal scale-in" style={{maxWidth: '440px'}}>
              <div className="admin-modal-header">
                <h3>{isDeposit ? '📥 Record Driver Deposit' : '💸 Process Payout'}</h3>
                <button className="close-btn" onClick={() => setPayoutModal({ isOpen: false, entity: null })}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="admin-modal-body">
                <div className="payout-modal-summary">
                  <div className="payout-entity">
                    <div className={`payout-entity-icon ${payoutModal.entity.role}`}>
                      {payoutModal.entity.role === 'restaurant' ? <Store size={20} /> : <Truck size={20} />}
                    </div>
                    <div>
                      <div className="payout-entity-name">{payoutModal.entity.name}</div>
                      <div className="payout-entity-role">{payoutModal.entity.role === 'restaurant' ? 'Restaurant Partner' : 'Delivery Partner'}</div>
                    </div>
                  </div>

                  <div className="payout-amount-display">
                    <span className="payout-amount-label">{isDeposit ? 'Amount Driver is Depositing' : 'Amount to Pay'}</span>
                    <span className={`payout-amount-value ${isDeposit ? 'red' : 'green'}`}>
                      ₹{Math.abs(payoutModal.entity.pending_balance).toLocaleString()}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleProcessPayout}>
                  <div className="form-group" style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem'}}>
                      Transaction Reference (UTR / UPI / Cash) *
                    </label>
                    <input 
                      type="text" 
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder={isDeposit ? "e.g. UTR1234 or 'CASH'" : "e.g. UTR123456789"}
                      required
                      style={{width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', transition: 'border 0.2s'}}
                    />
                    <p style={{margin: '8px 0 0 0', fontSize: '0.8rem', color: '#64748b'}}>
                      {isDeposit 
                        ? 'Enter the UTR if paid via UPI, or type CASH if collected physically.' 
                        : 'Perform the bank transfer first, then enter the reference number here to record it.'}
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{
                      width: '100%', padding: '14px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                      borderRadius: '10px', fontWeight: '700',
                      backgroundColor: isDeposit ? '#EF4444' : '#10B981'
                    }}
                    disabled={payoutLoading}
                  >
                    {payoutLoading ? 'Processing...' : (
                      <>
                        <CreditCard size={18} />
                        {isDeposit ? 'Confirm Deposit Received' : 'Confirm Payment Sent'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
