// src/pages/RestaurantDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Check, Mail, LogOut } from 'lucide-react';
import './RestaurantDashboard.css';

// UI shown when the restaurant owner registration is under review
const UnderReview = ({ ownerName, restaurantName }) => (
  <div className="dashboard-container">
    <div className="success-card">
      <div className="success-header">
        <Clock size={24} className="success-logo-icon" />
        <span>Partner Hub</span>
      </div>
      <div className="success-icon-wrapper">
        <div className="success-icon-inner">
          <Clock size={32} />
        </div>
      </div>
      <h1 className="success-title">Profile Sent for Approval</h1>
      <p className="success-desc">
        Hi <strong>{ownerName.toUpperCase()}</strong>! Your application for <strong>{restaurantName}</strong> is under
        review. We'll notify you once approved (usually within 24‑48 hours).
      </p>
      <div className="status-stepper">
        <div className="status-step completed">
          <div className="status-circle completed"><Check size={18} /></div>
          <span>Application Submitted</span>
        </div>
        <div className="status-line active" />
        <div className="status-step active-current">
          <div className="status-circle current"><Clock size={18} /></div>
          <span>Under Review</span>
        </div>
        <div className="status-line" />
        <div className="status-step">
          <div className="status-circle"><Check size={18} /></div>
          <span>Approval Decision</span>
        </div>
      </div>
      <div className="help-link">
        <Mail size={16} /> Need help? Contact <a href="mailto:support@partnerhub.in">support@partnerhub.in</a>
      </div>
      <button className="btn-signout" onClick={() => {
        localStorage.removeItem('quickbite_token');
        window.location.reload();
      }}>
        <LogOut size={18} /> Sign Out
      </button>
    </div>
  </div>
);

const RestaurantDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('quickbite_token');
        const resp = await fetch('/api/restaurants/owner/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error('Failed to load profile');
        const data = await resp.json();
        setProfile(data);
      } catch (e) {
        console.error(e);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  const registration = profile?.registration_details || {};
  // Expect the backend to set a status field, e.g., "under_review"
  if (registration.status === 'under_review') {
    return (
      <UnderReview
        ownerName={profile?.fullName || 'Partner'}
        restaurantName={profile?.restaurantName || 'Your Restaurant'}
      />
    );
  }

  // Not yet completed – prompt the user to finish onboarding steps
  return (
    <div className="dashboard-pending">
      <h2>Complete Your Restaurant Onboarding</h2>
      <p>Please finish the remaining registration steps to activate your account.</p>
      <Link to="/register-restaurant" className="continue-button">
        Continue Registration
      </Link>
    </div>
  );
};

export default RestaurantDashboard;
