import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, MapPin, Menu, X, ChevronDown, Package, LayoutDashboard, Truck, ArrowUpRight } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useCartStore from '../stores/cartStore';
import './Navbar.css';

export default function Navbar({ onCartClick }) {
  const { user, logout } = useAuthStore();
  const itemCount = useCartStore(s => s.getItemCount());
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const isLandingPage = ['/', '/onboarding', '/partnership-type', '/register-restaurant', '/register-grocery'].includes(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowDropdown(false);
  }, [location]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (['/register-restaurant', '/register-grocery'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${isLandingPage ? 'navbar-landing' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🍕</span>
          <span className="logo-text">Quick<span className="logo-accent">Bite</span></span>
        </Link>

        {/* Search - Hidden on Landing Page */}
        {!isLandingPage && (
          <form className="navbar-search" onSubmit={handleSearch}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search for restaurants or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="navbar-search-input"
            />
          </form>
        )}

        {/* Right Actions */}
        <div className="navbar-actions">
          {isLandingPage ? (
            <div className="lp-nav-actions">
              {location.pathname === '/' && (
                <Link to="/onboarding" className="nav-link lp-nav-link">
                  Partner with us
                </Link>
              )}
              {!user && location.pathname === '/' && (
                <Link to="/login" className="btn btn-dark lp-nav-btn" id="login-nav-btn">
                  Sign in
                </Link>
              )}
              {user && (
                <div className="nav-profile" ref={dropdownRef}>
                  <button className="nav-profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
                    <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                    <span className="nav-username">{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`dropdown-chevron ${showDropdown ? 'rotated' : ''}`} />
                  </button>
                  {showDropdown && (
                    <div className="profile-dropdown animate-fade-in">
                      <Link to="/profile" className="dropdown-item"><User size={16} /> Profile</Link>
                      <Link to="/orders" className="dropdown-item"><Package size={16} /> My Orders</Link>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item dropdown-logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/restaurants" className="nav-link">
                <MapPin size={18} />
                <span>Restaurants</span>
              </Link>
              {user?.role === 'admin' && <Link to="/admin" className="nav-link"><LayoutDashboard size={18} /><span>Dashboard</span></Link>}
              {user?.role === 'driver' && <Link to="/driver" className="nav-link"><Truck size={18} /><span>Deliveries</span></Link>}
              <button className="nav-cart-btn" onClick={onCartClick} id="cart-button">
                <ShoppingCart size={20} />
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </button>
              {user ? (
                <div className="nav-profile" ref={dropdownRef}>
                  <button className="nav-profile-btn" onClick={() => setShowDropdown(!showDropdown)}>
                    <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                    <span className="nav-username">{user.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`dropdown-chevron ${showDropdown ? 'rotated' : ''}`} />
                  </button>
                  {showDropdown && (
                    <div className="profile-dropdown animate-fade-in">
                      <Link to="/profile" className="dropdown-item"><User size={16} /> Profile</Link>
                      <Link to="/orders" className="dropdown-item"><Package size={16} /> My Orders</Link>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item dropdown-logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="navbar-mobile-actions">
          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="mobile-menu animate-fade-in">
          <Link to="/restaurants" className="mobile-link">Restaurants</Link>
          {user ? (
            <button className="mobile-link mobile-logout" onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login" className="mobile-link mobile-login">Login / Sign Up</Link>
          )}
        </div>
      )}
    </nav>
  );
}
