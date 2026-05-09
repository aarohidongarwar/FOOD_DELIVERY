import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, Lock, MapPin, Truck, CreditCard, AlertCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import './RiderLogin.css';

export default function RiderRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    licenseNumber: '',
    emergencyContact: '',
    role: 'driver'
  });
  
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Assuming the register function can handle extra driver fields or we'll filter them
      await register(formData);
      navigate('/driver', { replace: true });
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="rider-login-page registration-mode">
      <div className="rider-login-container registration-container">
        <Link to="/rider/login" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Login</span>
        </Link>

        <motion.div 
          className="rider-login-card registration-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rider-login-header">
            <h1>Create Account</h1>
            <p>Join the QuickBite fleet and start earning</p>
          </div>

          {error && <div className="rider-login-error">{error}</div>}

          <form className="rider-login-form registration-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Full Name */}
              <div className="rider-input-group full-width">
                <label htmlFor="name">Full Name</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    id="name"
                    type="text" 
                    name="name"
                    placeholder="Arjun Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="rider-input-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input 
                    id="email"
                    type="email" 
                    name="email"
                    placeholder="arjun@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="rider-input-group">
                <label htmlFor="phone">Phone</label>
                <div className="input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input 
                    id="phone"
                    type="tel" 
                    name="phone"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="rider-input-group full-width">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    id="password"
                    type="password" 
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="rider-input-group full-width">
                <label htmlFor="address">Address</label>
                <div className="input-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input 
                    id="address"
                    type="text" 
                    name="address"
                    placeholder="12 MG Road, Bangalore"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Vehicle Type */}
              <div className="rider-input-group">
                <label htmlFor="vehicleType">Vehicle Type</label>
                <div className="input-wrapper">
                  <Truck size={18} className="input-icon" />
                  <select 
                    id="vehicleType"
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="rider-select"
                  >
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="cycle">Cycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Number */}
              <div className="rider-input-group">
                <label htmlFor="vehicleNumber">Vehicle Number</label>
                <div className="input-wrapper">
                  <CreditCard size={18} className="input-icon" />
                  <input 
                    id="vehicleNumber"
                    type="text" 
                    name="vehicleNumber"
                    placeholder="KA01MN5678"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* License Number */}
              <div className="rider-input-group">
                <label htmlFor="licenseNumber">License Number</label>
                <div className="input-wrapper">
                  <CreditCard size={18} className="input-icon" />
                  <input 
                    id="licenseNumber"
                    type="text" 
                    name="licenseNumber"
                    placeholder="LIC789012"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="rider-input-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                <div className="input-wrapper">
                  <AlertCircle size={18} className="input-icon" />
                  <input 
                    id="emergencyContact"
                    type="tel" 
                    name="emergencyContact"
                    placeholder="9876500000"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className={`rider-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Submit Registration'}
            </button>
          </form>

          <div className="rider-login-footer">
            <p>Already registered? <Link to="/rider/login">Sign in</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
