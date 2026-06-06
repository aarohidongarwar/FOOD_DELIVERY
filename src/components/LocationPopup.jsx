import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Loader2, Search, Clock, ChevronRight, LocateFixed, Check, Home, Briefcase, User, Plus, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useLocationStore from '../stores/locationStore';
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

function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function LocationPopup() {
  const { showLocationPopup, setShowLocationPopup, userLocation, setUserLocation, savedAddresses, addSavedAddress } = useLocationStore();
  
  // 'list' (saved addresses), 'map' (pick location), 'form' (enter precise details)
  const [step, setStep] = useState('list');
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  
  // Map State
  const [mapPosition, setMapPosition] = useState([19.076, 72.8777]);
  const [pinAddress, setPinAddress] = useState('');
  const [pinCity, setPinCity] = useState('');
  const [reversingGeocode, setReversingGeocode] = useState(false);
  
  // Form State
  const [flatNo, setFlatNo] = useState('');
  const [landmark, setLandmark] = useState('');
  const [saveAsType, setSaveAsType] = useState('Home'); // Home, Work, Other
  const [otherName, setOtherName] = useState('');
  
  const searchTimeout = useRef(null);

  // Auto-show logic is now handled globally in App.jsx to avoid showing on the Landing Page.

  // Reset state when popup opens
  useEffect(() => {
    if (showLocationPopup) {
      setStep('list');
      setSearchQuery('');
      setSearchResults([]);
      setFlatNo('');
      setLandmark('');
      setSaveAsType('Home');
      setOtherName('');
      setError('');
    }
  }, [showLocationPopup]);

  const closePopup = () => setShowLocationPopup(false);

  const reverseGeocode = async (lat, lng) => {
    setReversingGeocode(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`);
      const data = await res.json();
      const addr = data.address || {};

      const parts = [];
      if (addr.road) parts.push(addr.road);
      if (addr.neighbourhood) parts.push(addr.neighbourhood);
      if (addr.suburb) parts.push(addr.suburb);

      const displayName = parts.length > 0 ? parts.join(', ') : (addr.suburb || addr.village || addr.town || 'Selected Location');
      const city = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.city || addr.state || 'Your Location';

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
        setStep('map');
        await reverseGeocode(latitude, longitude);
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

  const handleMapPinMove = async (newPos) => {
    setMapPosition(newPos);
    await reverseGeocode(newPos[0], newPos[1]);
  };

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
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&countrycodes=in`);
        const data = await res.json();
        setSearchResults(
          data.map((item) => {
            const addr = item.address || {};
            const localName = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.city || addr.state || item.display_name.split(',')[0];
            return {
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon),
              city: localName,
              displayName: localName,
              fullAddress: item.display_name,
            };
          })
        );
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  };

  const handleSearchResultClick = (result) => {
    setMapPosition([result.latitude, result.longitude]);
    setPinAddress(result.fullAddress);
    setPinCity(result.city);
    setSearchQuery('');
    setSearchResults([]);
    setStep('map');
  };

  // Select an already saved address
  const selectSavedAddress = (addr) => {
    setUserLocation(addr);
    closePopup();
  };

  // Final submit from the form step
  const handleSaveAddressForm = (e) => {
    e.preventDefault();
    if (!flatNo.trim()) {
      setError('House / Flat No is required');
      return;
    }
    
    let finalLabel = saveAsType;
    if (saveAsType === 'Other') {
      if (!otherName.trim()) {
        setError('Please provide a name for this location');
        return;
      }
      finalLabel = otherName.trim();
    }

    const newAddress = {
      id: Date.now().toString(),
      latitude: mapPosition[0],
      longitude: mapPosition[1],
      city: pinCity,
      displayName: pinCity,
      fullAddress: pinAddress,
      flatNo: flatNo.trim(),
      landmark: landmark.trim(),
      label: finalLabel,
      type: saveAsType // 'Home', 'Work', 'Other'
    };

    addSavedAddress(newAddress);
    setUserLocation(newAddress);
    closePopup();
  };

  if (!showLocationPopup) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="loc-backdrop" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={userLocation ? closePopup : undefined} 
      />

      <motion.div 
        className="loc-drawer"
        initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-45%' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-45%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="loc-drawer-handle" />
        {userLocation && (
          <button className="loc-close-btn" onClick={closePopup}><X size={24} /></button>
        )}

        {/* STEP 1: Address Book / List View */}
        {step === 'list' && (
          <div className="loc-step-container">
            {/* Permission Banner Header */}
            {!userLocation && (
              <div className="loc-permission-banner">
                <LocateFixed size={20} className="loc-banner-icon" />
                <div className="loc-banner-text">
                  <h3>Location Permission is Off</h3>
                  <p>Granting location permission will ensure accurate address and hassle-free delivery</p>
                </div>
                <button className="btn-grant" onClick={useCurrentLocation}>
                  {loading ? <Loader2 size={16} className="loc-spin" /> : 'GRANT'}
                </button>
              </div>
            )}

            <div className="loc-list-content">
              <h2 className="loc-drawer-title">Select Delivery Address</h2>
              
              <div className="saved-addresses-list">
                {savedAddresses.map((addr) => (
                  <div key={addr.id} className="saved-addr-card" onClick={() => selectSavedAddress(addr)}>
                    <div className="saved-addr-icon-wrap">
                      {addr.type === 'Home' ? <Home size={20} /> : addr.type === 'Work' ? <Briefcase size={20} /> : <User size={20} />}
                    </div>
                    <div className="saved-addr-details">
                      <h4>{addr.label}</h4>
                      <p>{addr.flatNo ? `${addr.flatNo}, ` : ''}{addr.fullAddress}</p>
                      {addr.landmark && <span className="saved-landmark">Landmark: {addr.landmark}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="loc-actions-group">
                <button className="loc-action-btn" onClick={() => setStep('map')}>
                  <Plus size={20} className="text-primary" />
                  <span>Add New Address</span>
                </button>
                <button className="loc-action-btn" onClick={() => setStep('map')}>
                  <Search size={20} className="text-primary" />
                  <span>Enter Location Manually</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Map & Search View */}
        {step === 'map' && (
          <div className="loc-step-container">
            <div className="loc-search-header">
              <button className="loc-back-arrow" onClick={() => setStep('list')}><ChevronRight size={24} style={{transform: 'rotate(180deg)'}}/></button>
              <div className="loc-search-box-wrap">
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
            </div>

            {searchResults.length > 0 && (
              <div className="loc-search-results">
                {searchResults.map((result, i) => (
                  <button key={i} className="loc-result-item" onClick={() => handleSearchResultClick(result)}>
                    <MapPin size={18} className="loc-result-pin" />
                    <div className="loc-result-text">
                      <span className="loc-result-name">{result.displayName}</span>
                      <span className="loc-result-addr">{result.fullAddress}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="loc-map-wrapper">
              <MapContainer center={mapPosition} zoom={16} scrollWheelZoom={true} className="loc-map-full" zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={mapPosition} icon={customIcon} draggable={true} eventHandlers={{ dragend: (e) => { const latlng = e.target.getLatLng(); handleMapPinMove([latlng.lat, latlng.lng]); } }} />
                <FlyToPosition position={mapPosition} />
                <MapClickHandler onMapClick={handleMapPinMove} />
              </MapContainer>
              <button className="loc-gps-float-btn" onClick={useCurrentLocation} disabled={loading}>
                 {loading ? <Loader2 size={20} className="loc-spin text-primary" /> : <LocateFixed size={20} className="text-primary" />}
              </button>
            </div>

            <div className="loc-map-footer">
              <div className="loc-pin-address-info">
                <MapPin size={24} className="text-primary" />
                <div className="loc-pin-text-info">
                  <h3>{reversingGeocode ? 'Finding address...' : pinCity}</h3>
                  <p>{reversingGeocode ? 'Please wait...' : pinAddress}</p>
                </div>
              </div>
              <button className="btn btn-primary w-full" onClick={() => setStep('form')} disabled={reversingGeocode}>
                Confirm Location
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Precise Details Form */}
        {step === 'form' && (
          <div className="loc-step-container loc-form-step">
            <div className="loc-form-header">
              <button className="loc-back-arrow" onClick={() => setStep('map')}><ChevronRight size={24} style={{transform: 'rotate(180deg)'}}/></button>
              <h2>Enter Address Details</h2>
            </div>

            <div className="loc-form-scrollable">
              <div className="loc-confirmed-address">
                <MapPin size={20} className="text-primary" />
                <div>
                  <p className="font-semibold">{pinCity}</p>
                  <p className="text-sm text-gray">{pinAddress}</p>
                </div>
              </div>

              <form onSubmit={handleSaveAddressForm} className="loc-details-form">
                <div className="form-group">
                  <label>House / Flat / Block No. *</label>
                  <input type="text" value={flatNo} onChange={(e) => {setFlatNo(e.target.value); setError('')}} placeholder="e.g. Flat 402, Shubham Enclave" required />
                </div>
                <div className="form-group">
                  <label>Apartment / Road / Area</label>
                  <input type="text" value={pinCity} onChange={(e) => setPinCity(e.target.value)} placeholder="e.g. Link Road" />
                </div>
                <div className="form-group">
                  <label>Landmark (Optional)</label>
                  <input type="text" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Near Kachore Lawn" />
                </div>

                <div className="save-as-section">
                  <label>Save As</label>
                  <div className="save-as-chips">
                    <button type="button" className={`chip ${saveAsType === 'Home' ? 'active' : ''}`} onClick={() => setSaveAsType('Home')}>
                      <Home size={16} /> Home
                    </button>
                    <button type="button" className={`chip ${saveAsType === 'Work' ? 'active' : ''}`} onClick={() => setSaveAsType('Work')}>
                      <Briefcase size={16} /> Work
                    </button>
                    <button type="button" className={`chip ${saveAsType === 'Other' ? 'active' : ''}`} onClick={() => setSaveAsType('Other')}>
                      <User size={16} /> Friends & Family
                    </button>
                  </div>
                </div>

                {saveAsType === 'Other' && (
                  <div className="form-group slide-down">
                    <label>Save as (Name)</label>
                    <input type="text" value={otherName} onChange={(e) => {setOtherName(e.target.value); setError('')}} placeholder="e.g. Aarohi Dongarwar, Raj's House" />
                  </div>
                )}

                {error && <p className="loc-error-msg">{error}</p>}

                <div className="loc-form-footer">
                  <button type="submit" className="btn btn-primary w-full">Save Address and Proceed</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}
