import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Loader2, Search, Clock, ChevronRight, LocateFixed } from 'lucide-react';
import './LocationPopup.css';

export default function LocationPopup({ onLocationGranted }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [recentAddresses, setRecentAddresses] = useState([]);
  const searchTimeout = useRef(null);

  useEffect(() => {
    // Check if location is already saved
    const savedLocation = localStorage.getItem('quickbite_user_location');
    if (savedLocation) {
      onLocationGranted?.(JSON.parse(savedLocation));
      return;
    }

    // Load recent addresses
    const recent = localStorage.getItem('quickbite_recent_addresses');
    if (recent) {
      setRecentAddresses(JSON.parse(recent));
    }

    // Show popup after a small delay
    const timer = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(timer);
  }, [onLocationGranted]);

  // Save to recent addresses
  const saveToRecent = (locationData) => {
    const recent = JSON.parse(localStorage.getItem('quickbite_recent_addresses') || '[]');
    // Remove duplicate if exists
    const filtered = recent.filter(r => r.displayName !== locationData.displayName);
    const updated = [locationData, ...filtered].slice(0, 5); // Keep last 5
    localStorage.setItem('quickbite_recent_addresses', JSON.stringify(updated));
  };

  // Select a location and close
  const selectLocation = (locationData) => {
    localStorage.setItem('quickbite_user_location', JSON.stringify(locationData));
    saveToRecent(locationData);
    setShow(false);
    onLocationGranted?.(locationData);
  };

  // Use current GPS location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        let displayName = 'Current Location';
        let city = 'Your Location';
        let fullAddress = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`
          );
          const data = await res.json();
          const addr = data.address || {};

          // Build a readable local address
          const parts = [];
          if (addr.road) parts.push(addr.road);
          if (addr.neighbourhood) parts.push(addr.neighbourhood);
          if (addr.suburb) parts.push(addr.suburb);

          displayName = parts.length > 0 ? parts.join(', ') : (addr.suburb || addr.village || addr.town || 'Current Location');
          
          city = addr.suburb || addr.neighbourhood || addr.village || addr.town ||
                 addr.city_district || addr.city || addr.county || addr.state || 'Your Location';
          
          fullAddress = data.display_name || '';
        } catch {
          // Fallback
        }

        setLoading(false);
        selectLocation({
          latitude,
          longitude,
          city,
          displayName,
          fullAddress,
          type: 'gps'
        });
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Please enable it in browser settings or search manually below.');
        } else {
          setError('Unable to get location. Please search manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Search addresses using OpenStreetMap Nominatim
  const handleSearchChange = (value) => {
    setSearchQuery(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&countrycodes=in`
        );
        const data = await res.json();
        setSearchResults(
          data.map((item) => {
            const addr = item.address || {};
            const localName = addr.suburb || addr.neighbourhood || addr.village ||
                              addr.town || addr.city_district || addr.city || addr.state || item.display_name.split(',')[0];
            return {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              city: localName,
              displayName: localName,
              fullAddress: item.display_name,
              type: 'search'
            };
          })
        );
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="loc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Popup Panel */}
          <motion.div
            className="loc-popup-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="loc-popup"
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* Header */}
              <div className="loc-header">
                <motion.div
                  className="loc-header-icon"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <MapPin size={28} />
                </motion.div>
                <div>
                  <h2 className="loc-title">Set your delivery location</h2>
                  <p className="loc-subtitle">to find restaurants and dishes near you</p>
                </div>
              </div>

              {/* Current Location Button */}
              <button
                className="loc-gps-btn"
                onClick={useCurrentLocation}
                disabled={loading}
              >
                <div className="loc-gps-left">
                  {loading ? (
                    <Loader2 size={22} className="loc-spin" />
                  ) : (
                    <LocateFixed size={22} />
                  )}
                  <div>
                    <span className="loc-gps-title">
                      {loading ? 'Detecting location...' : 'Use current location'}
                    </span>
                    <span className="loc-gps-sub">Using GPS</span>
                  </div>
                </div>
                <ChevronRight size={18} className="loc-gps-arrow" />
              </button>

              {error && (
                <motion.p
                  className="loc-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  {error}
                </motion.p>
              )}

              {/* Divider */}
              <div className="loc-divider">
                <span>OR</span>
              </div>

              {/* Search Input */}
              <div className="loc-search-box">
                <Search size={18} className="loc-search-icon" />
                <input
                  type="text"
                  placeholder="Search for area, street name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                />
                {searching && <Loader2 size={18} className="loc-spin loc-search-spinner" />}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <motion.div
                  className="loc-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      className="loc-result-item"
                      onClick={() => selectLocation(result)}
                    >
                      <MapPin size={18} className="loc-result-pin" />
                      <div className="loc-result-text">
                        <span className="loc-result-name">{result.displayName}</span>
                        <span className="loc-result-addr">{result.fullAddress}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Recent Addresses */}
              {recentAddresses.length > 0 && searchResults.length === 0 && searchQuery.length === 0 && (
                <div className="loc-recent">
                  <p className="loc-recent-title">
                    <Clock size={14} />
                    Recent Locations
                  </p>
                  {recentAddresses.map((addr, i) => (
                    <button
                      key={i}
                      className="loc-result-item"
                      onClick={() => selectLocation(addr)}
                    >
                      <Clock size={16} className="loc-result-pin loc-recent-icon" />
                      <div className="loc-result-text">
                        <span className="loc-result-name">{addr.displayName}</span>
                        <span className="loc-result-addr">{addr.fullAddress}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Privacy */}
              <p className="loc-privacy">🔒 Your location data stays private and is only used to show nearby restaurants.</p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
