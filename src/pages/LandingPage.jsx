import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, Utensils, Truck, ShieldCheck, ChevronRight } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Decorative Orange Background Shape */}
      <div className="lp-bg-orange-shape"></div>
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
            
            {/* Scattered Ingredients Decoration */}
            <div className="lp-hero-decorations">
              <img src="https://cdn-icons-png.flaticon.com/512/2079/2079237.png" alt="chickpeas" className="lp-decor lp-decor-1" />
              <img src="https://cdn-icons-png.flaticon.com/512/2515/2515220.png" alt="jalapeno" className="lp-decor lp-decor-2" />
            </div>

            <Link to="/onboarding" className="btn btn-primary btn-lg lp-cta">
              Get Started <ChevronRight size={20} />
            </Link>
          </motion.div>
          
          <motion.div 
            className="lp-hero-image-container"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img 
              src="/landing-hero.png" 
              alt="Fresh Noodles" 
              className="lp-hero-dish"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
