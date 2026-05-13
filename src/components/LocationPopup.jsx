import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Loader2, Search, Clock, ChevronRight, LocateFixed, Check } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationPopup.css';

// Custom orange map pin icon
const customIcon = new L.DivIcon({
  className: 'custom-map-pin',
  html: `<div class="map-pin-wrapper">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#FF5722" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3" fill="#fff" stroke="#FF5722" stroke-width="1.5"/>
    </svg>
    <div class="map-pin-shadow"></div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Component to fly map to a position
function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

// Component to handle map click to move pin
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
    dragend() {
      // handled by marker
    }
  });
  return null;
}

export default function LocationPopup({ onLocationGranted }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [mapPosition, setMapPosition] = useState([19.076, 72.8777]); // Default: Mumbai
  const [pinAddress, setPinAddress] = useState('');
  const [pinCity, setPinCity] = useState('');
  const [reversingGeocode, setReversingGeocode] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    const savedLocation = localStorage.getItem('quickbite_user_location');
    if (savedLocation) {
      onLocationGranted?.(JSON.parse(savedLocation));
      return;
    }

    const recent = localStorage.getItem('quickbite_recent_addresses');
    if (recent) setRecentAddresses(JSON.parse(recent));

    const timer = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(timer);
  }, [onLocationGranted]);

  // Reverse geocode a lat/lng to get address
  const reverseGeocode = async (lat, lng) => {
    setReversingGeocode(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`
      );
      const data = await res.json();
      const addr = data.address || {};

      const parts = [];
      if (addr.road) parts.push(addr.road);
      if (addr.neighbourhood) parts.push(addr.neighbourhood);
      if (addr.suburb) parts.push(addr.suburb);

      const displayName = parts.length > 0 ? parts.join(', ') : (addr.suburb || addr.village || addr.town || 'Selected Location');
      const city = addr.suburb || addr.neighbourhood || addr.village || addr.town ||
                   addr.city_district || addr.city || addr.county || addr.state || 'Your Location';

      setPinAddress(data.display_name || displayName);
      setPinCity(city);
      setReversingGeocode(false);
      return { displayName, city, fullAddress: data.display_name || '' };
    } catch {
      setPinAddress('Selected Location');
      setPinCity('Your Location');
      setReversingGeocode(false);
      return { displayName: 'Selected Location', city: 'Your Location', fullAddress: '' };
    }
  };

  const saveToRecent = (locationData) => {
    const recent = JSON.parse(localStorage.getItem('quickbite_recent_addresses') || '[]');
    const filtered = recent.filter(r => r.displayName !== locationData.displayName);
    const updated = [locationData, ...filtered].slice(0, 5);
    localStorage.setItem('quickbite_recent_addresses', JSON.stringify(updated));
  };

  const selectLocation = (locationData) => {
    localStorage.setItem('quickbite_user_location', JSON.stringify(locationData));
    saveToRecent(locationData);
    setShow(false);
    onLocationGranted?.(locationData);
  };

  // GPS current location
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
        setMapPosition([latitude, longitude]);
        setShowMap(true);
        const geo = await reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Please search manually or pick on map.');
        } else {
          setError('Unable to get location. Please search manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  // Handle map click / pin drag
  const handleMapPinMove = async (newPos) => {
    setMapPosition(newPos);
    await reverseGeocode(newPos[0], newPos[1]);
  };

  // Confirm pin location
  const confirmPinLocation = () => {
    selectLocation({
      latitude: mapPosition[0],
      longitude: mapPosition[1],
      city: pinCity,
      displayName: pinCity,
      fullAddress: pinAddress,
      type: 'map'
    });
  };

  // Search addresses
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

  // When search result is clicked, show it on map
  const handleSearchResultClick = (result) => {
    setMapPosition([result.latitude, result.longitude]);
    setPinAddress(result.fullAddress);
    setPinCity(result.city);
    setSearchQuery('');
    setSearchResults([]);
    setShowMap(true);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="loc-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

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

              {/* GPS Button */}
              <button className="loc-gps-btn" onClick={useCurrentLocation} disabled={loading}>
                <div className="loc-gps-left">
                  {loading ? <Loader2 size={22} className="loc-spin" /> : <LocateFixed size={22} />}
                  <div>
                    <span className="loc-gps-title">{loading ? 'Detecting location...' : 'Use current location'}</span>
                    <span className="loc-gps-sub">Using GPS</span>
                  </div>
                </div>
                <ChevronRight size={18} className="loc-gps-arrow" />
              </button>

              {error && (
                <motion.p className="loc-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  {error}
                </motion.p>
              )}

              {/* Map Section */}
              {showMap && (
                <motion.div
                  className="loc-map-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="loc-map-container">
                    <MapContainer
                      center={mapPosition}
                      zoom={16}
                      scrollWheelZoom={true}
                      className="loc-map"
                      zoomControl={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={mapPosition}
                        icon={customIcon}
                        draggable={true}
                        eventHandlers={{
                          dragend: (e) => {
                            const latlng = e.target.getLatLng();
                            handleMapPinMove([latlng.lat, latlng.lng]);
                          }
                        }}
                      />
                      <FlyToPosition position={mapPosition} />
                      <MapClickHandler onMapClick={handleMapPinMove} />
                    </MapContainer>

                    <p className="loc-map-hint">📌 Drag the pin or tap on the map to adjust</p>
                  </div>

                  {/* Selected address from pin */}
                  <div className="loc-pin-address">
                    <MapPin size={18} className="loc-pin-icon" />
                    <div className="loc-pin-text">
                      <span className="loc-pin-city">{reversingGeocode ? 'Finding address...' : pinCity}</span>
                      <span className="loc-pin-full">{reversingGeocode ? '' : pinAddress}</span>
                    </div>
                  </div>

                  <button className="loc-confirm-btn" onClick={confirmPinLocation} disabled={reversingGeocode}>
                    {reversingGeocode ? (
                      <><Loader2 size={18} className="loc-spin" /> Finding address...</>
                    ) : (
                      <><Check size={18} /> Confirm Location</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Divider */}
              {!showMap && (
                <>
                  <div className="loc-divider"><span>OR</span></div>

                  {/* Search */}
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

                  {searchResults.length > 0 && (
                    <motion.div className="loc-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {searchResults.map((result, i) => (
                        <button key={i} className="loc-result-item" onClick={() => handleSearchResultClick(result)}>
                          <MapPin size={18} className="loc-result-pin" />
                          <div className="loc-result-text">
                            <span className="loc-result-name">{result.displayName}</span>
                            <span className="loc-result-addr">{result.fullAddress}</span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}

                  {/* Locate on Map button */}
                  <button className="loc-map-btn" onClick={() => setShowMap(true)}>
                    <Navigation size={16} />
                    Locate on map
                  </button>

                  {/* Recent */}
                  {recentAddresses.length > 0 && searchResults.length === 0 && searchQuery.length === 0 && (
                    <div className="loc-recent">
                      <p className="loc-recent-title"><Clock size={14} /> Recent Locations</p>
                      {recentAddresses.map((addr, i) => (
                        <button key={i} className="loc-result-item" onClick={() => selectLocation(addr)}>
                          <Clock size={16} className="loc-result-pin loc-recent-icon" />
                          <div className="loc-result-text">
                            <span className="loc-result-name">{addr.displayName}</span>
                            <span className="loc-result-addr">{addr.fullAddress}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Back to search from map view */}
              {showMap && (
                <button className="loc-back-btn" onClick={() => setShowMap(false)}>
                  ← Back to search
                </button>
              )}

              <p className="loc-privacy">🔒 Your location data stays private and is only used to show nearby restaurants.</p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
