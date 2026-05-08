import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Utensils, ShoppingBasket, ArrowRight } from 'lucide-react';
import './PartnershipType.css';

export default function PartnershipType() {
  const partners = [
    {
      id: 'restaurant',
      title: 'Restaurant Partner',
      description: 'Run a kitchen, cloud brand, or dine-in restaurant? Reach diners across the city.',
      icon: <Utensils size={32} />,
      link: '/register-restaurant'
    },
    {
      id: 'grocery',
      title: 'Grocery Vendor Partner',
      description: 'Local kirana, supermarket, or specialty store. Deliver groceries in minutes.',
      icon: <ShoppingBasket size={32} />,
      link: '/register-grocery'
    }
  ];

  return (
    <div className="partnership-page">
      <div className="partnership-container">
        <div className="partnership-header">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Choose your partnership
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Two simple paths to get started in minutes.
          </motion.p>
        </div>

        <div className="partnership-grid">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.id}
              className="partnership-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
            >
              <div className="partnership-card-bg"></div>
              <div className="partnership-card-content">
                <div className="partnership-icon-box">
                  {partner.icon}
                </div>
                <h2>{partner.title}</h2>
                <p>{partner.description}</p>
                <Link to={partner.link} className="partnership-cta">
                  Get started <ArrowRight size={20} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
