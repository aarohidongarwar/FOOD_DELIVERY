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

  const [showAllMindItems, setShowAllMindItems] = useState(false);

  const mindItems = [
    { name: 'Biryani', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop&q=80', search: 'Biryani' },
    { name: 'Chole Bhature', image: 'https://images.unsplash.com/photo-1626132646501-447481d114a4?w=400&h=400&fit=crop&q=80', search: 'Chole Bhature' },
    { name: 'Pani Puri', image: 'https://images.unsplash.com/photo-1601050690597-df056fb1779f?w=400&h=400&fit=crop&q=80', search: 'Pani Puri' },
    { name: 'Pav Bhaji', image: 'https://images.unsplash.com/photo-1606491956689-2ea8c5383c82?w=400&h=400&fit=crop&q=80', search: 'Pav Bhaji' },
    { name: 'Dosa', image: 'https://images.unsplash.com/photo-1630383249896-424e482df771?w=400&h=400&fit=crop&q=80', search: 'Dosa' },
    { name: 'Samosa', image: 'https://images.unsplash.com/photo-1626331334714-39c1f331f885?w=400&h=400&fit=crop&q=80', search: 'Samosa' },
    { name: 'Vada Pav', image: 'https://images.unsplash.com/photo-1632778149975-40046a7a8d71?w=400&h=400&fit=crop&q=80', search: 'Vada Pav' },
    { name: 'Momos', image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&h=400&fit=crop&q=80', search: 'Momos' },
    { name: 'Burger', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop&q=80', search: 'Burger' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop&q=80', search: 'Pizza' },
    { name: 'Paneer Tikka', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop&q=80', search: 'Paneer Tikka' },
    { name: 'Dal Makhani', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop&q=80', search: 'Dal Makhani' },
    { name: 'Gulab Jamun', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=400&fit=crop&q=80', search: 'Gulab Jamun' },
    { name: 'Jalebi', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=400&fit=crop&q=80', search: 'Jalebi' },
    { name: 'Kathi Roll', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop&q=80', search: 'Roll' },
    { name: 'Idli', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=400&fit=crop&q=80', search: 'Idli' },
    { name: 'Paratha', image: 'https://images.unsplash.com/photo-1628106278729-82bc5dace89a?w=400&h=400&fit=crop&q=80', search: 'Paratha' },
    { name: 'Dhokla', image: 'https://images.unsplash.com/photo-1626132646529-543343d6668a?w=400&h=400&fit=crop&q=80', search: 'Dhokla' },
    { name: 'Kachori', image: 'https://images.unsplash.com/photo-1626331334714-39c1f331f885?w=400&h=400&fit=crop&q=80', search: 'Kachori' },
    { name: 'Poha', image: 'https://images.unsplash.com/photo-1626132646529-543343d6668a?w=400&h=400&fit=crop&q=80', search: 'Poha' },
    { name: 'Aloo Tikki', image: 'https://images.unsplash.com/photo-1601050690597-df056fb1779f?w=400&h=400&fit=crop&q=80', search: 'Aloo Tikki' },
    { name: 'Chaat', image: 'https://images.unsplash.com/photo-1601050690597-df056fb1779f?w=400&h=400&fit=crop&q=80', search: 'Chaat' },
    { name: 'Rasgulla', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=400&fit=crop&q=80', search: 'Rasgulla' },
    { name: 'Lassi', image: 'https://images.unsplash.com/photo-1596797038558-bc43ffb19e07?w=400&h=400&fit=crop&q=80', search: 'Lassi' },
    { name: 'Masala Chai', image: 'https://images.unsplash.com/photo-1591924106207-323ff10189af?w=400&h=400&fit=crop&q=80', search: 'Chai' },
    { name: 'Kulcha', image: 'https://images.unsplash.com/photo-1533777324545-e016795228c1?w=400&h=400&fit=crop&q=80', search: 'Kulcha' },
    { name: 'Tandoori Chicken', image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&h=400&fit=crop&q=80', search: 'Tandoori' },
    { name: 'Butter Chicken', image: 'https://images.unsplash.com/photo-1603894584713-f480766a4607?w=400&h=400&fit=crop&q=80', search: 'Butter Chicken' },
    { name: 'Misal Pav', image: 'https://images.unsplash.com/photo-1606491956689-2ea8c5383c82?w=400&h=400&fit=crop&q=80', search: 'Misal Pav' },
    { name: 'Sabudana Khichdi', image: 'https://images.unsplash.com/photo-1626132646529-543343d6668a?w=400&h=400&fit=crop&q=80', search: 'Khichdi' },
    { name: 'Medu Vada', image: 'https://images.unsplash.com/photo-1628106278729-82bc5dace89a?w=400&h=400&fit=crop&q=80', search: 'Medu Vada' },
    { name: 'Uttapam', image: 'https://images.unsplash.com/photo-1628106278729-82bc5dace89a?w=400&h=400&fit=crop&q=80', search: 'Uttapam' },
    { name: 'Rajma Chawal', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop&q=80', search: 'Rajma' },
    { name: 'Kadhi Chawal', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop&q=80', search: 'Kadhi' },
    { name: 'Chicken Tikka', image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=400&h=400&fit=crop&q=80', search: 'Chicken Tikka' },
    { name: 'Hyderabadi Biryani', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=400&fit=crop&q=80', search: 'Biryani' },
    { name: 'Malai Kofta', image: 'https://images.unsplash.com/photo-1603894584713-f480766a4607?w=400&h=400&fit=crop&q=80', search: 'Malai Kofta' },
    { name: 'Palak Paneer', image: 'https://images.unsplash.com/photo-1601050690597-df056fb1779f?w=400&h=400&fit=crop&q=80', search: 'Palak Paneer' },
    { name: 'Rasmalai', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=400&fit=crop&q=80', search: 'Rasmalai' },
    { name: 'Kheer', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&h=400&fit=crop&q=80', search: 'Kheer' },
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
