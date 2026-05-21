import { useEffect, useState } from 'react';
import { Search, Eye, X, ShoppingBag, IndianRupee, Calendar, Mail, Phone, MapPin } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner, OrderStatusBadge } from '../../components';

export default function AdminCustomers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('customer');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (search !== '') fetchUsers(); }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const viewUser = async (id) => {
    try {
      const { data } = await api.get(`/admin/users/${id}`);
      setUserDetail(data);
      setSelectedUser(id);
    } catch (err) { console.error(err); }
  };

  const roleColors = {
    customer: '#3B82F6',
    admin: '#EF4444',
    driver: '#F59E0B',
    restaurant: '#8B5CF6'
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>User Management</h1>
        <p>View and manage all platform users</p>
      </div>

      {/* Summary */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-blue-light"><span style={{ fontSize: '1.25rem' }}>👥</span></div>
          <div className="admin-stat-info">
            <p className="label">Total Users</p>
            <h3 className="value">{users.length}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-primary-light"><ShoppingBag size={22} className="text-primary" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Orders</p>
            <h3 className="value">{users.reduce((s, u) => s + (u.order_count || 0), 0)}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-green-light"><IndianRupee size={22} className="text-green" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Spent</p>
            <h3 className="value">₹{users.reduce((s, u) => s + (u.total_spent || 0), 0).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-wrap">
          <Search />
          <input className="search-input" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="driver">Drivers</option>
          <option value="restaurant">Restaurant Owners</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="admin-card">
        <div className="admin-card-body no-pad">
          {loading ? <div style={{ padding: 40 }}><LoadingSpinner /></div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="entity-row">
                          <div className="entity-avatar" style={{ background: roleColors[user.role] || '#6B7280' }}>
                            {user.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="entity-details">
                            <div className="name">{user.name}</div>
                            <div className="sub">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: `${roleColors[user.role]}15`, color: roleColors[user.role], textTransform: 'capitalize' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.813rem' }}>{user.phone || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{user.order_count || 0}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{(user.total_spent || 0).toLocaleString()}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td>
                        <button className="btn-action primary" onClick={() => viewUser(user.id)}>
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && userDetail && (
        <div className="admin-modal-overlay" onClick={() => { setSelectedUser(null); setUserDetail(null); }}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>User Profile</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => { setSelectedUser(null); setUserDetail(null); }}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div className="entity-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem', margin: '0 auto 12px', background: roleColors[userDetail.role] }}>
                  {userDetail.name?.[0]?.toUpperCase()}
                </div>
                <h4>{userDetail.name}</h4>
                <span className="badge" style={{ background: `${roleColors[userDetail.role]}15`, color: roleColors[userDetail.role], textTransform: 'capitalize', marginTop: 8 }}>
                  {userDetail.role}
                </span>
              </div>

              <div className="form-grid" style={{ gap: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Mail size={15} color="var(--text-muted)" /> {userDetail.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Phone size={15} color="var(--text-muted)" /> {userDetail.phone || 'N/A'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <MapPin size={15} color="var(--text-muted)" /> {userDetail.address || 'N/A'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <Calendar size={15} color="var(--text-muted)" /> Joined {new Date(userDetail.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <ShoppingBag size={15} color="var(--text-muted)" /> {userDetail.order_count} orders
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
                  <IndianRupee size={15} color="var(--text-muted)" /> ₹{userDetail.total_spent?.toLocaleString()} spent
                </div>
              </div>

              {/* Order History */}
              <h4 style={{ fontSize: '1rem', marginBottom: 12 }}>Order History</h4>
              {userDetail.orders?.length > 0 ? (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {userDetail.orders.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.813rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{o.restaurant_name}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 600 }}>₹{o.total_amount}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No orders yet</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
