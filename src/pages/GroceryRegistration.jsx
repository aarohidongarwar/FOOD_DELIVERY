import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Briefcase, MapPin, CreditCard, FileText, Camera, Settings,
  ChevronRight, ChevronLeft, Check, Eye, EyeOff, Clock, Mail, LogOut, Store
} from 'lucide-react';
import './GroceryRegistration.css';

export default function GroceryRegistration() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  
  const steps = [
    { id: 1, label: 'Basic Info', icon: <User size={20} /> },
    { id: 2, label: 'Business Info', icon: <Briefcase size={20} /> },
    { id: 3, label: 'Location', icon: <MapPin size={20} /> },
    { id: 4, label: 'Bank Details', icon: <CreditCard size={20} /> },
    { id: 5, label: 'Store Photos', icon: <Camera size={20} /> },
    { id: 6, label: 'Operations', icon: <Settings size={20} /> },
  ];

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    // Step 2: Business Info
    storeName: '',
    category: '',
    gstNumber: '',
    fssaiLicense: '',
    panCardNumber: '',
    // Step 3: Location
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    // Step 4: Bank Details
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    // Step 5: Store Photos
    storeFrontPhoto: null,
    insideStorePhoto: null,
    menuPhoto: null,
    bannerPhoto: null,
    // Step 6: Operations
    openingTime: '09:00',
    closingTime: '22:00',
    deliveryRadius: '5',
    preparationTime: '30',
  });

  const totalSteps = 6;

  const validateForm = () => {
    const requiredFields = [
      'fullName', 'mobile', 'email', 'password',
      'storeName', 'category',
      'fullAddress', 'city', 'state', 'pincode',
      'accountHolderName', 'accountNumber', 'ifscCode'
    ];
    return requiredFields.every(field => formData[field] && formData[field].trim() !== '');
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Final Submit
      if (validateForm()) {
        setIsSubmitted(true);
      } else {
        alert("Please fill all required fields in the previous steps before submitting.");
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/partnership-type');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isSubmitted) {
    return (
      <div className="grocery-reg-page">
        <div className="grocery-reg-container">
          <motion.div 
            className="grocery-success-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="grocery-success-header">
              <Store size={24} className="grocery-success-logo-icon" />
              <span>Partner Hub</span>
            </div>

            <div className="grocery-success-icon-wrapper">
              <div className="grocery-success-icon-inner">
                <Clock size={32} />
              </div>
            </div>

            <h1 className="grocery-success-title">Profile Sent for Approval</h1>
            <p className="grocery-success-desc">
              Hi <strong>{formData.fullName.toUpperCase()}</strong>! Your application for <strong>{formData.storeName}</strong> is under review. We'll notify you once approved (usually within 24-48 hours).
            </p>

            <div className="grocery-status-stepper">
              <div className="grocery-status-step active">
                <div className="grocery-status-circle completed">
                  <FileText size={18} />
                </div>
                <span>Application Submitted</span>
              </div>
              <div className="grocery-status-line active"></div>
              <div className="grocery-status-step active-current">
                <div className="grocery-status-circle current">
                  <Clock size={18} />
                </div>
                <span>Under Review</span>
              </div>
              <div className="grocery-status-line"></div>
              <div className="grocery-status-step">
                <div className="grocery-status-circle">
                  <Check size={18} />
                </div>
                <span>Approval Decision</span>
              </div>
            </div>

            <div className="grocery-summary-box">
              <div className="grocery-summary-row">
                <span className="grocery-summary-label">Store Name</span>
                <span className="grocery-summary-value">{formData.storeName}</span>
              </div>
              <div className="grocery-summary-row">
                <span className="grocery-summary-label">Type</span>
                <span className="grocery-summary-value">Grocery Vendor</span>
              </div>
              <div className="grocery-summary-row">
                <span className="grocery-summary-label">Status</span>
                <span className="grocery-summary-badge">PENDING REVIEW</span>
              </div>
            </div>

            <div className="grocery-help-link">
              <Mail size={16} /> Need help? Contact <a href="mailto:support@partnerhub.in">support@partnerhub.in</a>
            </div>

            <button className="grocery-btn-signout" onClick={() => navigate('/login')}>
              <LogOut size={18} /> Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="grocery-reg-page">
      <div className="grocery-reg-container">
        {/* Hero Section */}
        <div className="reg-hero">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Grocery Vendor Partner Registration
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Complete all steps to submit your application
          </motion.p>
        </div>

        {/* Stepper */}
        <div className="grocery-stepper">
          {steps.map((s) => (
            <div 
              key={s.id} 
              className={`grocery-step-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
              onClick={() => step > s.id && setStep(s.id)}
            >
              <div className="grocery-step-icon">
                {step > s.id ? <Check size={20} /> : s.icon}
              </div>
              <span className="grocery-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div 
          className="grocery-reg-card"
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grocery-step-title">
                  <h2>Step 1: Basic Info</h2>
                  <p>Your personal details</p>
                </div>
                <div className="grocery-form-grid">
                  <div className="grocery-form-group">
                    <label>Full Name <span>*</span></label>
                    <input 
                      type="text" 
                      name="fullName"
                      className="grocery-form-control" 
                      placeholder="Your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group">
                    <label>Mobile Number <span>*</span></label>
                    <input 
                      type="tel" 
                      name="mobile"
                      className="grocery-form-control" 
                      placeholder="+91 9876543210"
                      value={formData.mobile}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width">
                    <label>Email Address <span>*</span></label>
                    <input 
                      type="email" 
                      name="email"
                      className="grocery-form-control" 
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width relative">
                    <label>Password <span>*</span></label>
                    <div className="password-wrapper">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        className="grocery-form-control" 
                        placeholder="Min 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button 
                        type="button" 
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grocery-step-title">
                  <h2>Step 2: Business Info</h2>
                  <p>Tell us about your grocery store</p>
                </div>
                <div className="grocery-form-grid">
                  <div className="grocery-form-group full-width">
                    <label>Store Name <span>*</span></label>
                    <input 
                      type="text" 
                      name="storeName"
                      className="grocery-form-control" 
                      placeholder="Fresh Mart Grocery Store"
                      value={formData.storeName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width">
                    <label>Category <span>*</span></label>
                    <select 
                      name="category"
                      className="grocery-form-control" 
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select category</option>
                      <option value="meat-seafood">Meat & Seafood</option>
                      <option value="fruits-vegetables">Fruits & Vegetables</option>
                      <option value="dairy-bakery">Dairy & Bakery</option>
                      <option value="kirana">Kirana / Grocery</option>
                    </select>
                  </div>
                  <div className="grocery-form-group">
                    <label>GST Number</label>
                    <input 
                      type="text" 
                      name="gstNumber"
                      className="grocery-form-control" 
                      placeholder="27AABCU9603R1ZX"
                      value={formData.gstNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group">
                    <label>FSSAI License</label>
                    <input 
                      type="text" 
                      name="fssaiLicense"
                      className="grocery-form-control" 
                      placeholder="10719006000024"
                      value={formData.fssaiLicense}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width">
                    <label>PAN Card Number</label>
                    <input 
                      type="text" 
                      name="panCardNumber"
                      className="grocery-form-control" 
                      placeholder="ABCDE1234F"
                      value={formData.panCardNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grocery-step-title">
                  <h2>Step 3: Location</h2>
                  <p>Where is your store located?</p>
                </div>
                <div className="grocery-form-grid">
                  <div className="grocery-form-group full-width">
                    <label>Full Address <span>*</span></label>
                    <input 
                      type="text" 
                      name="fullAddress"
                      className="grocery-form-control" 
                      placeholder="123, MG Road, Indiranagar"
                      value={formData.fullAddress}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group">
                    <label>City <span>*</span></label>
                    <input 
                      type="text" 
                      name="city"
                      className="grocery-form-control" 
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group">
                    <label>State <span>*</span></label>
                    <input 
                      type="text" 
                      name="state"
                      className="grocery-form-control" 
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width">
                    <label>Pincode <span>*</span></label>
                    <input 
                      type="text" 
                      name="pincode"
                      className="grocery-form-control" 
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grocery-step-title">
                  <h2>Step 4: Bank Details</h2>
                  <p>Bank details for settlement of your earnings</p>
                </div>

                <div className="grocery-info-box">
                  Bank details are required for settlement of your earnings.
                </div>

                <div className="grocery-form-grid">
                  <div className="grocery-form-group full-width">
                    <label>Account Holder Name <span>*</span></label>
                    <input 
                      type="text" 
                      name="accountHolderName"
                      className="grocery-form-control" 
                      placeholder="Rajesh Kumar"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width">
                    <label>Account Number <span>*</span></label>
                    <input 
                      type="text" 
                      name="accountNumber"
                      className="grocery-form-control" 
                      placeholder="1234567890"
                      value={formData.accountNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group">
                    <label>IFSC Code <span>*</span></label>
                    <input 
                      type="text" 
                      name="ifscCode"
                      className="grocery-form-control" 
                      placeholder="SBIN0001234"
                      value={formData.ifscCode}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group">
                    <label>UPI ID</label>
                    <input 
                      type="text" 
                      name="upiId"
                      className="grocery-form-control" 
                      placeholder="owner@upi"
                      value={formData.upiId}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grocery-step-title">
                  <h2>Step 5: Store Photos</h2>
                  <p>Upload your store images</p>
                </div>

                <div className="grocery-info-box grocery-info-sub">
                  Document upload is available after initial registration. For now, note your documents for later submission.
                </div>

                <div className="upload-section">
                  {[
                    { name: 'storeFrontPhoto', label: 'Store Front Photo' },
                    { name: 'insideStorePhoto', label: 'Inside Store Photo' },
                    { name: 'menuPhoto', label: 'Grocery Menu / Price List' },
                    { name: 'bannerPhoto', label: 'Store Banner' },
                  ].map((doc) => (
                    <div key={doc.name} className="upload-item">
                      <label>{doc.label}</label>
                      <div className="upload-placeholder">
                        <span>Click to upload {doc.label} (JPG, PNG)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grocery-step-title">
                  <h2>Step 6: Operations</h2>
                  <p>Store timings & delivery settings</p>
                </div>
                <div className="grocery-form-grid">
                  <div className="grocery-form-group">
                    <label>Opening Time</label>
                    <input 
                      type="time" 
                      name="openingTime"
                      className="grocery-form-control" 
                      value={formData.openingTime}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group">
                    <label>Closing Time</label>
                    <input 
                      type="time" 
                      name="closingTime"
                      className="grocery-form-control" 
                      value={formData.closingTime}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width">
                    <label>Delivery Radius (km)</label>
                    <input 
                      type="text" 
                      name="deliveryRadius"
                      className="grocery-form-control" 
                      placeholder="5"
                      value={formData.deliveryRadius}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grocery-form-group full-width">
                    <label>Estimated Preparation Time (minutes)</label>
                    <input 
                      type="text" 
                      name="preparationTime"
                      className="grocery-form-control" 
                      placeholder="30"
                      value={formData.preparationTime}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className="grocery-footer-link">
                  Already registered? <Link to="/login">Sign in</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grocery-reg-footer">
            <button className="grocery-btn-back" onClick={handleBack}>
              <ChevronLeft size={18} /> {step === 1 ? 'Back' : 'Previous'}
            </button>
            <button className="grocery-btn-next" onClick={handleNext}>
              {step === totalSteps ? 'Submit Application' : 'Next'} <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        <div className="grocery-progress-container">
          <div className="grocery-progress-bar">
            <div className="grocery-progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
          </div>
          <div className="grocery-step-indicator">
            Step {step} of {totalSteps}
          </div>
        </div>
      </div>
    </div>
  );
}
