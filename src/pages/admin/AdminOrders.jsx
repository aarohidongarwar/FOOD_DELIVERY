import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, RefreshCw, Eye, X, UserCheck } from 'lucide-react';
import api from '../../api';
import { OrderStatusBadge, LoadingSpinner } from '../../components';

const STATUSES = ['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const { data } = await api.get('/admin/orders', { params });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    api.get('/admin/drivers').then(({ data }) => setDrivers(data)).catch(() => {});
  }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status }));
      }
    } catch (err) { console.error(err); }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/admin/orders/${orderId}/cancel`);
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) { console.error(err); }
  };

  const reassignDriver = async (orderId, driverId) => {
    try {
      await api.put(`/admin/orders/${orderId}/reassign`, { driver_id: driverId });
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const nextStatus = (current) => {
    const flow = { pending: 'confirmed', confirmed: 'preparing', preparing: 'out_for_delivery', out_for_delivery: 'delivered' };
    return flow[current] || null;
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header">
        <h1>Order Management</h1>
        <p>Monitor and manage all orders across the platform</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-wrap">
          <Search />
          <input
            className="search-input"
            placeholder="Search by order ID, customer, restaurant..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <button className="btn btn-sm btn-secondary" onClick={fetchOrders}>
          <RefreshCw size={14} /> Refresh
        </button>
        <span style={{ fontSize: '0.813rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{total} orders</span>
      </div>

      {/* Orders Table */}
      <div className="admin-card">
        <div className="admin-card-body no-pad">
          {loading ? <div style={{ padding: 40 }}><LoadingSpinner /></div> : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>#{order.id.slice(0, 8)}</td>
                      <td>
                        <div className="entity-details">
                          <div className="name">{order.customer_name}</div>
                          <div className="sub">{order.customer_phone}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.813rem' }}>{order.restaurant_name}</td>
                      <td>{order.items?.length || 0}</td>
                      <td style={{ fontWeight: 600 }}>₹{order.total_amount}</td>
                      <td>
                        <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.688rem' }}>
                          {order.payment?.method || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.813rem' }}>{order.driver_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-action neutral" onClick={() => setSelectedOrder(order)} title="View Details">
                            <Eye size={13} />
                          </button>
                          {nextStatus(order.status) && (
                            <button className="btn-action success" onClick={() => updateStatus(order.id, nextStatus(order.status))} title={`Move to ${nextStatus(order.status)}`}>
                              Next →
                            </button>
                          )}
                          {!['delivered', 'cancelled'].includes(order.status) && (
                            <button className="btn-action danger" onClick={() => cancelOrder(order.id)} title="Cancel">
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Order #{selectedOrder.id.slice(0, 8)}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setSelectedOrder(null)}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              {/* Status & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <OrderStatusBadge status={selectedOrder.status} />
                {nextStatus(selectedOrder.status) && (
                  <button className="btn btn-sm btn-primary" onClick={() => updateStatus(selectedOrder.id, nextStatus(selectedOrder.status))}>
                    Move to {nextStatus(selectedOrder.status).replace(/_/g, ' ')}
                  </button>
                )}
                {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                  <button className="btn btn-sm" style={{ background: 'var(--status-cancelled-bg)', color: 'var(--status-cancelled)' }} onClick={() => cancelOrder(selectedOrder.id)}>
                    Cancel Order
                  </button>
                )}
              </div>

              {/* Info Grid */}
              <div className="form-grid" style={{ gap: 20 }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Customer</p>
                  <p style={{ fontWeight: 600 }}>{selectedOrder.customer_name}</p>
                  <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{selectedOrder.customer_phone}</p>
                  <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Restaurant</p>
                  <p style={{ fontWeight: 600 }}>{selectedOrder.restaurant_name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Delivery Address</p>
                  <p style={{ fontSize: '0.875rem' }}>{selectedOrder.delivery_address || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Payment</p>
                  <p style={{ fontWeight: 600 }}>₹{selectedOrder.total_amount}</p>
                  <p style={{ fontSize: '0.813rem', color: 'var(--text-secondary)' }}>
                    {selectedOrder.payment?.method?.toUpperCase()} • {selectedOrder.payment?.status}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Order Items</p>
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: '0.875rem' }}>{item.quantity}x {item.name}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span>Delivery Fee</span>
                  <span>₹{selectedOrder.delivery_fee}</span>
                </div>
              </div>

              {/* Reassign Driver */}
              {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
                    <UserCheck size={14} style={{ display: 'inline', marginRight: 4 }} /> Assign / Reassign Driver
                  </p>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={selectedOrder.driver_id || ''}
                    onChange={e => reassignDriver(selectedOrder.id, e.target.value)}
                  >
                    <option value="">Select Driver</option>
                    {drivers.filter(d => d.status === 'available' || d.id === selectedOrder.driver_id).map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
