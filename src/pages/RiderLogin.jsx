import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import './RiderLogin.css';

export default function RiderLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
      navigate('/driver', { replace: true });
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="rider-login-page">
      <div className="rider-login-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>

        <motion.div 
          className="rider-login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rider-login-header">
            <div className="rider-icon-badge">
              <img src="/delivery-truck.png" alt="Rider" className="rider-icon-img" onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/2951/2951141.png'} />
            </div>
            <h1>Sign in</h1>
            <p>Access your delivery dashboard</p>
          </div>

          {error && <div className="rider-login-error">{error}</div>}

          <form className="rider-login-form" onSubmit={handleSubmit}>
            <div className="rider-input-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  id="email"
                  type="email" 
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="rider-input-group">
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
                />
              </div>
            </div>

            <div className="forgot-password">
              <Link to="#">Forgot password?</Link>
            </div>

            <button 
              type="submit" 
              className={`rider-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="rider-login-footer">
            <p>New rider? <Link to="/rider/register">Register here</Link></p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
