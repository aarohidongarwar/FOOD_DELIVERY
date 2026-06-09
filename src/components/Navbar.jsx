import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Search, MapPin, Menu, X, ChevronDown, Package, LayoutDashboard, Truck, Bell, Settings, Moon } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import useCartStore from '../stores/cartStore';
import useNotificationStore from '../stores/notificationStore';
import './Navbar.css';

export default function Navbar({ onCartClick }) {
  const { user, logout } = useAuthStore();
  const itemCount = useCartStore(s => s.getItemCount());
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  const isLandingPage = ['/', '/home', '/onboarding', '/partnership-type', '/register-restaurant', '/register-grocery'].includes(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowDropdown(false);
  }, [location]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
    setMobileOpen(false);
  };

  const isMinimal = ['/login', '/rider/login', '/rider/register', '/register-restaurant', '/register-grocery'].includes(location.pathname);
  const isDarkPage = ['/rider/login', '/rider/register'].includes(location.pathname);

  if (location.pathname === '/driver') {
    return null;
  }

  if (isMinimal) {
    return (
      <nav className="navbar navbar-minimal">
        <div className="navbar-inner container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🍕</span>
            <span className="logo-text">Quick<span className="logo-accent">Bite</span></span>
          </Link>
        </div>
      </nav>
    );
  }

  const isDashboard = ['/restaurant-dashboard', '/admin'].includes(location.pathname);
  const isRestaurantDashboard = location.pathname === '/restaurant-dashboard';
  const isCustomerPortal = !user || user.role === 'customer';

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${isLandingPage ? 'navbar-landing' : ''} ${isDashboard ? 'navbar-dashboard' : ''}`}>
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🍕</span>
          <span className="logo-text">Quick<span className="logo-accent">Bite</span></span>
        </Link>

        {/* Search - Hidden on Landing Page */}
        {!isLandingPage && isCustomerPortal && (
          <form className="navbar-search" onSubmit={handleSearch}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search restaurants or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="navbar-search-input"
            />
          </form>
        )}

        {/* ── Desktop Right Actions ── */}
        <div className="navbar-actions">
          {isLandingPage ? (
            <div className="lp-nav-actions">
              {/* Partner with us link removed as requested */}
              {/* Sign in button removed as requested */}
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
                location.pathname === '/home' && (
                  <Link to="/login" className="btn btn-primary btn-sm">Login</Link>
                )
              )}
            </div>
          ) : (
            <>
              {isCustomerPortal && (
                <Link to="/restaurants" className="nav-link">
                  <MapPin size={18} />
                  <span>Restaurants</span>
                </Link>
              )}
              {user?.role === 'admin' && <Link to="/admin" className="nav-link"><LayoutDashboard size={18} /><span>Dashboard</span></Link>}
              {user?.role === 'driver' && <Link to="/driver" className="nav-link"><Truck size={18} /><span>Deliveries</span></Link>}
              {isCustomerPortal && (
                <button className="nav-cart-btn" onClick={onCartClick} id="cart-button" aria-label="Open cart">
                  <ShoppingCart size={22} />
                  {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                </button>
              )}
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
                      {isRestaurantDashboard ? (
                        <>
                          <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/restaurant-dashboard'); }}><Bell size={16} /> Notifications {unreadCount > 0 && <span className="dropdown-badge">{unreadCount}</span>}</button>
                          <button className="dropdown-item" onClick={() => { setShowDropdown(false); }}><Settings size={16} /> Settings</button>
                          <button className="dropdown-item" onClick={() => { setShowDropdown(false); }}><Moon size={16} /> Dark Mode</button>
                        </>
                      ) : (
                        <Link to="/orders" className="dropdown-item"><Package size={16} /> My Orders</Link>
                      )}
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

        {/* ── Mobile Right Actions ── */}
        <div className="navbar-mobile-actions">
          {/* Cart icon on mobile (non-landing only) */}
          {!isLandingPage && isCustomerPortal && (
            <button className="mobile-cart-btn nav-cart-btn" onClick={onCartClick} aria-label="Open cart">
              <ShoppingCart size={22} />
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </button>
          )}
          {/* Landing: show Sign In link on mobile */}
          {/* Sign in removed on mobile as requested */}
          {/* Hamburger */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Dropdown ── */}
      {mobileOpen && (
        <div className="mobile-menu animate-fade-in">
          {user && (
            <div className="mobile-user-info">
              <div className="nav-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <span className="mobile-user-name">{user.name}</span>
            </div>
          )}

          {!isLandingPage && isCustomerPortal && (
            <Link to="/restaurants" className="mobile-link">
              <MapPin size={18} /> Restaurants
            </Link>
          )}
          {/* Partner link removed on mobile as requested */}

          {user ? (
            <>
              <Link to="/profile" className="mobile-link"><User size={18} /> Profile</Link>
              {isRestaurantDashboard ? (
                <>
                  <button className="mobile-link" onClick={() => { setMobileOpen(false); navigate('/restaurant-dashboard'); }}><Bell size={18} /> Notifications {unreadCount > 0 && <span className="dropdown-badge">{unreadCount}</span>}</button>
                  <button className="mobile-link" onClick={() => setMobileOpen(false)}><Settings size={18} /> Settings</button>
                  <button className="mobile-link" onClick={() => setMobileOpen(false)}><Moon size={18} /> Dark Mode</button>
                </>
              ) : (
                <Link to="/orders" className="mobile-link"><Package size={18} /> My Orders</Link>
              )}
              {user?.role === 'admin' && <Link to="/admin" className="mobile-link"><LayoutDashboard size={18} /> Admin Dashboard</Link>}
              {user?.role === 'driver' && <Link to="/driver" className="mobile-link"><Truck size={18} /> Deliveries</Link>}
              <div className="mobile-divider" />
              <button className="mobile-link mobile-logout" onClick={handleLogout}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            (!isLandingPage || location.pathname === '/home') && (
              <>
                <div className="mobile-divider" />
                <Link to="/login" className="mobile-link mobile-login">Login / Sign Up</Link>
              </>
            )
          )}
        </div>
      )}
    </nav>
  );
}
