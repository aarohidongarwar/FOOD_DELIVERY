import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Utensils, 
  Truck, 
  ShieldCheck, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Zap,
  Star,
  CheckCircle2
} from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
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
              <Link to="/onboarding" className="btn btn-secondary btn-lg lp-cta-secondary">
                Partner with us
              </Link>
            </div>
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

      {/* Partners Section */}
      <section className="lp-roles-section">
        <div className="container">
          <motion.div className="lp-section-header" {...fadeInUp}>
            <h2>Join the Ecosystem</h2>
            <p>There's a place for everyone at QuickBite</p>
          </motion.div>
          
          <div className="lp-roles-grid">
            <motion.div className="lp-role-card" {...fadeInUp} transition={{ delay: 0.1 }}>
              <div className="lp-role-icon bg-orange-light">
                <Utensils size={40} className="text-orange" />
              </div>
              <h3 className="lp-role-title">Restaurants</h3>
              <p className="lp-role-desc">Boost your sales by reaching thousands of new customers in your area.</p>
              <Link to="/register-restaurant" className="lp-cta-text">Join as Partner <ChevronRight size={16} /></Link>
            </motion.div>

            <motion.div className="lp-role-card" {...fadeInUp} transition={{ delay: 0.2 }}>
              <div className="lp-role-icon bg-green-light">
                <Truck size={40} className="text-green" />
              </div>
              <h3 className="lp-role-title">Drivers</h3>
              <p className="lp-role-desc">Earn money on your own schedule by delivering delicious food.</p>
              <Link to="/rider/login" className="lp-cta-text">Drive with us <ChevronRight size={16} /></Link>
            </motion.div>

            <motion.div className="lp-role-card" {...fadeInUp} transition={{ delay: 0.3 }}>
              <div className="lp-role-icon bg-blue-light">
                <ShoppingBag size={40} className="text-blue" />
              </div>
              <h3 className="lp-role-title">Customers</h3>
              <p className="lp-role-desc">Explore wide variety of cuisines and get them delivered fast.</p>
              <Link to="/home" className="lp-cta-text">Start Ordering <ChevronRight size={16} /></Link>
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
