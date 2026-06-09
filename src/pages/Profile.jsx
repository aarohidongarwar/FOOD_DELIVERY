import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Store } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useToastStore from '../stores/toastStore';
import api from '../api';
import './Profile.css';

export default function Profile() {
  const { user, updateProfile, wallet, fetchWallet, addWalletFunds } = useAuthStore();
  const toast = useToastStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [saving, setSaving] = useState(false);

  const [addAmount, setAddAmount] = useState('');
  const [addingFunds, setAddingFunds] = useState(false);

  const [restaurantData, setRestaurantData] = useState(null);

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchWallet();
    } else if (user?.role === 'restaurant') {
      api.get('/restaurants/owner/me').then(res => {
        if (res.data && res.data.id) {
          setRestaurantData(res.data);
        }
      }).catch(err => console.error(err));
    }
  }, [fetchWallet, user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleAddFunds = async () => {
    const amt = parseFloat(addAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning('Please enter a valid amount');
      return;
    }

    setAddingFunds(true);
    try {
      await addWalletFunds(amt);
      setAddAmount('');
      toast.success('Funds added successfully!');
    } catch (err) {
      toast.error('Failed to add funds. Please try again.');
    } finally {
      setAddingFunds(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p className="subtitle">Manage your personal information</p>
      </div>

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-avatar-large">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="profile-name">{user?.name}</h2>
          <p className="profile-role badge badge-primary">{user?.role}</p>
          <p className="profile-joined">Member since {new Date(user?.created_at || Date.now()).getFullYear()}</p>
        </div>

        <div className="profile-main">
          <div className="profile-card">
            <div className="pc-header">
              <h3>Personal Information</h3>
              {!isEditing && (
                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      name="name"
                      className="input-field" 
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      value={user?.email}
                      disabled
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      className="input-field" 
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="input-group mt-4">
                  <label>Delivery Address</label>
                  <textarea 
                    name="address"
                    className="input-field" 
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-actions mt-4">
                  <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <div className="pi-item">
                  <div className="pi-icon"><User size={20} /></div>
                  <div className="pi-content">
                    <span className="pi-label">Full Name</span>
                    <span className="pi-value">{user?.name}</span>
                  </div>
                </div>
                <div className="pi-item">
                  <div className="pi-icon"><Mail size={20} /></div>
                  <div className="pi-content">
                    <span className="pi-label">Email Address</span>
                    <span className="pi-value">{user?.email}</span>
                  </div>
                </div>
                <div className="pi-item">
                  <div className="pi-icon"><Phone size={20} /></div>
                  <div className="pi-content">
                    <span className="pi-label">Phone Number</span>
                    <span className="pi-value">{user?.phone || 'Not provided'}</span>
                  </div>
                </div>
                <div className="pi-item full-width">
                  <div className="pi-icon"><MapPin size={20} /></div>
                  <div className="pi-content">
                    <span className="pi-label">Default Delivery Address</span>
                    <span className="pi-value">{user?.address || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {user?.role === 'customer' && (
            <div className="profile-card mt-6" style={{ marginTop: '24px' }}>
              <div className="pc-header">
                <h3>My Wallet</h3>
              </div>
              <div className="wallet-dashboard">
                <div className="wallet-balance-card">
                  <span className="wallet-bal-label">Available Balance</span>
                  <h2 className="wallet-bal-amount">₹{(wallet?.balance || 0).toFixed(2)}</h2>
                  
                  <div className="wallet-add-funds">
                    <label className="wallet-input-label">Add Funds to Wallet</label>
                    <div className="wallet-add-input-wrap">
                      <input 
                        type="number" 
                        placeholder="Enter amount (e.g. 500)" 
                        value={addAmount} 
                        onChange={(e) => setAddAmount(e.target.value)} 
                        className="input-field"
                        min="1"
                      />
                      <button className="btn btn-primary" onClick={handleAddFunds} disabled={addingFunds}>
                        {addingFunds ? 'Processing...' : 'Add Balance'}
                      </button>
                    </div>
                    <div className="wallet-quick-amounts">
                      {['100', '500', '1000'].map(amt => (
                        <button 
                          key={amt} 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => setAddAmount(amt)}
                        >
                          + ₹{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="wallet-transactions">
                  <h4>Recent Transactions</h4>
                  {wallet?.transactions?.length === 0 ? (
                    <p className="no-transactions">No transactions yet.</p>
                  ) : (
                    <div className="transactions-list">
                      {wallet?.transactions?.map(tx => (
                        <div key={tx.id} className="transaction-item">
                          <div className="tx-details">
                            <span className="tx-desc">{tx.description || 'Wallet transaction'}</span>
                            <span className="tx-date">{new Date(tx.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className={`tx-amount ${tx.type === 'credit' ? 'credit-style' : 'debit-style'}`}>
                            {tx.type === 'credit' ? '+' : '-'} ₹{parseFloat(tx.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {user?.role === 'restaurant' && restaurantData && (
            <div className="profile-card mt-6" style={{ marginTop: '24px' }}>
              <div className="pc-header">
                <h3>Business Information</h3>
              </div>
              <div className="profile-info-grid">
                <div className="pi-item full-width">
                  <div className="pi-icon"><Store size={20} /></div>
                  <div className="pi-content">
                    <span className="pi-label">Business Name</span>
                    <span className="pi-value">{restaurantData.name}</span>
                  </div>
                </div>
                <div className="pi-item">
                  <div className="pi-content">
                    <span className="pi-label">Type</span>
                    <span className="pi-value">{restaurantData.is_grocery ? 'Grocery Store' : 'Restaurant'} - {restaurantData.cuisine_type}</span>
                  </div>
                </div>
                <div className="pi-item full-width">
                  <div className="pi-content">
                    <span className="pi-label">Business Address</span>
                    <span className="pi-value">{restaurantData.address}</span>
                  </div>
                </div>
                {restaurantData.registration_details?.fssaiLicense && (
                  <div className="pi-item">
                    <div className="pi-content">
                      <span className="pi-label">FSSAI License</span>
                      <span className="pi-value">{restaurantData.registration_details.fssaiLicense}</span>
                    </div>
                  </div>
                )}
                {restaurantData.registration_details?.gstNumber && (
                  <div className="pi-item">
                    <div className="pi-content">
                      <span className="pi-label">GST Number</span>
                      <span className="pi-value">{restaurantData.registration_details.gstNumber}</span>
                    </div>
                  </div>
                )}
                {restaurantData.registration_details?.panCard && (
                  <div className="pi-item">
                    <div className="pi-content">
                      <span className="pi-label">PAN Card</span>
                      <span className="pi-value">{restaurantData.registration_details.panCard}</span>
                    </div>
                  </div>
                )}
                {restaurantData.registration_details?.openingTime && (
                  <div className="pi-item">
                    <div className="pi-content">
                      <span className="pi-label">Operating Hours</span>
                      <span className="pi-value">{restaurantData.registration_details.openingTime} to {restaurantData.registration_details.closingTime}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
