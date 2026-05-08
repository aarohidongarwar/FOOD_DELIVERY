import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, Utensils, Truck, ShieldCheck } from 'lucide-react';
import './LandingPage.css';

export default function Onboarding() {
  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      subtitle: 'Order food from best restaurants',
      icon: <ShoppingBag size={40} />,
      color: 'var(--primary)',
      bg: 'var(--primary-bg)',
      link: '/home',
      buttonText: 'Order Food'
    },
    {
      id: 'restaurant',
      title: 'Restaurant Partner',
      subtitle: 'Grow your business with us',
      icon: <Utensils size={40} />,
      color: '#E91E63',
      bg: '#FCE4EC',
      link: '/partnership-type',
      buttonText: 'Register Shop'
    },
    {
      id: 'driver',
      title: 'Delivery Partner',
      subtitle: 'Earn with every delivery',
      icon: <Truck size={40} />,
      color: '#4CAF50',
      bg: '#E8F5E9',
      link: '/login?role=driver',
      buttonText: 'Join Fleet'
    },
    {
      id: 'admin',
      title: 'Platform Admin',
      subtitle: 'Manage platform operations',
      icon: <ShieldCheck size={40} />,
      color: '#2196F3',
      bg: '#E3F2FD',
      link: '/login?role=admin',
      buttonText: 'Login as Admin'
    }
  ];

  return (
    <div className="onboarding-page">
      <section className="lp-roles-section container">
        <div className="lp-section-header">
          <h2>Choose your path</h2>
          <p>Select how you want to interact with QuickBite today</p>
        </div>

        <div className="lp-roles-grid">
          {roles.map((role, i) => (
            <motion.div 
              key={role.id}
              className="lp-role-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="lp-role-icon" style={{ backgroundColor: role.bg, color: role.color }}>
                {role.icon}
              </div>
              <h3 className="lp-role-title">{role.title}</h3>
              <p className="lp-role-desc">{role.subtitle}</p>
              <Link to={role.link} className="btn w-full" style={{ backgroundColor: role.color, color: 'white' }}>
                {role.buttonText}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
