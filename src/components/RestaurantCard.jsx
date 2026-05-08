import { Link } from 'react-router-dom';
import { Star, Clock, Bike } from 'lucide-react';
import { motion } from 'framer-motion';
import './RestaurantCard.css';

export default function RestaurantCard({ restaurant, index = 0 }) {
  const { id, name, cuisine_type, rating, total_ratings, delivery_time, delivery_fee, image_url, is_grocery } = restaurant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link to={`/restaurant/${id}`} className="restaurant-card" id={`restaurant-${id}`}>
        <div className="rc-image-wrap">
          <img
            src={image_url || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop`}
            alt={name}
            className="rc-image"
            loading="lazy"
          />
          <div className="rc-image-overlay">
            <span className="rc-delivery-badge">
              <Bike size={13} />
              ₹{delivery_fee || 29}
            </span>
          </div>
          {is_grocery ? <span className="rc-grocery-badge">Grocery</span> : null}
        </div>

        <div className="rc-body">
          <div className="rc-header">
            <h3 className="rc-name">{name}</h3>
            {rating > 0 && (
              <div className="star-rating">
                <Star size={12} fill="white" />
                {rating.toFixed(1)}
              </div>
            )}
          </div>

          <p className="rc-cuisine">{cuisine_type || 'Multi Cuisine'}</p>

          <div className="rc-meta">
            <span className="rc-meta-item">
              <Clock size={14} />
              {delivery_time || '30-40 min'}
            </span>
            {total_ratings > 0 && (
              <span className="rc-meta-item rc-ratings">{total_ratings} ratings</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="restaurant-card skeleton-card">
      <div className="rc-image-wrap skeleton" style={{ height: 180 }} />
      <div className="rc-body">
        <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 14, width: '40%' }} />
      </div>
    </div>
  );
}
