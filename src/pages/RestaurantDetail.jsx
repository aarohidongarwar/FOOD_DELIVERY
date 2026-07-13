import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Clock, Bike, MapPin, Search } from 'lucide-react';
import { MenuItemCard, LoadingSpinner } from '../components';
import useRestaurantStore from '../stores/restaurantStore';
import useCartStore from '../stores/cartStore';
import './RestaurantDetail.css';

export default function RestaurantDetail({ onCartClick }) {
  const { id } = useParams();
  const { currentRestaurant, fetchRestaurant, loading } = useRestaurantStore();
  const { carts, getTotal } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'reviews'
  
  const categoryRefs = useRef({});

  useEffect(() => {
    fetchRestaurant(id);
  }, [id, fetchRestaurant]);

  useEffect(() => {
    if (currentRestaurant?.menu) {
      const cats = Object.keys(currentRestaurant.menu);
      if (cats.length > 0 && !activeCategory) {
        setActiveCategory(cats[0]);
      }
    }
  }, [currentRestaurant, activeCategory]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      let currentCat = activeCategory;
      
      Object.entries(categoryRefs.current).forEach(([cat, ref]) => {
        if (ref && ref.offsetTop <= scrollPos) {
          currentCat = cat;
        }
      });
      
      if (currentCat !== activeCategory) {
        setActiveCategory(currentCat);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeCategory]);

  const scrollToCategory = (cat) => {
    const ref = categoryRefs.current[cat];
    if (ref) {
      window.scrollTo({
        top: ref.offsetTop - 120,
        behavior: 'smooth'
      });
      setActiveCategory(cat);
    }
  };

  if (loading || !currentRestaurant) return <LoadingSpinner fullScreen />;

  const { name, cuisine_type, rating, total_ratings, delivery_time, delivery_fee, address, image_url, menu, reviews = [] } = currentRestaurant;
  const numericRating = Number(rating) || 0;
  
  const filteredMenu = {};
  if (searchQuery) {
    Object.entries(menu).forEach(([cat, items]) => {
      const filtered = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (filtered.length > 0) filteredMenu[cat] = filtered;
    });
  } else {
    Object.assign(filteredMenu, menu);
  }

  const categories = Object.keys(menu);
  const cartType = currentRestaurant.is_grocery ? 'grocery' : 'food';
  const cartItems = carts[cartType].items;
  const cartRestaurantId = carts[cartType].restaurantId;
  const showCartBar = cartItems.length > 0 && cartRestaurantId === id;

  return (
    <div className="rd-page">
      {/* Banner */}
      <div className="rd-banner">
        <div className="container rd-banner-inner">
          <div className="rd-info">
            <h1 className="rd-name">{name}</h1>
            <p className="rd-cuisine">{cuisine_type || 'Multi Cuisine'}</p>
            <p className="rd-address"><MapPin size={14} /> {address}</p>
            
            <div className="rd-meta">
              {numericRating > 0 && (
                <div className="rd-rating">
                  <Star size={14} fill="white" />
                  <span>{numericRating.toFixed(1)}</span>
                  <span className="rd-rating-count">({total_ratings}+ ratings)</span>
                </div>
              )}
              <div className="rd-meta-divider" />
              <div className="rd-time">
                <Clock size={16} />
                <span>{delivery_time || '30-40 min'}</span>
              </div>
              <div className="rd-meta-divider" />
              <div className="rd-fee">
                <Bike size={16} />
                <span>₹{delivery_fee || 29} Delivery fee</span>
              </div>
            </div>
          </div>
          <div className="rd-image-container">
            {image_url && <img src={image_url} alt={name} className="rd-image" />}
          </div>
        </div>
      </div>

      <div className="rd-tabs-wrapper">
        <div className="container">
          <div className="rd-tabs">
            <button 
              className={`rd-tab ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              Menu
            </button>
            <button 
              className={`rd-tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({reviews.length})
            </button>
          </div>
        </div>
      </div>

      <div className="container rd-content">
        <div className="rd-layout">
          {activeTab === 'menu' ? (
            <div className="rd-main">
              <div className="rd-search-wrapper">
                <Search size={20} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search in menu..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {Object.keys(filteredMenu).length === 0 ? (
                <div className="rd-no-items">
                  <p>No items found matching your search.</p>
                </div>
              ) : (
                <div className="rd-menu-sections">
                  {Object.entries(filteredMenu).map(([category, items]) => (
                    <div 
                      key={category} 
                      className="rd-menu-section"
                      id={`category-${category}`}
                      ref={el => categoryRefs.current[category] = el}
                    >
                      <h3 className="rd-section-title">
                        {category} <span>({items.length})</span>
                      </h3>
                      <div className="rd-items-list">
                        {items.map(item => (
                          <MenuItemCard 
                            key={item.id} 
                            item={item} 
                            restaurantId={id}
                            restaurantName={name}
                            isGrocery={currentRestaurant.is_grocery}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rd-main rd-reviews-main">
              <div className="rd-reviews-summary">
                <div className="rd-rating-big">
                  <div className="rd-rating-val">{numericRating.toFixed(1)}</div>
                  <div className="rd-rating-stars">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} fill={s <= Math.round(numericRating) ? "var(--primary)" : "none"} stroke={s <= Math.round(numericRating) ? "var(--primary)" : "var(--text-muted)"} />
                    ))}
                  </div>
                  <div className="rd-rating-count">{total_ratings} ratings</div>
                </div>
                <div className="rd-rating-bars">
                  {[5,4,3,2,1].map(num => (
                    <div key={num} className="rd-rating-bar-row">
                      <span>{num}</span>
                      <Star size={12} fill="var(--text-muted)" stroke="none" />
                      <div className="rd-bar-bg">
                        <div className="rd-bar-fill" style={{ width: `${(reviews.filter(r => r.rating === num).length / (reviews.length || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rd-reviews-list">
                {reviews.length === 0 ? (
                  <div className="rd-no-items">
                    <p>No reviews yet for this restaurant.</p>
                  </div>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="rd-review-card">
                      <div className="rd-review-header">
                        <div className="rd-review-user">
                          <div className="rd-review-avatar">{review.user_name?.charAt(0)}</div>
                          <div>
                            <p className="rd-review-username">{review.user_name}</p>
                            <p className="rd-review-date">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="rd-review-rating">
                          {review.rating} <Star size={14} fill="currentColor" />
                        </div>
                      </div>
                      <p className="rd-review-comment">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sticky Categories Sidebar (Only for menu) */}
          {activeTab === 'menu' && (
            <div className="rd-sidebar">
              <div className="rd-categories-nav">
                <h4 className="rd-categories-title">Menu</h4>
                <ul className="rd-category-list">
                  {categories.map(cat => (
                    <li key={cat}>
                      <button 
                        className={`rd-category-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => scrollToCategory(cat)}
                      >
                        {cat} <span>({menu[cat].length})</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Bar */}
      {showCartBar && (
        <div className="rd-cart-bar animate-slide-in-up">
          <div className="container rd-cart-bar-inner">
            <div className="rd-cart-summary">
              <span className="rd-cart-count">{cartItems.length} ITEM{cartItems.length > 1 ? 'S' : ''}</span>
              <span className="rd-cart-total">₹{getTotal(cartType)}</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={onCartClick}>
              View Cart <Bike size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
