import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantCard, RestaurantCardSkeleton, LocationPopup } from '../components';
import useRestaurantStore from '../stores/restaurantStore';
import './Home.css';

export default function Home() {
  const { restaurants, fetchRestaurants, loading, cuisines, fetchCuisines } = useRestaurantStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(() => {
    const saved = localStorage.getItem('quickbite_user_location');
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRestaurants();
    fetchCuisines();
  }, [fetchRestaurants, fetchCuisines]);

  const [showAllMindItems, setShowAllMindItems] = useState(false);

  // Animated food banner images
  const bannerFoods = [
    { src: '/images/dishes/pizza.1-removebg-preview.png', alt: 'Pizza' },
    { src: '/images/dishes/burger_king-removebg-preview.png', alt: 'Burger' },
    { src: '/images/dishes/momos.1-removebg-preview.png', alt: 'Momos' },
    { src: '/images/dishes/cold_coffee-removebg-preview.png', alt: 'Cold Coffee' },
    { src: '/images/dishes/paneer.1-removebg-preview.png', alt: 'Paneer' },
    { src: '/images/dishes/pastry-removebg-preview.png', alt: 'Pastry' },
    { src: '/images/dishes/leg_peace-removebg-preview.png', alt: 'Chicken' },
    { src: '/images/dishes/rasgulla.1-removebg-preview.png', alt: 'Rasgulla' },
    { src: '/images/dishes/parathe.1-removebg-preview.png', alt: 'Paratha' },
    { src: '/images/dishes/poha.1-removebg-preview.png', alt: 'Poha' },
    { src: '/images/dishes/maggie-removebg-preview.png', alt: 'Maggie' },
    { src: '/images/dishes/kajukatli-removebg-preview.png', alt: 'Kaju Katli' },
  ];

  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const [animDirection, setAnimDirection] = useState(0);

  // Different entry/exit directions for variety
  const directions = [
    { enter: { x: 300, y: -200, rotate: 45, scale: 0.2 }, exit: { x: -300, y: 200, rotate: -60, scale: 0.1 } },
    { enter: { x: -300, y: 200, rotate: -30, scale: 0.2 }, exit: { x: 300, y: -150, rotate: 45, scale: 0.1 } },
    { enter: { x: 0, y: -400, rotate: 180, scale: 0.1 }, exit: { x: 0, y: 400, rotate: -180, scale: 0.1 } },
    { enter: { x: 400, y: 0, rotate: -90, scale: 0.3 }, exit: { x: -400, y: 0, rotate: 90, scale: 0.1 } },
    { enter: { x: -250, y: -250, rotate: 60, scale: 0.1 }, exit: { x: 250, y: 250, rotate: -120, scale: 0.2 } },
    { enter: { x: 300, y: 300, rotate: -45, scale: 0.2 }, exit: { x: -200, y: -300, rotate: 90, scale: 0.1 } },
  ];

  const cycleFood = useCallback(() => {
    setAnimDirection(Math.floor(Math.random() * directions.length));
    setCurrentFoodIndex((prev) => (prev + 1) % bannerFoods.length);
  }, [bannerFoods.length, directions.length]);

  useEffect(() => {
    const interval = setInterval(cycleFood, 2200);
    return () => clearInterval(interval);
  }, [cycleFood]);

  const currentDir = directions[animDirection];

  const mindItems = [
    { name: 'Aloo Tikki', image: '/images/dishes/aloo tikki.jpeg', search: 'Aloo Tikki' },
    { name: 'Biryani', image: '/images/dishes/biryani.png', search: 'Biryani' },
    { name: 'Burger', image: '/images/dishes/burger indian style.png', search: 'Burger' },
    { name: 'Butter Chicken', image: '/images/dishes/butter chiken.jpeg', search: 'Butter Chicken' },
    { name: 'Chaat', image: '/images/dishes/chaat.jpeg', search: 'Chaat' },
    { name: 'Chicken Tikka', image: '/images/dishes/chicken tikka.jpeg', search: 'Chicken Tikka' },
    { name: 'Chole Bhature', image: '/images/dishes/chole bature.jpeg', search: 'Chole Bhature' },
    { name: 'Dal Makhani', image: '/images/dishes/dal makhani.jpeg', search: 'Dal Makhani' },
    { name: 'Dhokla', image: '/images/dishes/dhokla.jpeg', search: 'Dhokla' },
    { name: 'Dosa', image: '/images/dishes/dosa.png', search: 'Dosa' },
    { name: 'Gulab Jamun', image: '/images/dishes/gulab jamun.jpeg', search: 'Gulab Jamun' },
    { name: 'Hyderabadi Biryani', image: '/images/dishes/hyderabadi biryani.jpeg', search: 'Biryani' },
    { name: 'Idli', image: '/images/dishes/idli.jpeg', search: 'Idli' },
    { name: 'Jalebi', image: '/images/dishes/jalebi.jpeg', search: 'Jalebi' },
    { name: 'Kachori', image: '/images/dishes/kachori.jpeg', search: 'Kachori' },
    { name: 'Kadhi Chawal', image: '/images/dishes/kadhi chawal.jpeg', search: 'Kadhi' },
    { name: 'Kathi Roll', image: '/images/dishes/kathi roll.jpeg', search: 'Roll' },
    { name: 'Kulcha', image: '/images/dishes/kulcha.jpeg', search: 'Kulcha' },
    { name: 'Lassi', image: '/images/dishes/lassi.jpeg', search: 'Lassi' },
    { name: 'Malai Kofta', image: '/images/dishes/malai kofta.jpeg', search: 'Malai Kofta' },
    { name: 'Masala Chai', image: '/images/dishes/masala chai.jpeg', search: 'Chai' },
    { name: 'Medu Vada', image: '/images/dishes/medu vada.jpeg', search: 'Medu Vada' },
    { name: 'Misal Pav', image: '/images/dishes/misal pav.jpeg', search: 'Misal Pav' },
    { name: 'Momos', image: '/images/dishes/momos.png', search: 'Momos' },
    { name: 'Palak Paneer', image: '/images/dishes/palak paneer.jpeg', search: 'Palak Paneer' },
    { name: 'Paneer Tikka', image: '/images/dishes/paneer tikka.jpeg', search: 'Paneer Tikka' },
    { name: 'Pani Puri', image: '/images/dishes/pani puri.png', search: 'Pani Puri' },
    { name: 'Paratha', image: '/images/dishes/parathe.jpeg', search: 'Paratha' },
    { name: 'Pav Bhaji', image: '/images/dishes/pavbhaji.png', search: 'Pav Bhaji' },
    { name: 'Pizza', image: '/images/dishes/pizza indian style.png', search: 'Pizza' },
    { name: 'Poha', image: '/images/dishes/poha.jpeg', search: 'Poha' },
    { name: 'Rajma Chawal', image: '/images/dishes/rajma chawal.jpeg', search: 'Rajma' },
    { name: 'Rasgulla', image: '/images/dishes/rasgulla.jpeg', search: 'Rasgulla' },
    { name: 'Rasmalai', image: '/images/dishes/rasmalai.jpeg', search: 'Rasmalai' },
    { name: 'Samosa', image: '/images/dishes/samosa.jpeg', search: 'Samosa' },
    { name: 'Sabudana Khichdi', image: '/images/dishes/shabudana khichadi.jpeg', search: 'Khichdi' },
    { name: 'Shahi Tukda', image: '/images/dishes/shahi tukda.jpeg', search: 'Shahi Tukda' },
    { name: 'Tandoori Chicken', image: '/images/dishes/tanduri chicken.jpeg', search: 'Tandoori' },
    { name: 'Uttapam', image: '/images/dishes/uttapam.jpeg', search: 'Uttapam' },
    { name: 'Vada Pav', image: '/images/dishes/vadapav.jpeg', search: 'Vada Pav' },
  ];







  const initialItemsCount = 10;
  const displayedItems = showAllMindItems ? mindItems : mindItems.slice(0, initialItemsCount);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCuisineImage = (cuisine) => {
    const images = {
      'North Indian': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=120&h=120&fit=crop',
      'Italian': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&h=120&fit=crop',
      'South Indian': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=120&h=120&fit=crop',
      'Chinese': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=120&h=120&fit=crop',
      'Fast Food': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop',
      'Desserts': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=120&h=120&fit=crop',
      'Beverages': 'https://images.unsplash.com/photo-1596797038558-bc43ffb19e07?w=120&h=120&fit=crop',
      'Street Food': 'https://images.unsplash.com/photo-1601050690597-df056fb1779f?w=120&h=120&fit=crop',
      'Grocery': '🛒'
    };
    return images[cuisine] || '🍽️';
  };

  return (
    <div className="home-page">
      {/* Location Permission Popup */}
      <LocationPopup onLocationGranted={(loc) => setUserLocation(loc)} />
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
                <span>{userLocation?.city || 'Set Location'}</span>
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
          <div className="hero-food-showcase">
            {/* Decorative glow rings */}
            <div className="food-glow-ring food-glow-ring-1"></div>
            <div className="food-glow-ring food-glow-ring-2"></div>
            <div className="food-glow-ring food-glow-ring-3"></div>
            
            {/* Tiny floating food particles */}
            <div className="food-particle food-particle-1">🍕</div>
            <div className="food-particle food-particle-2">🍔</div>
            <div className="food-particle food-particle-3">🧁</div>
            <div className="food-particle food-particle-4">🍜</div>
            <div className="food-particle food-particle-5">☕</div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentFoodIndex}
                className="hero-food-item"
                initial={{
                  opacity: 0,
                  x: currentDir.enter.x,
                  y: currentDir.enter.y,
                  rotate: currentDir.enter.rotate,
                  scale: currentDir.enter.scale,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  x: currentDir.exit.x,
                  y: currentDir.exit.y,
                  rotate: currentDir.exit.rotate,
                  scale: currentDir.exit.scale,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 120,
                  damping: 14,
                  mass: 0.8,
                }}
              >
                <motion.img
                  src={bannerFoods[currentFoodIndex].src}
                  alt={bannerFoods[currentFoodIndex].alt}
                  className="hero-food-img"
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <motion.span 
                  className="hero-food-label"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {bannerFoods[currentFoodIndex].alt}
                </motion.span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* What's on your mind? */}
      <section className="mind-section container">
        <div className="section-header">
          <h2>What's on your mind?</h2>
          {showAllMindItems && (
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAllMindItems(false)}
            >
              Show Less
            </button>
          )}
        </div>
        <div className={`mind-display ${showAllMindItems ? 'mind-grid' : 'mind-carousel'}`}>
          {displayedItems.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <Link to={`/restaurants?search=${encodeURIComponent(item.search)}`} className="mind-card">
                <div className="mind-icon">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="mind-img" 
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=240&h=240&fit=crop&q=80';
                    }}
                  />
                </div>
                <span>{item.name}</span>
              </Link>
            </motion.div>
          ))}
          
          {!showAllMindItems && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: initialItemsCount * 0.03 }}
            >
              <button className="mind-card view-all-card" onClick={() => setShowAllMindItems(true)}>
                <div className="mind-icon view-all-icon">
                  <ChevronRight size={32} />
                </div>
                <span>View All</span>
              </button>
            </motion.div>
          )}
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
