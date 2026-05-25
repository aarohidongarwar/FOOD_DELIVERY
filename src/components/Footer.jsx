import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const location = useLocation();
  const isDashboard = ['/restaurant-dashboard', '/admin'].includes(location.pathname);

  return (
    <footer className={`footer ${isDashboard ? 'footer-dashboard' : ''}`}>
      <div className="footer-inner container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">🍕</span>
              <span className="logo-text">Quick<span className="logo-accent">Bite</span></span>
            </div>
            <p className="footer-tagline">
              Delivering happiness, one bite at a time. Fresh food from the best restaurants, straight to your door.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/restaurants">Restaurants</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div className="footer-col">
            <h4>Information</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact Us</h4>
            <ul>
              <li>📧 support@quickbite.app</li>
              <li>📞 +91 98765 43210</li>
              <li>📍 Mumbai, India</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} QuickBite. All rights reserved. Made by Aarohi &amp; Rushikesh</p>
        </div>
      </div>
    </footer>
  );
}
