import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { RestaurantCard, RestaurantCardSkeleton } from '../components';
import useRestaurantStore from '../stores/restaurantStore';
import './Home.css';

export default function Home() {
  const { restaurants, fetchRestaurants, loading, cuisines, fetchCuisines } = useRestaurantStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    fetchCuisines();
  }, [fetchRestaurants, fetchCuisines]);

  const mindItems = [
    { name: 'Pizza', image: '/assets/cuisines/pizza.png', search: 'Pizza' },
    { name: 'Burger', image: '/assets/cuisines/burger.png', search: 'Burger' },
    { name: 'Biryani', image: '/assets/cuisines/biryani.png', search: 'Biryani' },
    { name: 'Dosa', image: '/assets/cuisines/dosa.png', search: 'Dosa' },
    { name: 'Noodles', image: '/assets/cuisines/noodles.png', search: 'Noodles' },
    { name: 'Cake', image: '/assets/cuisines/cake.png', search: 'Cake' },
    { name: 'Momos', image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=240&h=240&fit=crop&q=80', search: 'Momos' },
    { name: 'Thali', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=240&h=240&fit=crop&q=80', search: 'Thali' },
    { name: 'Rolls', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=240&h=240&fit=crop&q=80', search: 'Roll' },
    { name: 'Cold Drink', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=240&h=240&fit=crop&q=80', search: 'Drink' },
    { name: 'Sandwich', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=240&h=240&fit=crop&q=80', search: 'Sandwich' },
    { name: 'Pasta', image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=240&h=240&fit=crop&q=80', search: 'Pasta' },
    { name: 'Paratha', image: 'https://images.unsplash.com/photo-1626132646501-447481d114a4?w=240&h=240&fit=crop&q=80', search: 'Paratha' },
    { name: 'Coffee', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=240&h=240&fit=crop&q=80', search: 'Coffee' },
    { name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=240&h=240&fit=crop&q=80', search: 'Salad' },
    { name: 'Ice Cream', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=240&h=240&fit=crop&q=80', search: 'Ice Cream' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCuisineImage = (cuisine) => {
    const images = {
      'North Indian': '/assets/cuisines/biryani.png',
      'Italian': '/assets/cuisines/pizza.png',
      'South Indian': '/assets/cuisines/dosa.png',
      'Chinese': '/assets/cuisines/noodles.png',
      'Fast Food': '/assets/cuisines/burger.png',
      'Desserts': '/assets/cuisines/cake.png',
      'Beverages': '☕', // Fallback to emoji if no image
      'Grocery': '🛒'
    };
    return images[cuisine] || '🍽️';
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Hungry? You're in the right place
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="hero-subtitle"
            >
              Order food from favourite restaurants near you.
            </motion.p>
            
            <motion.form 
              className="hero-search-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSearch}
            >
              <div className="location-pin">
                <MapPin size={20} className="text-primary" />
                <span>Mumbai</span>
              </div>
              <div className="search-divider" />
              <div className="search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search for restaurant, cuisine or a dish" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-search">Search</button>
            </motion.form>
          </div>
          
          <motion.div 
            className="hero-image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" alt="Delicious Food" />
          </motion.div>
        </div>
      </section>

      {/* What's on your mind? */}
      <section className="mind-section container">
        <div className="section-header">
          <h2>What's on your mind?</h2>
        </div>
        <div className="mind-carousel">
          {mindItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link to={`/restaurants?search=${encodeURIComponent(item.search)}`} className="mind-card">
                <div className="mind-icon">
                  <img src={item.image} alt={item.name} className="mind-img" />
                </div>
                <span>{item.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Cuisines Categories - Keep as a secondary filter if needed, or remove if redundant */}
      {cuisines.length > 0 && (
        <section className="cuisines-section container">
          <div className="section-header">
            <h2>Eat what makes you happy</h2>
          </div>
          <div className="cuisines-carousel">
            {cuisines.map((cuisine, i) => (
              <motion.div
                key={cuisine}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link to={`/restaurants?cuisine=${cuisine}`} className="cuisine-card">
                  <div className="cuisine-icon">
                    {getCuisineImage(cuisine).startsWith('/') || getCuisineImage(cuisine).startsWith('http') ? (
                      <img src={getCuisineImage(cuisine)} alt={cuisine} className="cuisine-img" />
                    ) : (
                      getCuisineImage(cuisine)
                    )}
                  </div>
                  <span>{cuisine}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Restaurants */}
      <section className="featured-section container">
        <div className="section-header">
          <div className="sh-title">
            <TrendingUp size={24} className="text-primary" />
            <h2>Top restaurant chains in Mumbai</h2>
          </div>
          <Link to="/restaurants" className="btn btn-ghost btn-sm">
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="restaurants-grid">
          {loading ? (
            Array(4).fill(0).map((_, i) => <RestaurantCardSkeleton key={i} />)
          ) : (
            restaurants.slice(0, 8).map((restaurant, i) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
            ))
          )}
        </div>
      </section>

      {/* App Promo */}
      <section className="app-promo">
        <div className="container promo-container">
          <div className="promo-image">
            <img src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=500&q=80" alt="Mobile App" />
          </div>
          <div className="promo-content">
            <h2>Restaurants in your pocket</h2>
            <p>Order from your favorite restaurants & track on the go, with the all-new QuickBite app.</p>
            <div className="app-badges">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="app-badge" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="app-badge" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
