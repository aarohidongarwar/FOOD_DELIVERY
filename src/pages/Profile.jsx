import { useState } from 'react';
import { User, Mail, Phone, MapPin, Save } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import './Profile.css';

export default function Profile() {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile');
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
        </div>
      </div>
    </div>
  );
}
