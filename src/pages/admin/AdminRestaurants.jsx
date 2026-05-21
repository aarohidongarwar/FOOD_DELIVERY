import { useEffect, useState } from 'react';
import { Search, Star, ToggleLeft, ToggleRight, Eye, X, ShoppingBag, IndianRupee, UtensilsCrossed } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api';
import { LoadingSpinner } from '../../components';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRest, setSelectedRest] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchRestaurants = async () => {
    try {
      const { data } = await api.get('/admin/restaurants');
      setRestaurants(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const toggleActive = async (id) => {
    try {
      await api.put(`/admin/restaurants/${id}/toggle`);
      fetchRestaurants();
    } catch (err) { console.error(err); }
  };

  const viewAnalytics = async (id) => {
    try {
      const { data } = await api.get(`/admin/restaurants/${id}/analytics`);
      setAnalytics(data);
      setSelectedRest(id);
    } catch (err) { console.error(err); }
  };

  const filtered = restaurants.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Restaurant Management</h1>
        <p>Manage all partner restaurants on the platform</p>
      </div>

      {/* Summary */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-primary-light"><UtensilsCrossed size={22} className="text-primary" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Restaurants</p>
            <h3 className="value">{restaurants.length}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-green-light"><span style={{ fontSize: '1.25rem' }}>✅</span></div>
          <div className="admin-stat-info">
            <p className="label">Active</p>
            <h3 className="value">{restaurants.filter(r => r.is_active).length}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-blue-light"><IndianRupee size={22} className="text-blue" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Revenue</p>
            <h3 className="value">₹{restaurants.reduce((s, r) => s + (r.total_revenue || 0), 0).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-wrap">
          <Search />
          <input className="search-input" placeholder="Search restaurants..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Restaurant Table */}
      <div className="admin-card">
        <div className="admin-card-body no-pad">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Cuisine</th>
                  <th>Owner</th>
                  <th>Rating</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Menu Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rest => (
                  <tr key={rest.id}>
                    <td>
                      <div className="entity-row">
                        <div className="entity-avatar" style={{ background: rest.is_grocery ? '#3B82F6' : 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                          {rest.is_grocery ? '🛒' : '🍽️'}
                        </div>
                        <div className="entity-details">
                          <div className="name">{rest.name}</div>
                          <div className="sub">{rest.address}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">{rest.cuisine_type}</span></td>
                    <td style={{ fontSize: '0.813rem' }}>{rest.owner_name || '—'}</td>
                    <td><span className="star-rating">⭐ {rest.rating}</span></td>
                    <td style={{ fontWeight: 600 }}>{rest.total_orders}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{rest.total_revenue?.toLocaleString()}</td>
                    <td>{rest.menu_count}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600,
                        background: rest.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: rest.is_active ? 'var(--accent-green)' : 'var(--status-cancelled)'
                      }}>
                        {rest.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-action primary" onClick={() => viewAnalytics(rest.id)}>
                          <Eye size={13} /> Analytics
                        </button>
                        <button 
                          className={`btn-action ${rest.is_active ? 'danger' : 'success'}`} 
                          onClick={() => toggleActive(rest.id)}
                        >
                          {rest.is_active ? <><ToggleRight size={13} /> Disable</> : <><ToggleLeft size={13} /> Enable</>}
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

      {/* Analytics Modal */}
      {selectedRest && analytics && (
        <div className="admin-modal-overlay" onClick={() => { setSelectedRest(null); setAnalytics(null); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="admin-modal-header">
              <h3>{analytics.name} — Analytics</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => { setSelectedRest(null); setAnalytics(null); }}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              {/* Order Trend */}
              {analytics.ordersByDay?.length > 0 && (
                <>
                  <h4 style={{ fontSize: '1rem', marginBottom: 16 }}>Orders (Last 30 Days)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.ordersByDay}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={v => new Date(v).getDate()} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
                      <Bar dataKey="count" fill="var(--primary)" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}

              {/* Top Items */}
              <h4 style={{ fontSize: '1rem', marginTop: 28, marginBottom: 12 }}>Top Selling Items</h4>
              {analytics.topItems?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
                  <span>{i + 1}. {item.name}</span>
                  <span style={{ fontWeight: 600 }}>{item.total_qty} sold • ₹{item.total_revenue?.toLocaleString()}</span>
                </div>
              ))}

              {/* Reviews */}
              <h4 style={{ fontSize: '1rem', marginTop: 28, marginBottom: 12 }}>Recent Reviews</h4>
              {analytics.reviews?.length > 0 ? analytics.reviews.map((r, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.user_name}</span>
                    <span className="star-rating">⭐ {r.rating}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.813rem' }}>{r.comment}</p>
                </div>
              )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No reviews yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
