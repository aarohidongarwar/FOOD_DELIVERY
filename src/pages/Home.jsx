import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, TrendingUp, ShoppingCart, Apple, Milk, Beef, Carrot, Bath } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RestaurantCard, RestaurantCardSkeleton } from '../components';
import useRestaurantStore from '../stores/restaurantStore';
import useLocationStore from '../stores/locationStore';
import './Home.css';

export default function Home() {
  const { restaurants, fetchRestaurants, loading, cuisines, fetchCuisines } = useRestaurantStore();
  const { userLocation, setShowLocationPopup } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('food');
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

  const bannerGroceries = [
    { id: 1, img: '/images/grocery/WhatsApp_Image_2026-06-11_at_3.57.38_PM-removebg-preview.png', name: 'Daily Dairy' },
    { id: 2, img: '/images/grocery/WhatsApp_Image_2026-06-11_at_4.03.35_PM-removebg-preview.png', name: 'Bakery Items' }
  ];

  const [currentFoodIndex, setCurrentFoodIndex] = useState(0);
  const [currentGroceryIndex, setCurrentGroceryIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFoodIndex((prev) => (prev + 1) % bannerFoods.length);
      setCurrentGroceryIndex((prev) => (prev + 1) % bannerGroceries.length);
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

  // Grocery categories grouped Instamart-style
  const grocerySections = [
    {
      title: 'Fresh Items',
      items: [
        { name: 'Fresh Vegetables', icon: '🥬', bg: '#e8f5e9' },
        { name: 'Fresh Fruits', icon: '🍎', bg: '#fce4ec' },
        { name: 'Dairy, Bread & Eggs', icon: '🥛', bg: '#e3f2fd' },
        { name: 'Meat & Seafood', icon: '🥩', bg: '#ffebee' },
      ]
    },
    {
      title: 'Grocery & Kitchen',
      items: [
        { name: 'Atta, Rice & Dal', icon: '🌾', bg: '#fff8e1' },
        { name: 'Masalas & Spices', icon: '🫙', bg: '#fff3e0' },
        { name: 'Oils & Ghee', icon: '🫒', bg: '#f1f8e9' },
        { name: 'Cereals & Breakfast', icon: '🥣', bg: '#fce4ec' },
      ]
    },
    {
      title: 'Snacks & Drinks',
      items: [
        { name: 'Cold Drinks & Juices', icon: '🥤', bg: '#e3f2fd' },
        { name: 'Ice Creams', icon: '🍨', bg: '#fce4ec' },
        { name: 'Chips & Namkeens', icon: '🍿', bg: '#fff8e1' },
        { name: 'Chocolates & Sweets', icon: '🍫', bg: '#efebe9' },
      ]
    },
    {
      title: 'Household & Personal Care',
      items: [
        { name: 'Cleaning Essentials', icon: '🧹', bg: '#e8eaf6' },
        { name: 'Personal Care', icon: '🧴', bg: '#f3e5f5' },
        { name: 'Baby Care', icon: '🍼', bg: '#e0f7fa' },
        { name: 'Pet Care', icon: '🐾', bg: '#fff3e0' },
      ]
    }
  ];

  return (
    <div className="home-page">
      {activeTab === 'food' ? (
        <>
          {/* Hero Section */}
          <section className="hero-section">
            {/* Category Tabs - inside hero */}
            <div className="cat-bar-strip">
              <div className="cat-bar-inner">
                <button
                  className={`cat-pill ${activeTab === 'food' ? 'active' : ''}`}
                  onClick={() => setActiveTab('food')}
                >
                  <span className="cat-pill-icon">🍔</span>
                  <span className="cat-pill-label">Food</span>
                </button>
                <button
                  className={`cat-pill ${activeTab === 'grocery' ? 'active' : ''}`}
                  onClick={() => setActiveTab('grocery')}
                >
                  <span className="cat-pill-icon">🛒</span>
                  <span className="cat-pill-label">Grocery</span>
                </button>
              </div>
            </div>

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
                      placeholder="Search for restaurant or a dish"
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
            ) : restaurants.filter(r => !r.is_grocery).length > 0 ? (
              <div className="restaurants-grid">
                {restaurants.filter(r => !r.is_grocery).map((restaurant, i) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
                ))}
              </div>
            ) : (
              <div className="no-restaurants">
                <p>No restaurants found in this area yet.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Grocery Hero */}
          <section className="grocery-hero-section">
            {/* Category Tabs - inside grocery hero */}
            <div className="cat-bar-strip">
              <div className="cat-bar-inner">
                <button
                  className={`cat-pill ${activeTab === 'food' ? 'active' : ''}`}
                  onClick={() => setActiveTab('food')}
                >
                  <span className="cat-pill-icon">🍔</span>
                  <span className="cat-pill-label">Food</span>
                </button>
                <button
                  className={`cat-pill ${activeTab === 'grocery' ? 'active' : ''}`}
                  onClick={() => setActiveTab('grocery')}
                >
                  <span className="cat-pill-icon">🛒</span>
                  <span className="cat-pill-label">Grocery</span>
                </button>
              </div>
            </div>

            <div className="container">
              <motion.div
                className="grocery-hero-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grocery-hero-text">
                  <h1>Grocery & Essentials</h1>
                  <p>Get fresh fruits, vegetables, dairy and daily needs delivered to your doorstep in minutes.</p>
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
                        placeholder="Search for groceries, fruits, snacks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-search">
                      Search
                    </button>
                  </motion.form>
                </div>
                <div className="grocery-hero-visual" style={{ position: 'relative' }}>
                  <div className="food-glow-ring food-glow-ring-1" style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', border: '2px dashed rgba(74, 222, 128, 0.4)' }}></div>
                  <div className="food-glow-ring food-glow-ring-2" style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', border: '2px dashed rgba(74, 222, 128, 0.3)' }}></div>
                  <div className="food-glow-ring food-glow-ring-3" style={{ border: '2px dotted rgba(74, 222, 128, 0.5)' }}></div>

                  <span className="food-particle food-particle-1">🥑</span>
                  <span className="food-particle food-particle-2">🍎</span>
                  <span className="food-particle food-particle-3">🥕</span>
                  <span className="food-particle food-particle-4">🍞</span>
                  <span className="food-particle food-particle-5">🥛</span>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentGroceryIndex}
                      className="hero-food-item"
                      initial={{
                        opacity: 0,
                        scale: 0.5,
                        rotate: currentGroceryIndex % 2 === 0 ? -45 : 45,
                        x: currentGroceryIndex % 4 === 0 ? -200 : currentGroceryIndex % 4 === 1 ? 200 : 0,
                        y: currentGroceryIndex % 4 === 2 ? -200 : currentGroceryIndex % 4 === 3 ? 200 : 0
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
                        rotate: currentGroceryIndex % 2 === 0 ? 45 : -45,
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
                        src={bannerGroceries[currentGroceryIndex].img}
                        alt={bannerGroceries[currentGroceryIndex].name}
                        className="hero-food-img"
                        style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))' }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Instamart-style Category Sections */}
          <div className="grocery-instamart container">
            {grocerySections.map((section, si) => (
              <motion.section
                key={section.title}
                className="gim-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.1 }}
              >
                <h3 className="gim-section-title">{section.title}</h3>
                <div className="gim-grid">
                  {section.items.map((item, i) => (
                    <motion.div
                      key={item.name}
                      className="gim-card"
                      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/restaurants?cuisine=${encodeURIComponent(item.name)}&is_grocery=true`)}
                    >
                      <div className="gim-card-icon" style={{ background: item.bg }}>
                        <span>{item.icon}</span>
                      </div>
                      <span className="gim-card-label">{item.name}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Grocery Stores */}
          <section className="restaurants-section container">
            <div className="section-header">
              <div className="sh-title">
                <h2>Grocery stores near {userLocation?.city || 'you'}</h2>
              </div>
            </div>

            {loading ? (
              <div className="restaurants-grid">
                {Array(8).fill(0).map((_, i) => <RestaurantCardSkeleton key={i} />)}
              </div>
            ) : restaurants.filter(r => r.is_grocery).length > 0 ? (
              <div className="restaurants-grid">
                {restaurants.filter(r => r.is_grocery).map((restaurant, i) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
                ))}
              </div>
            ) : (
              <div className="no-restaurants">
                <p>No grocery stores found in this area yet.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
