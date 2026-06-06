import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  User, Briefcase, MapPin, CreditCard, FileText, 
  ChevronRight, ChevronLeft, Check, Store
} from 'lucide-react';
import api from '../api';
import './RestaurantRegistration.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onLocationSelect) onLocationSelect(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

export default function RestaurantOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [position, setPosition] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    businessType: '',
    cuisineType: 'General',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    fssaiLicense: '',
    gstNumber: '',
    panCard: '',
    openingTime: '09:00',
    closingTime: '22:00',
    deliveryRadius: '5',
    preparationTime: '30'
  });

  const handleLocationSelect = async (latlng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      if (data && data.address) {
        setFormData(prev => ({
          ...prev,
          fullAddress: data.display_name || prev.fullAddress,
          city: data.address.city || data.address.town || data.address.village || data.address.county || prev.city,
          state: data.address.state || prev.state,
          pincode: data.address.postcode || prev.pincode
        }));
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  // Automatically find user's current location on map load
  useEffect(() => {
    if (step === 2 && !position) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setPosition({ lat: 21.1458, lng: 79.0882 }) // Default Nagpur
      );
    }
  }, [step, position]);

  const steps = [
    { id: 1, label: 'Basic Info', icon: <Briefcase size={20} /> },
    { id: 2, label: 'Location', icon: <MapPin size={20} /> },
    { id: 3, label: 'Business Docs', icon: <FileText size={20} /> },
    { id: 4, label: 'Uploads', icon: <FileText size={20} /> },
    { id: 5, label: 'Operations', icon: <Store size={20} /> }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateStep = () => {
    if (step === 1) return formData.restaurantName && formData.cuisineType && formData.businessType;
    if (step === 2) return formData.fullAddress && formData.city && position;
    if (step === 3) return formData.fssaiLicense && formData.panCard;
    if (step === 4) return true; // File uploads mock
    if (step === 5) return formData.openingTime && formData.closingTime;
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      alert("Please fill all required fields before continuing.");
      return;
    }
    
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        const payload = {
          name: formData.restaurantName,
          address: `${formData.fullAddress}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
          cuisine_type: formData.cuisineType,
          lat: position.lat,
          lon: position.lng,
          registration_details: {
            businessType: formData.businessType,
            fssaiLicense: formData.fssaiLicense,
            gstNumber: formData.gstNumber,
            panCard: formData.panCard,
            openingTime: formData.openingTime,
            closingTime: formData.closingTime,
            deliveryRadius: formData.deliveryRadius,
            preparationTime: formData.preparationTime
          }
        };
        await api.post('/restaurants/owner/register', payload);
        onComplete();
      } catch (err) {
        alert("Failed to save profile. Please try again.");
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="reg-page">
      <div className="reg-container" style={{maxWidth: '800px', margin: '40px auto'}}>
        <div className="reg-header">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            Complete Your Restaurant Profile
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            We need a few more details to set up your partner dashboard.
          </motion.p>
        </div>

        <div className="reg-stepper">
          {steps.map((s) => (
            <div 
              key={s.id} 
              className={`step-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
            >
              <div className="step-icon">{step > s.id ? <Check size={20} /> : s.icon}</div>
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>

        <motion.div className="reg-card" key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="step-header">
                  <h2>Restaurant Details</h2>
                  <p>Basic information about your establishment</p>
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Restaurant Name <span>*</span></label>
                    <input type="text" name="restaurantName" className="form-control" value={formData.restaurantName} onChange={handleChange} placeholder="e.g. Spice Garden" />
                  </div>
                  <div className="form-group">
                    <label>Cuisine Type <span>*</span></label>
                    <select name="cuisineType" className="form-control" value={formData.cuisineType} onChange={handleChange}>
                      <option value="General">General</option>
                      <option value="North Indian">North Indian</option>
                      <option value="South Indian">South Indian</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Fast Food">Fast Food</option>
                      <option value="Italian">Italian</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Business Type <span>*</span></label>
                    <select name="businessType" className="form-control" value={formData.businessType} onChange={handleChange}>
                      <option value="">Select Type</option>
                      <option value="Dine-in & Delivery">Dine-in & Delivery</option>
                      <option value="Cloud Kitchen">Cloud Kitchen</option>
                      <option value="Food Truck">Food Truck</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="step-header">
                  <h2>Location (GPS Pin) <span>*</span></h2>
                  <p>Click on the map to pin your exact restaurant location for drivers.</p>
                </div>
                
                <div style={{height: '250px', width: '100%', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', zIndex: 0, position: 'relative'}}>
                  {position || step === 2 ? (
                    <MapContainer center={position || [21.1458, 79.0882]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={position} setPosition={setPosition} onLocationSelect={handleLocationSelect} />
                    </MapContainer>
                  ) : <div style={{height:'100%', background:'#eee', display:'flex', alignItems:'center', justifyContent:'center'}}>Loading Map...</div>}
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Street Address <span>*</span></label>
                    <input type="text" name="fullAddress" className="form-control" value={formData.fullAddress} onChange={handleChange} placeholder="123 Main Street" />
                  </div>
                  <div className="form-group">
                    <label>City <span>*</span></label>
                    <input type="text" name="city" className="form-control" value={formData.city} onChange={handleChange} placeholder="Nagpur" />
                  </div>
                  <div className="form-group">
                    <label>State & Pincode</label>
                    <div style={{display:'flex', gap:'10px'}}>
                      <input type="text" name="state" className="form-control" value={formData.state} onChange={handleChange} placeholder="State" style={{flex: 1}}/>
                      <input type="text" name="pincode" className="form-control" value={formData.pincode} onChange={handleChange} placeholder="Pincode" style={{flex: 1}}/>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="step-header">
                  <h2>Business Documents <span>*</span></h2>
                  <p>Legal registration details</p>
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>FSSAI License Number <span>*</span></label>
                    <input type="text" name="fssaiLicense" className="form-control" value={formData.fssaiLicense} onChange={handleChange} placeholder="14 digit FSSAI code" />
                  </div>
                  <div className="form-group">
                    <label>PAN Card Number <span>*</span></label>
                    <input type="text" name="panCard" className="form-control" value={formData.panCard} onChange={handleChange} placeholder="ABCDE1234F" />
                  </div>
                  <div className="form-group">
                    <label>GST Number (Optional)</label>
                    <input type="text" name="gstNumber" className="form-control" value={formData.gstNumber} onChange={handleChange} placeholder="27XXXXX..." />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="step-header">
                  <h2>Document Uploads</h2>
                  <p>Upload copies of your documents for verification</p>
                </div>
                <div className="upload-section">
                  {[
                    { id: 'fssai', label: 'FSSAI Certificate (PDF/JPG)' },
                    { id: 'pan', label: 'PAN Card Copy (PDF/JPG)' },
                    { id: 'store', label: 'Store Front Photo (JPG/PNG)' }
                  ].map((doc) => (
                    <div key={doc.id} className="upload-item" style={{marginBottom: '15px'}}>
                      <label style={{fontWeight:'bold', display:'block', marginBottom:'5px'}}>{doc.label}</label>
                      <input type="file" className="form-control" accept=".jpg,.jpeg,.png,.pdf" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="step-header">
                  <h2>Operations Settings</h2>
                  <p>Store timings and delivery settings</p>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Opening Time</label>
                    <input type="time" name="openingTime" className="form-control" value={formData.openingTime} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Closing Time</label>
                    <input type="time" name="closingTime" className="form-control" value={formData.closingTime} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Delivery Radius (km)</label>
                    <input type="number" name="deliveryRadius" className="form-control" value={formData.deliveryRadius} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Avg Prep Time (mins)</label>
                    <input type="number" name="preparationTime" className="form-control" value={formData.preparationTime} onChange={handleChange} />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="reg-footer">
            {step > 1 ? (
              <button className="btn-back" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={18} /> Previous
              </button>
            ) : <div></div>}
            <button className="btn-next" onClick={handleNext} disabled={submitting}>
              {submitting ? 'Saving...' : step === steps.length ? 'Complete Setup' : 'Next'} <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
