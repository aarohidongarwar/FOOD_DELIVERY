import { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, CreditCard, ArrowDownCircle, X, CheckCircle2 } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner } from '../../components';

export default function AdminFinance() {
  const [overview, setOverview] = useState(null);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const isDeposit = payoutModal.entity.role === 'driver' && payoutModal.entity.pending_balance < 0;
      const amount = payoutModal.entity.pending_balance;
      const payload = {
        entity_type: payoutModal.entity.role === 'driver' ? 'driver' : 'restaurant',
        entity_id: payoutModal.entity.id,
        amount: amount,
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

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Finance & Settlements</h1>
        <p>Manage payouts and track driver deposits seamlessly.</p>
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

      <div style={{display: 'flex', gap: '20px', alignItems: 'flex-start'}}>
        
        {/* LEFT COLUMN: Payouts */}
        <div style={{flex: 1}}>
          {/* Driver Payouts / Collections */}
          <div className="admin-card" style={{marginBottom: '20px'}}>
            <div className="admin-card-header">
              <h3>Driver Balances</h3>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Driver</th><th>Net Balance</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {overview.driverPayouts?.filter(d => Math.abs(d.pending_balance) > 0.01).map((d, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td>
                          {d.pending_balance > 0 ? (
                            <span style={{ color: '#10B981', fontWeight: 600 }}>Platform Owes: ₹{d.pending_balance?.toLocaleString()}</span>
                          ) : (
                            <span style={{ color: '#EF4444', fontWeight: 600 }}>Driver Owes: ₹{Math.abs(d.pending_balance)?.toLocaleString()}</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn-primary" 
                            style={{padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: d.pending_balance > 0 ? '#10B981' : '#EF4444'}}
                            onClick={() => setPayoutModal({ isOpen: true, entity: { ...d, role: 'driver' } })}
                          >
                            {d.pending_balance > 0 ? 'Pay Driver' : 'Record Deposit'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {overview.driverPayouts?.filter(d => Math.abs(d.pending_balance) > 0.01).length === 0 && (
                      <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px', color: '#6B7280'}}>All drivers settled</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Restaurant Payouts */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Restaurant Pending Payouts</h3>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Restaurant</th><th>Pending</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {overview.restaurantPayouts?.filter(r => r.pending_balance > 0).map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td style={{ fontWeight: 600, color: '#10B981' }}>₹{r.pending_balance?.toLocaleString()}</td>
                        <td>
                          <button 
                            className="btn-primary" 
                            style={{padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px'}}
                            onClick={() => setPayoutModal({ isOpen: true, entity: { ...r, role: 'restaurant' } })}
                          >
                            Settle
                          </button>
                        </td>
                      </tr>
                    ))}
                    {overview.restaurantPayouts?.filter(r => r.pending_balance > 0).length === 0 && (
                      <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px', color: '#6B7280'}}>All restaurants settled</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: History & Pending Approvals */}
        <div style={{flex: 1}}>
          {/* Pending Driver Deposits */}
          <div className="admin-card" style={{marginBottom: '20px', border: pendingDeposits.length > 0 ? '1px solid #F59E0B' : 'none'}}>
            <div className="admin-card-header" style={{backgroundColor: pendingDeposits.length > 0 ? '#FEF3C7' : 'white'}}>
              <h3>Pending Driver Deposits (Online)</h3>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Driver</th><th>Amount</th><th>UTR</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {pendingDeposits.map((s, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{s.entity_name}</td>
                        <td style={{ color: '#EF4444', fontWeight: 600 }}>₹{Math.abs(s.amount)}</td>
                        <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{s.transaction_ref}</td>
                        <td>
                          <button 
                            className="btn-primary" 
                            style={{padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px'}}
                            onClick={() => handleApproveDeposit(s.id)}
                          >
                            <CheckCircle2 size={14}/> Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pendingDeposits.length === 0 && (
                      <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#6B7280'}}>No pending deposits</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Settlement History */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Settlement Track Record</h3>
            </div>
            <div className="admin-card-body no-pad">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Entity</th><th>Amount</th><th>Ref</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {completedSettlements.slice(0, 15).map(s => (
                      <tr key={s.id}>
                        <td style={{ fontSize: '0.813rem' }}>{s.entity_name} <span style={{color:'#94a3b8', fontSize:'0.7rem'}}>({s.entity_type})</span></td>
                        <td style={{ fontWeight: 600, color: s.amount < 0 ? '#EF4444' : '#10B981' }}>
                          {s.amount < 0 ? `-₹${Math.abs(s.amount)}` : `₹${s.amount}`}
                        </td>
                        <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{s.transaction_ref?.slice(0,12)}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(s.paid_at || s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                    {completedSettlements.length === 0 && (
                      <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#6B7280'}}>No settlements yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Payout Modal */}
      {payoutModal.isOpen && (() => {
        const isDeposit = payoutModal.entity.role === 'driver' && payoutModal.entity.pending_balance < 0;
        return (
          <div className="modal-overlay fade-in" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div className="modal-content scale-in" style={{backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2 style={{margin: 0, fontSize: '1.25rem'}}>{isDeposit ? 'Record Deposit' : 'Process Payout'}</h2>
                <button onClick={() => setPayoutModal({ isOpen: false, entity: null })} style={{background: 'none', border: 'none', cursor: 'pointer'}}><X size={20} /></button>
              </div>
              
              <div style={{marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px'}}>
                <p style={{margin: '0 0 8px 0', color: '#64748b', fontSize: '0.9rem'}}>{isDeposit ? 'Depositor' : 'Recipient'}</p>
                <h3 style={{margin: '0 0 12px 0'}}>{payoutModal.entity.name} <span style={{fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal', textTransform: 'capitalize'}}>({payoutModal.entity.role})</span></h3>
                
                <p style={{margin: '0 0 8px 0', color: '#64748b', fontSize: '0.9rem'}}>{isDeposit ? 'Amount Received' : 'Amount to Settle'}</p>
                <h2 style={{margin: 0, color: isDeposit ? '#EF4444' : 'var(--primary)', fontSize: '2rem'}}>₹{Math.abs(payoutModal.entity.pending_balance).toLocaleString()}</h2>
              </div>

              <form onSubmit={handleProcessPayout}>
                <div className="form-group" style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>Transaction Reference (UTR / UPI / Cash) *</label>
                  <input 
                    type="text" 
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder={isDeposit ? "e.g. UTR1234 or 'CASH'" : "e.g. UTR123456789"}
                    required
                    style={{width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box'}}
                  />
                  <p style={{margin: '6px 0 0 0', fontSize: '0.8rem', color: '#64748b'}}>
                    {isDeposit ? 'Enter the UTR if they paid via UPI, or type CASH if collected physically.' : 'Please perform the bank transfer first, then enter the reference number here.'}
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: isDeposit ? '#EF4444' : 'var(--primary)'}}
                  disabled={payoutLoading}
                >
                  {payoutLoading ? 'Processing...' : <><CreditCard size={18} style={{marginRight: '8px'}} /> {isDeposit ? 'Confirm Deposit' : 'Record Payout'}</>}
                </button>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
