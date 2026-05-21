import { useEffect, useState } from 'react';
import { Search, Star, MapPin, Phone, Mail, Clock, Package, IndianRupee, X } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner } from '../../components';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDetail, setDriverDetail] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/admin/drivers');
      setDrivers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const viewDriver = async (id) => {
    try {
      const { data } = await api.get(`/admin/drivers/${id}`);
      setDriverDetail(data);
      setSelectedDriver(id);
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'offline' ? 'available' : 'offline';
    try {
      await api.put(`/admin/drivers/${id}/status`, { status: newStatus });
      fetchDrivers();
    } catch (err) { console.error(err); }
  };

  const filtered = drivers.filter(d => 
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    available: drivers.filter(d => d.status === 'available').length,
    busy: drivers.filter(d => d.status === 'busy').length,
    offline: drivers.filter(d => d.status === 'offline').length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Delivery Partners</h1>
        <p>Manage and monitor all delivery agents</p>
      </div>

      {/* Status Summary */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
            <span style={{ fontSize: '1.25rem' }}>🟢</span>
          </div>
          <div className="admin-stat-info">
            <p className="label">Online</p>
            <h3 className="value">{statusCounts.available}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-yellow-light">
            <span style={{ fontSize: '1.25rem' }}>🟡</span>
          </div>
          <div className="admin-stat-info">
            <p className="label">Busy</p>
            <h3 className="value">{statusCounts.busy}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(156,163,175,0.1)' }}>
            <span style={{ fontSize: '1.25rem' }}>⚫</span>
          </div>
          <div className="admin-stat-info">
            <p className="label">Offline</p>
            <h3 className="value">{statusCounts.offline}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-wrap">
          <Search />
          <input className="search-input" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Drivers Table */}
      <div className="admin-card">
        <div className="admin-card-body no-pad">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Total Deliveries</th>
                  <th>Today</th>
                  <th>Total Earnings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(driver => (
                  <tr key={driver.id}>
                    <td>
                      <div className="entity-row">
                        <div className="entity-avatar" style={{ background: driver.status === 'available' ? 'var(--accent-green)' : driver.status === 'busy' ? '#F59E0B' : '#9CA3AF' }}>
                          {driver.name[0]}
                        </div>
                        <div className="entity-details">
                          <div className="name">{driver.name}</div>
                          <div className="sub">{driver.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.813rem', textTransform: 'capitalize' }}>
                        <span className={`status-dot ${driver.status}`} />
                        {driver.status}
                      </span>
                    </td>
                    <td><span className="star-rating">⭐ {driver.rating}</span></td>
                    <td style={{ fontWeight: 600 }}>{driver.total_deliveries}</td>
                    <td>{driver.today_orders}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{driver.total_earnings?.toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-action primary" onClick={() => viewDriver(driver.id)}>View</button>
                        <button 
                          className={`btn-action ${driver.status === 'offline' ? 'success' : 'danger'}`} 
                          onClick={() => toggleStatus(driver.id, driver.status)}
                        >
                          {driver.status === 'offline' ? 'Activate' : 'Deactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && driverDetail && (
        <div className="admin-modal-overlay" onClick={() => { setSelectedDriver(null); setDriverDetail(null); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Driver Profile</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => { setSelectedDriver(null); setDriverDetail(null); }}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div className="entity-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem', margin: '0 auto 12px', background: 'var(--primary)' }}>
                  {driverDetail.name?.[0]}
                </div>
                <h4>{driverDetail.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span className={`status-dot ${driverDetail.agent_status}`} /> {driverDetail.agent_status}
                </p>
              </div>

              <div className="form-grid" style={{ gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Mail size={15} color="var(--text-muted)" /> {driverDetail.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Phone size={15} color="var(--text-muted)" /> {driverDetail.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Star size={15} color="var(--text-muted)" /> Rating: {driverDetail.rating}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Package size={15} color="var(--text-muted)" /> {driverDetail.total_deliveries} deliveries
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <IndianRupee size={15} color="var(--text-muted)" /> ₹{driverDetail.total_earnings?.toLocaleString()} earned
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Clock size={15} color="var(--text-muted)" /> Joined {new Date(driverDetail.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Recent Deliveries */}
              <h4 style={{ marginTop: 28, marginBottom: 12, fontSize: '1rem' }}>Recent Deliveries</h4>
              {driverDetail.recentDeliveries?.length > 0 ? (
                <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                  {driverDetail.recentDeliveries.map(d => (
                    <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.813rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{d.restaurant_name}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>₹{d.delivery_fee}</div>
                        <div style={{ textTransform: 'capitalize', color: d.status === 'delivered' ? 'var(--accent-green)' : 'var(--status-cancelled)' }}>{d.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No deliveries yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
