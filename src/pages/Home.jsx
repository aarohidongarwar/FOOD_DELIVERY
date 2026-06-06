import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantCard, RestaurantCardSkeleton } from '../components';
import useRestaurantStore from '../stores/restaurantStore';
import useLocationStore from '../stores/locationStore';
import './Home.css';

export default function Home() {
  const { restaurants, fetchRestaurants, loading, cuisines, fetchCuisines } = useRestaurantStore();
  const { userLocation, setShowLocationPopup } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    fetchCuisines();
  }, [fetchRestaurants, fetchCuisines]);

  const [showAllMindItems, setShowAllMindItems] = useState(false);

  // Fallback items for "What's on your mind?" if API hasn't loaded yet
  const defaultMindItems = [
    { name: 'Biryani', img: '/images/dishes/biryani.png' },
    { name: 'Dosa', img: '/images/dishes/dosa.png' },
    { name: 'Momos', img: '/images/dishes/momos.png' },
    { name: 'Pav Bhaji', img: '/images/dishes/pavbhaji.png' },
    { name: 'Pani Puri', img: '/images/dishes/pani puri.png' },
    { name: 'Aloo Tikki', img: '/images/dishes/aloo tikki.jpeg' },
    { name: 'Indian Burger', img: '/images/dishes/burger indian style.png' },
    { name: 'Butter Chicken', img: '/images/dishes/butter chiken.jpeg' },
    { name: 'Chaat', img: '/images/dishes/chaat.jpeg' },
    { name: 'Chicken Tikka', img: '/images/dishes/chicken tikka.jpeg' },
    { name: 'Chole Bhature', img: '/images/dishes/chole bature.jpeg' },
    { name: 'Dal Makhani', img: '/images/dishes/dal makhani.jpeg' },
    { name: 'Dhokla', img: '/images/dishes/dhokla.jpeg' },
    { name: 'Gulab Jamun', img: '/images/dishes/gulab jamun.jpeg' },
    { name: 'Hyderabadi Biryani', img: '/images/dishes/hyderabadi biryani.jpeg' },
    { name: 'Idli', img: '/images/dishes/idli.jpeg' },
    { name: 'Jalebi', img: '/images/dishes/jalebi.jpeg' },
    { name: 'Kachori', img: '/images/dishes/kachori.jpeg' },
    { name: 'Kadhi Chawal', img: '/images/dishes/kadhi chawal.jpeg' },
    { name: 'Kaju Katli', img: '/images/dishes/kajukatli-removebg-preview.png' },
    { name: 'Kathi Roll', img: '/images/dishes/kathi roll.jpeg' },
    { name: 'Kulcha', img: '/images/dishes/kulcha.jpeg' },
    { name: 'Lassi', img: '/images/dishes/lassi.jpeg' },
    { name: 'Malai Kofta', img: '/images/dishes/malai kofta.jpeg' },
    { name: 'Masala Chai', img: '/images/dishes/masala chai.jpeg' },
    { name: 'Medu Vada', img: '/images/dishes/medu vada.jpeg' },
    { name: 'Misal Pav', img: '/images/dishes/misal pav.jpeg' },
    { name: 'Palak Paneer', img: '/images/dishes/palak paneer.jpeg' },
    { name: 'Paneer Tikka', img: '/images/dishes/paneer tikka.jpeg' },
    { name: 'Paratha', img: '/images/dishes/parathe.jpeg' },
    { name: 'Indian Pizza', img: '/images/dishes/pizza indian style.png' },
    { name: 'Poha', img: '/images/dishes/poha.jpeg' },
    { name: 'Rajma Chawal', img: '/images/dishes/rajma chawal.jpeg' },
    { name: 'Rasgulla', img: '/images/dishes/rasgulla.jpeg' },
    { name: 'Rasmalai', img: '/images/dishes/rasmalai.jpeg' },
    { name: 'Samosa', img: '/images/dishes/samosa.jpeg' },
    { name: 'Sabudana Khichdi', img: '/images/dishes/shabudana khichadi.jpeg' },
    { name: 'Shahi Tukda', img: '/images/dishes/shahi tukda.jpeg' },
    { name: 'Tandoori Chicken', img: '/images/dishes/tanduri chicken.jpeg' },
    { name: 'Uttapam', img: '/images/dishes/uttapam.jpeg' }
  ];

  const bannerFoods = [
    { id: 1, img: '/images/dishes/pizza.1-removebg-preview.png', name: 'Premium Pizza' },
    { id: 2, img: '/images/dishes/burger_king-removebg-preview.png', name: 'Classic Burger' },
    { id: 3, img: '/images/dishes/momos.1-removebg-preview.png', name: 'Steamed Momos' },
    { id: 4, img: '/images/dishes/fries-removebg-preview.png', name: 'Crispy Fries' },
    { id: 5, img: '/images/dishes/cold_coffee-removebg-preview.png', name: 'Cold Coffee' },
    { id: 6, img: '/images/dishes/poha.1-removebg-preview.png', name: 'Indori Poha' },
    { id: 7, img: '/images/dishes/maggie-removebg-preview.png', name: 'Masala Maggi' },
    { id: 8, img: '/images/dishes/pastry-removebg-preview.png', name: 'Choco Pastry' },
    { id: 9, img: '/images/dishes/leg_peace-removebg-preview.png', name: 'Chicken Leg' },
    { id: 10, img: '/images/dishes/paneer.1-removebg-preview.png', name: 'Paneer Tikka' },
    { id: 11, img: '/images/dishes/rasgulla.1-removebg-preview.png', name: 'Soft Rasgulla' },
    { id: 12, img: '/images/dishes/parathe.1-removebg-preview.png', name: 'Aloo Paratha' }
  ];

  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFoodIndex((prev) => (prev + 1) % bannerFoods.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleMindItemClick = (name) => {
    navigate(`/restaurants?cuisine=${encodeURIComponent(name)}`);
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
              transition={{ duration: 0.6 }}
            >
              Hungry? You're in the right place
            </motion.h1>
            <motion.p 
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Order food from favourite restaurants near you.
            </motion.p>
            
            <motion.form 
              className="hero-search-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSearch}
            >
              <div className="location-pin" onClick={() => setShowLocationPopup(true)} style={{ cursor: 'pointer' }}>
                <MapPin size={20} className="text-primary" />
                <span>{userLocation?.city || userLocation?.label || 'Set Location'}</span>
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
              <button type="submit" className="btn btn-primary btn-search">
                Search
              </button>
            </motion.form>

            <motion.div 
              className="hero-trends"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#666' }}
            >
              <TrendingUp size={16} />
              <span>Trending: </span>
              {['Pizza', 'Burger', 'Biryani', 'Thali'].map(tag => (
                <button 
                  key={tag} 
                  type="button" 
                  onClick={() => setSearchQuery(tag)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </div>

          <div className="hero-food-showcase">
            <div className="food-glow-ring food-glow-ring-1"></div>
            <div className="food-glow-ring food-glow-ring-2"></div>
            <div className="food-glow-ring food-glow-ring-3"></div>

            <span className="food-particle food-particle-1">🔥</span>
            <span className="food-particle food-particle-2">✨</span>
            <span className="food-particle food-particle-3">⭐</span>
            <span className="food-particle food-particle-4">❤️</span>
            <span className="food-particle food-particle-5">📍</span>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentFoodIndex}
                className="hero-food-item"
                initial={{ 
                  opacity: 0, 
                  scale: 0.5,
                  rotate: currentFoodIndex % 2 === 0 ? -45 : 45,
                  x: currentFoodIndex % 4 === 0 ? -200 : currentFoodIndex % 4 === 1 ? 200 : 0,
                  y: currentFoodIndex % 4 === 2 ? -200 : currentFoodIndex % 4 === 3 ? 200 : 0
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  rotate: 0,
                  x: 0,
                  y: 0
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 1.2,
                  rotate: currentFoodIndex % 2 === 0 ? 45 : -45,
                  filter: 'blur(10px)'
                }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 12,
                  duration: 0.8
                }}
              >
                <img 
                  src={bannerFoods[currentFoodIndex].img} 
                  alt={bannerFoods[currentFoodIndex].name} 
                  className="hero-food-img"
                />
                <div className="hero-food-label">
                  {bannerFoods[currentFoodIndex].name} • Nearby
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* What's on your mind? */}
      <section className="mind-section container">
        <div className="section-header">
          <div className="sh-title">
            <h2>What's on your mind?</h2>
          </div>
          <button className="view-all-btn" onClick={() => setShowAllMindItems(!showAllMindItems)} style={{ color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', background: 'none', border: 'none' }}>
            {showAllMindItems ? 'Show Less' : 'View All'}
          </button>
        </div>
        
        <div className={showAllMindItems ? "mind-grid" : "mind-carousel"}>
          {defaultMindItems.slice(0, showAllMindItems ? 40 : 8).map((item, index) => {
            return (
              <motion.div 
                key={index}
                className="mind-card"
                whileHover={{ y: -5 }}
                onClick={() => handleMindItemClick(item.name)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="mind-icon">
                  <img src={item.img} alt={item.name} className="mind-img" />
                </div>
                <span>{item.name}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Top Restaurants */}
      <section className="restaurants-section container">
        <div className="section-header">
          <div className="sh-title">
            <h2>Top restaurants in {userLocation?.city || 'Your Area'}</h2>
          </div>
        </div>
        
        {loading ? (
          <div className="restaurants-grid">
            {Array(8).fill(0).map((_, i) => <RestaurantCardSkeleton key={i} />)}
          </div>
        ) : restaurants.length > 0 ? (
          <div className="restaurants-grid">
            {restaurants.map((restaurant, i) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
            ))}
          </div>
        ) : (
          <div className="no-restaurants">
            <p>No restaurants found in this area yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
