import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Star, Clock } from 'lucide-react';
import { RestaurantCard, RestaurantCardSkeleton } from '../components';
import useRestaurantStore from '../stores/restaurantStore';
import './Restaurants.css';

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { restaurants, fetchRestaurants, loading, cuisines, fetchCuisines } = useRestaurantStore();
  
  const search = searchParams.get('search') || '';
  const cuisineParam = searchParams.get('cuisine') || '';
  const sortParam = searchParams.get('sort') || '';
  const isGrocery = searchParams.get('is_grocery') === 'true';

  useEffect(() => {
    fetchCuisines();
  }, [fetchCuisines]);

  useEffect(() => {
    const params = {};
    if (search) params.search = search;
    if (cuisineParam) params.cuisine = cuisineParam;
    if (sortParam) params.sort = sortParam;
    if (isGrocery) params.is_grocery = true;
    
    fetchRestaurants(params);
  }, [search, cuisineParam, sortParam, isGrocery, fetchRestaurants]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="restaurants-page container">
      <div className="page-header">
        <h1>{isGrocery ? 'Groceries' : 'Restaurants'} {search && `matching "${search}"`}</h1>
        <p className="subtitle">
          {loading ? 'Loading...' : `${restaurants.length} results found`}
        </p>
      </div>

      <div className="restaurants-layout">
        {/* Sidebar Filters */}
        <aside className="filters-sidebar">
          <div className="filter-header">
            <h3><Filter size={18} /> Filters</h3>
            {(search || cuisineParam || sortParam || isGrocery) && (
              <button 
                className="btn-clear" 
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                Clear All
              </button>
            )}
          </div>

          <div className="filter-section">
            <h4>Type</h4>
            <div className="filter-options">
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="type"
                  checked={!isGrocery} 
                  onChange={() => updateParam('is_grocery', '')}
                />
                Food Delivery
              </label>
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="type"
                  checked={isGrocery} 
                  onChange={() => updateParam('is_grocery', 'true')}
                />
                Groceries
              </label>
            </div>
          </div>

          <div className="filter-section">
            <h4>Sort By</h4>
            <div className="filter-options">
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="sort"
                  checked={sortParam === ''} 
                  onChange={() => updateParam('sort', '')}
                />
                Relevance
              </label>
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="sort"
                  checked={sortParam === 'rating'} 
                  onChange={() => updateParam('sort', 'rating')}
                />
                Rating: High to Low
              </label>
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="sort"
                  checked={sortParam === 'delivery_time'} 
                  onChange={() => updateParam('sort', 'delivery_time')}
                />
                Delivery Time
              </label>
              <label className="checkbox-label">
                <input 
                  type="radio" 
                  name="sort"
                  checked={sortParam === 'price_low'} 
                  onChange={() => updateParam('sort', 'price_low')}
                />
                Delivery Fee: Low to High
              </label>
            </div>
          </div>

          {!isGrocery && cuisines.length > 0 && (
            <div className="filter-section">
              <h4>Cuisines</h4>
              <div className="filter-options">
                <label className="checkbox-label">
                  <input 
                    type="radio" 
                    name="cuisine"
                    checked={cuisineParam === ''} 
                    onChange={() => updateParam('cuisine', '')}
                  />
                  All Cuisines
                </label>
                {cuisines.map(c => (
                  <label key={c} className="checkbox-label">
                    <input 
                      type="radio" 
                      name="cuisine"
                      checked={cuisineParam === c} 
                      onChange={() => updateParam('cuisine', c)}
                    />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Results Grid */}
        <div className="results-container">
          {loading ? (
            <div className="restaurants-grid">
              {Array(6).fill(0).map((_, i) => <RestaurantCardSkeleton key={i} />)}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="restaurants-grid">
              {restaurants.map((restaurant, i) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} index={i} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🍽️</div>
              <h3>No restaurants found</h3>
              <p>Try adjusting your filters or search query.</p>
              <button className="btn btn-primary mt-4" onClick={() => setSearchParams(new URLSearchParams())}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
