import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X, Tag, Calendar, Users, ShoppingBag, Percent, IndianRupee } from 'lucide-react';
import api from '../../api';
import { LoadingSpinner } from '../../components';

const EMPTY_FORM = {
  code: '', description: '', discount_type: 'flat', discount_value: '',
  min_order: '', max_discount: '', usage_limit: '', valid_from: '', valid_until: ''
};

export default function AdminPromos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    try {
      const { data } = await api.get('/admin/promos');
      setPromos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (promo) => {
    setForm({
      code: promo.code, description: promo.description || '',
      discount_type: promo.discount_type, discount_value: promo.discount_value,
      min_order: promo.min_order || '', max_discount: promo.max_discount || '',
      usage_limit: promo.usage_limit || '', valid_from: promo.valid_from || '', valid_until: promo.valid_until || ''
    });
    setEditing(promo.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) return alert('Code and discount value are required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/promos/${editing}`, { ...form, is_active: promos.find(p => p.id === editing)?.is_active ?? 1 });
      } else {
        await api.post('/admin/promos', form);
      }
      setShowModal(false);
      fetchPromos();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save');
    }
    finally { setSaving(false); }
  };

  const deletePromo = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    try {
      await api.delete(`/admin/promos/${id}`);
      fetchPromos();
    } catch (err) { console.error(err); }
  };

  const togglePromo = async (id) => {
    try {
      await api.put(`/admin/promos/${id}/toggle`);
      fetchPromos();
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) return <LoadingSpinner />;

  const activeCount = promos.filter(p => p.is_active).length;
  const totalUsage = promos.reduce((s, p) => s + (p.used_count || 0), 0);

  return (
    <div className="animate-fade-in">
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>Promo Codes</h1>
          <p>Create and manage promotional offers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> Create Promo
        </button>
      </div>

      {/* Summary */}
      <div className="admin-stats-grid" style={{ marginBottom: 28 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-primary-light"><Tag size={22} className="text-primary" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Promos</p>
            <h3 className="value">{promos.length}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-green-light"><span style={{ fontSize: '1.25rem' }}>✅</span></div>
          <div className="admin-stat-info">
            <p className="label">Active</p>
            <h3 className="value">{activeCount}</h3>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon bg-blue-light"><Users size={22} className="text-blue" /></div>
          <div className="admin-stat-info">
            <p className="label">Total Usage</p>
            <h3 className="value">{totalUsage.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Promo Grid */}
      <div className="promo-grid">
        {promos.map(promo => (
          <div key={promo.id} className={`promo-card ${!promo.is_active ? 'inactive' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="promo-code-badge">{promo.code}</div>
              <span style={{
                padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.688rem', fontWeight: 600,
                background: promo.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: promo.is_active ? 'var(--accent-green)' : 'var(--status-cancelled)'
              }}>
                {promo.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              {promo.description || 'No description'}
            </p>

            <p style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--primary)' }}>
              {promo.discount_type === 'percent' ? `${promo.discount_value}% OFF` : `₹${promo.discount_value} OFF`}
            </p>

            <div className="promo-meta">
              {promo.min_order > 0 && (
                <span><ShoppingBag size={13} /> Min ₹{promo.min_order}</span>
              )}
              {promo.max_discount && (
                <span><IndianRupee size={13} /> Max ₹{promo.max_discount}</span>
              )}
              {promo.usage_limit && (
                <span><Users size={13} /> {promo.used_count}/{promo.usage_limit} used</span>
              )}
              {!promo.usage_limit && (
                <span><Users size={13} /> {promo.used_count} used</span>
              )}
              {promo.valid_until && (
                <span><Calendar size={13} /> Until {promo.valid_until}</span>
              )}
            </div>

            {/* Usage Progress Bar */}
            {promo.usage_limit && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.688rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Usage</span>
                  <span>{Math.round((promo.used_count / promo.usage_limit) * 100)}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border-light)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, transition: 'width 0.3s',
                    width: `${Math.min((promo.used_count / promo.usage_limit) * 100, 100)}%`,
                    background: (promo.used_count / promo.usage_limit) > 0.8 ? 'var(--status-cancelled)' : 'var(--primary)'
                  }} />
                </div>
              </div>
            )}

            <div className="promo-actions">
              <button className="btn-action primary" onClick={() => openEdit(promo)}><Edit2 size={12} /> Edit</button>
              <button className={`btn-action ${promo.is_active ? 'danger' : 'success'}`} onClick={() => togglePromo(promo.id)}>
                {promo.is_active ? <><ToggleRight size={12} /> Disable</> : <><ToggleLeft size={12} /> Enable</>}
              </button>
              <button className="btn-action danger" onClick={() => deletePromo(promo.id)}><Trash2 size={12} /></button>
            </div>
          </div>
        ))}

        {promos.length === 0 && (
          <div className="admin-empty" style={{ gridColumn: '1/-1' }}>
            <Tag size={48} />
            <h4>No Promo Codes Yet</h4>
            <p>Create your first promo code to attract more customers</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editing ? 'Edit Promo Code' : 'Create New Promo Code'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="form-grid">
                <div className="input-group">
                  <label>Promo Code *</label>
                  <input className="input-field" name="code" placeholder="e.g. FLAT50" value={form.code} onChange={handleChange} style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="input-group">
                  <label>Discount Type</label>
                  <select className="input-field" name="discount_type" value={form.discount_type} onChange={handleChange}>
                    <option value="flat">Flat (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>
                <div className="input-group full-width">
                  <label>Description</label>
                  <input className="input-field" name="description" placeholder="Promo description" value={form.description} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Discount Value *</label>
                  <input className="input-field" name="discount_value" type="number" placeholder={form.discount_type === 'percent' ? 'e.g. 20' : 'e.g. 50'} value={form.discount_value} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Min Order Amount (₹)</label>
                  <input className="input-field" name="min_order" type="number" placeholder="e.g. 200" value={form.min_order} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Max Discount (₹)</label>
                  <input className="input-field" name="max_discount" type="number" placeholder="e.g. 100" value={form.max_discount} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Usage Limit</label>
                  <input className="input-field" name="usage_limit" type="number" placeholder="Unlimited if empty" value={form.usage_limit} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Valid From</label>
                  <input className="input-field" name="valid_from" type="date" value={form.valid_from} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Valid Until</label>
                  <input className="input-field" name="valid_until" type="date" value={form.valid_until} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : (editing ? 'Update Promo' : 'Create Promo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
