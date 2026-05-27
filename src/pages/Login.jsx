import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, User, ShieldCheck } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const params = new URLSearchParams(location.search);
  const roleParam = params.get('role');
  const isRestaurantRole = roleParam === 'restaurant';
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: ['customer', 'driver', 'restaurant', 'admin'].includes(roleParam) ? roleParam : 'customer'
  });
  
  const { login, register, isAuthenticated, loading, error } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated()) {
      redirectUser(useAuthStore.getState().user);
    }
  }, [isAuthenticated, navigate]);

  const redirectUser = (user) => {
    if (location.state?.returnTo) {
      navigate(location.state.returnTo, { replace: true });
      return;
    }

    switch(user?.role) {
      case 'admin': navigate('/admin', { replace: true }); break;
      case 'driver': navigate('/driver', { replace: true }); break;
      case 'restaurant': navigate('/restaurant-dashboard', { replace: true }); break;
      default: navigate('/home', { replace: true }); break;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let user;
      if (isLogin) {
        user = await login(formData.email, formData.password);
      } else {
        user = await register(formData);
      }
      redirectUser(user);
    } catch (err) {
      // Error is handled by store
    }
  };

  const handleAdminQuickLogin = async () => {
    try {
      const user = await login('admin@quickbite.com', 'password123');
      redirectUser(user);
    } catch (err) {
      // Error is handled by store
    }
  };

  return (
    <div className="auth-page">
      {roleParam === 'admin' && (
        <div style={{ width: '100%', maxWidth: '440px', display: 'flex', justifyContent: 'flex-start' }}>
          <Link to="/" className="back-link">
            <ArrowLeft size={18} />
            <span>Back to Home</span>
          </Link>
        </div>
      )}
      <div className="auth-container animate-fade-in-up">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="logo-icon">🍕</span>
            <h2>QuickBite</h2>
          </div>
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Login to order your favorite food' : 'Sign up to get started'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="name"
                className="input-field" 
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              className="input-field" 
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="input-group">
              <label>Phone Number (Optional)</label>
              <input 
                type="tel" 
                name="phone"
                className="input-field" 
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className="input-field" 
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          {!isLogin && !isRestaurantRole && (
            <div className="input-group">
              <label>Register As</label>
              <select 
                name="role" 
                className="input-field"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="customer">Customer</option>
                <option value="driver">Delivery Partner</option>
                <option value="restaurant">Restaurant Owner</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className={`btn btn-primary auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="auth-switch-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>

        {isLogin && (
          <div className="quick-login-section">
            <div className="divider">
              <span>OR QUICK LOGIN AS</span>
            </div>
            {roleParam === 'admin' ? (
              <div className="quick-login-grid-single">
                <button 
                  type="button" 
                  className="btn btn-outline quick-login-btn-admin"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, email: 'admin@quickbite.com', password: 'password123' }));
                  }}
                >
                  <span className="admin-btn-icon">
                    <ShieldCheck size={20} />
                  </span>
                  Admin
                </button>
              </div>
            ) : roleParam === 'restaurant' ? (
              <div className="quick-login-grid-single">
                <button 
                  type="button" 
                  className="btn btn-outline quick-login-btn-owner"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, email: 'owner1@quickbite.com', password: 'password123' }));
                  }}
                >
                  <span className="owner-btn-icon">🏪</span>
                  Owner
                </button>
              </div>
            ) : (
              <div className="quick-login-grid">
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, email: 'rahul@example.com', password: 'password123' }));
                  }}
                >
                  👤 Customer
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, email: 'owner1@quickbite.com', password: 'password123' }));
                  }}
                >
                  🏪 Owner
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, email: 'driver1@example.com', password: 'password123' }));
                  }}
                >
                  🚴 Driver
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, email: 'admin@quickbite.com', password: 'password123' }));
                  }}
                >
                  🛡️ Admin
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
