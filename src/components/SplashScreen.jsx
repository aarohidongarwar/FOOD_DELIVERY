import { motion } from 'framer-motion';
import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <motion.div 
        className="splash-content"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.175, 0.885, 0.32, 1.275] // nice spring-like easing
        }}
      >
        <motion.div 
          className="splash-logo-icon"
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ 
            duration: 1.5, 
            delay: 0.8,
            ease: "easeInOut"
          }}
        >
          🍕
        </motion.div>
        <motion.h1 
          className="splash-title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          QuickBite
        </motion.h1>
        <motion.p
          className="splash-subtitle"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Delivering happiness...
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="splash-loader"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
    </div>
  );
}
