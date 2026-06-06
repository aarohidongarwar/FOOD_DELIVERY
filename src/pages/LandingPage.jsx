import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Utensils, 
  Truck, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  MapPin, 
  Clock, 
  Zap,
  Star,
  CheckCircle2,
  X
} from 'lucide-react';
import useAuthStore from '../stores/authStore';
import './LandingPage.css';

export default function LandingPage() {
  const { user, silentLogout } = useAuthStore();
  
  // Auto-logout when a logged-in user reaches the landing page
  useEffect(() => {
    if (user) {
      silentLogout();
    }
  }, [user, silentLogout]);

  const [showPartnerOptions, setShowPartnerOptions] = useState(false);
  const partnerRef = useRef(null);

  const partnerOptions = [
    {
      id: 'restaurant',
      title: 'Restaurant Partner',
      subtitle: 'Grow your business with us',
      icon: <Utensils size={28} />,
      color: '#E91E63',
      bg: '#FCE4EC',
      link: '/partnership-type',
      buttonText: 'Register Shop'
    },
    {
      id: 'driver',
      title: 'Delivery Partner',
      subtitle: 'Earn with every delivery',
      icon: <Truck size={28} />,
      color: '#4CAF50',
      bg: '#E8F5E9',
      link: '/rider/login',
      buttonText: 'Join Fleet'
    }
  ];

  const handlePartnerToggle = () => {
    setShowPartnerOptions(prev => !prev);
    if (!showPartnerOptions) {
      setTimeout(() => {
        partnerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="landing-page">
      {/* Decorative Orange Background Shape */}
      <div className="lp-bg-orange-shape"></div>
      
      {/* Hero Section */}
      <section className="lp-hero">
        <div className="container lp-hero-inner">
          <motion.div 
            className="lp-hero-content"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="lp-title">
              One Platform, <br />
              <span>Endless Flavors.</span>
            </h1>
            <p className="lp-subtitle">
              Join the QuickBite ecosystem. Whether you're hungry, owning a restaurant, 
              or looking to deliver, we have a place for you.
            </p>
            
            <div className="lp-hero-actions">
              <Link to="/home" className="btn btn-primary btn-lg lp-cta">
                Order Now <ChevronRight size={20} />
              </Link>
              <button 
                className={`btn btn-secondary btn-lg lp-cta-secondary ${showPartnerOptions ? 'lp-cta-secondary--active' : ''}`}
                onClick={handlePartnerToggle}
              >
                Partner with us
                <motion.span
                  animate={{ rotate: showPartnerOptions ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'inline-flex', marginLeft: 8 }}
                >
                  <ChevronDown size={20} />
                </motion.span>
              </button>
            </div>

            {/* Inline Partner Options */}
            <AnimatePresence>
              {showPartnerOptions && (
                <motion.div
                  ref={partnerRef}
                  className="lp-partner-panel"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="lp-partner-panel-inner">
                    <div className="lp-partner-panel-header">
                      <h3>Choose your path</h3>
                      <button className="lp-partner-close" onClick={() => setShowPartnerOptions(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className="lp-partner-grid">
                      {partnerOptions.map((option, i) => (
                        <motion.div
                          key={option.id}
                          className="lp-partner-card"
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.4, delay: i * 0.08, ease: 'easeOut' }}
                          whileHover={{ 
                            y: -6, 
                            boxShadow: `0 12px 30px ${option.color}25`,
                            borderColor: option.color 
                          }}
                        >
                          <div 
                            className="lp-partner-card-icon" 
                            style={{ backgroundColor: option.bg, color: option.color }}
                          >
                            {option.icon}
                          </div>
                          <div className="lp-partner-card-text">
                            <h4>{option.title}</h4>
                            <p>{option.subtitle}</p>
                          </div>
                          <Link 
                            to={option.link} 
                            className="lp-partner-card-btn"
                            style={{ backgroundColor: option.color }}
                          >
                            {option.buttonText}
                            <ChevronRight size={16} />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <motion.div 
            className="lp-hero-image-container"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              animate={{
                y: [0, -15, 0],
                rotate: [0, 1, -1, 0]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <img 
                src="/landing-hero.png" 
                alt="Fresh Noodles" 
                className="lp-hero-dish"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="lp-how-it-works">
        <div className="container">
          <div className="lp-hiw-layout">
            <div className="lp-hiw-content">
              <motion.div className="lp-hiw-header" {...fadeInUp}>
                <h2>How it works</h2>
                <p>Your favorite meal is just a few clicks away</p>
              </motion.div>

              <div className="lp-steps-grid">
                <motion.div className="lp-step-item" {...fadeInUp} transition={{ delay: 0.1 }}>
                  <div className="lp-step-icon-wrap">
                    <MapPin size={32} />
                    <span className="lp-step-number">1</span>
                  </div>
                  <div className="lp-step-text">
                    <h3>Set Location</h3>
                    <p>Select your location to see all available restaurants near you.</p>
                  </div>
                </motion.div>

                <motion.div className="lp-step-item" {...fadeInUp} transition={{ delay: 0.2 }}>
                  <div className="lp-step-icon-wrap">
                    <Utensils size={32} />
                    <span className="lp-step-number">2</span>
                  </div>
                  <div className="lp-step-text">
                    <h3>Choose Dish</h3>
                    <p>Browse through menus and select your favorite dishes.</p>
                  </div>
                </motion.div>

                <motion.div className="lp-step-item" {...fadeInUp} transition={{ delay: 0.3 }}>
                  <div className="lp-step-icon-wrap">
                    <Truck size={32} />
                    <span className="lp-step-number">3</span>
                  </div>
                  <div className="lp-step-text">
                    <h3>Fast Delivery</h3>
                    <p>Our riders will deliver your food fresh and hot to your doorstep.</p>
                  </div>
                </motion.div>
              </div>
            </div>

            <motion.div
              className="lp-hiw-image-container"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="lp-hiw-orange-blob"></div>
              <img
                src="/landing-page-img.png"
                alt="How it works"
                className="lp-hiw-dish"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="lp-features">
        <div className="container">
          <div className="lp-features-layout">
            <motion.div className="lp-features-content" {...fadeInUp}>
              <span className="lp-badge">Our Benefits</span>
              <h2>Why Choose QuickBite?</h2>
              <p>We pride ourselves on providing the fastest and most reliable food delivery service in the city.</p>
              
              <ul className="lp-features-list">
                <li>
                  <div className="lp-feat-icon"><Zap size={20} /></div>
                  <div>
                    <h4>Instant Delivery</h4>
                    <p>Average delivery time of 30 minutes or less.</p>
                  </div>
                </li>
                <li>
                  <div className="lp-feat-icon"><ShieldCheck size={20} /></div>
                  <div>
                    <h4>Secure Payments</h4>
                    <p>All transactions are 100% secure and encrypted.</p>
                  </div>
                </li>
                <li>
                  <div className="lp-feat-icon"><Star size={20} /></div>
                  <div>
                    <h4>Top Rated Restaurants</h4>
                    <p>Only the best restaurants make it to our platform.</p>
                  </div>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="lp-features-visual"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="lp-visual-card lp-card-1">
                <CheckCircle2 size={24} className="text-green" />
                <span>Order Confirmed!</span>
              </div>
              <div className="lp-visual-card lp-card-2">
                <Clock size={24} className="text-orange" />
                <span>Estimated: 25 mins</span>
              </div>
              <img src="https://images.unsplash.com/photo-1526367790999-0150786486a9?q=80&w=2071&auto=format&fit=crop" alt="Rider" className="lp-rider-img" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* App Promo Section */}
      <section className="lp-app-promo">
        <div className="container">
          <div className="lp-app-inner">
            <motion.div className="lp-app-content" {...fadeInUp}>
              <h2>Download our app for the best experience</h2>
              <p>Get exclusive offers, real-time tracking, and a smoother ordering process on our mobile app.</p>
              <div className="lp-app-badges">
                <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" />
              </div>
            </motion.div>
            <motion.div 
              className="lp-app-mockup-container"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <div className="lp-app-circle lp-app-circle-1"></div>
              <div className="lp-app-circle lp-app-circle-2"></div>
              
              <motion.div 
                className="lp-app-mockup"
                animate={{
                  y: [0, -20, 0],
                  rotateZ: [0, -1, 1, 0]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <img src="/phone-mockup.png" alt="App Mockup" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="lp-final-cta">
        <div className="container">
          <motion.div className="lp-cta-box" {...fadeInUp}>
            <h2>Ready to satisfy your cravings?</h2>
            <p>Join thousands of happy customers today and experience the best food delivery service.</p>
            <Link to="/home" className="btn btn-primary btn-lg lp-final-btn">
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
