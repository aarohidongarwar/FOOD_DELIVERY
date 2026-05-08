import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, Briefcase, MapPin, CreditCard, FileText, 
  ChevronRight, ChevronLeft, Check, Clock, ShieldCheck, Mail, LogOut, Store
} from 'lucide-react';
import './RestaurantRegistration.css';

export default function RestaurantRegistration() {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    // Step 2: Business Info
    restaurantName: '',
    businessType: '',
    category: '',
    gstNumber: '',
    fssaiLicense: '',
    panCard: '',
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
    // Step 5: Documents
    ownerPhoto: null,
    storeBanner: null,
    gstCertificate: null,
    fssaiLicenseCopy: null,
    panCardCopy: null,
    cancelledCheque: null,
  });

  const steps = [
    { id: 1, label: 'Basic Info', icon: <User size={20} /> },
    { id: 2, label: 'Business Info', icon: <Briefcase size={20} /> },
    { id: 3, label: 'Location', icon: <MapPin size={20} /> },
    { id: 4, label: 'Bank Details', icon: <CreditCard size={20} /> },
    { id: 5, label: 'Documents', icon: <FileText size={20} /> },
  ];

  const handleNext = () => {
    if (step < steps.length) {
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

  const validateForm = () => {
    const requiredFields = [
      'fullName', 'mobile', 'email', 'password',
      'restaurantName', 'businessType', 'category',
      'fullAddress', 'city', 'state', 'pincode',
      'accountHolderName', 'accountNumber', 'ifscCode'
    ];
    return requiredFields.every(field => formData[field] && formData[field].trim() !== '');
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
      <div className="reg-page">
        <div className="reg-container">
          <motion.div 
            className="success-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="success-header">
              <Store size={24} className="success-logo-icon" />
              <span>Partner Hub</span>
            </div>

            <div className="success-icon-wrapper">
              <div className="success-icon-inner">
                <Clock size={32} />
              </div>
            </div>

            <h1 className="success-title">Profile Sent for Approval</h1>
            <p className="success-desc">
              Hi <strong>{formData.fullName.toUpperCase()}</strong>! Your application for <strong>{formData.restaurantName}</strong> is under review. We'll notify you once approved (usually within 24-48 hours).
            </p>

            <div className="status-stepper">
              <div className="status-step active">
                <div className="status-circle completed">
                  <FileText size={18} />
                </div>
                <span>Application Submitted</span>
              </div>
              <div className="status-line active"></div>
              <div className="status-step active-current">
                <div className="status-circle current">
                  <Clock size={18} />
                </div>
                <span>Under Review</span>
              </div>
              <div className="status-line"></div>
              <div className="status-step">
                <div className="status-circle">
                  <Check size={18} />
                </div>
                <span>Approval Decision</span>
              </div>
            </div>

            <div className="summary-box">
              <div className="summary-row">
                <span className="summary-label">Business Name</span>
                <span className="summary-value">{formData.restaurantName}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Type</span>
                <span className="summary-value">Restaurant</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Status</span>
                <span className="summary-badge">PENDING REVIEW</span>
              </div>
            </div>

            <div className="help-link">
              <Mail size={16} /> Need help? Contact <a href="mailto:support@partnerhub.in">support@partnerhub.in</a>
            </div>

            <button className="btn-signout" onClick={() => navigate('/login')}>
              <LogOut size={18} /> Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="reg-page">
      <div className="reg-container">
        <div className="reg-header">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Restaurant Partner Registration
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
        <div className="reg-stepper">
          {steps.map((s) => (
            <div 
              key={s.id} 
              className={`step-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}
              onClick={() => step > s.id && setStep(s.id)}
            >
              <div className="step-icon">
                {step > s.id ? <Check size={20} /> : s.icon}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <motion.div 
          className="reg-card"
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
                <div className="step-header">
                  <h2>Step 1: Basic Info</h2>
                  <p>Complete all steps to submit your application</p>
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Full Name <span>*</span></label>
                    <input 
                      type="text" 
                      name="fullName"
                      className="form-control" 
                      placeholder="Your full name"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number <span>*</span></label>
                    <input 
                      type="tel" 
                      name="mobile"
                      className="form-control" 
                      placeholder="+91 9876543210"
                      value={formData.mobile}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address <span>*</span></label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-control" 
                      placeholder="you@business.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Password <span>*</span></label>
                    <input 
                      type="password" 
                      name="password"
                      className="form-control" 
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                    />
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
                <div className="step-header">
                  <h2>Step 2: Business Info</h2>
                  <p>Tell us about your restaurant</p>
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Restaurant Name <span>*</span></label>
                    <input 
                      type="text" 
                      name="restaurantName"
                      className="form-control" 
                      placeholder="Spice Garden Restaurant"
                      value={formData.restaurantName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Business Type <span>*</span></label>
                    <input 
                      type="text" 
                      name="businessType"
                      className="form-control" 
                      placeholder="Multi-Cuisine Restaurant"
                      value={formData.businessType}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Category <span>*</span></label>
                    <select 
                      name="category"
                      className="form-control" 
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select category</option>
                      <option value="fine-dining">Fine Dining</option>
                      <option value="cafe">Cafe</option>
                      <option value="fast-food">Fast Food</option>
                      <option value="bakery">Bakery</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input 
                      type="text" 
                      name="gstNumber"
                      className="form-control" 
                      placeholder="27AABCU9603R1ZX"
                      value={formData.gstNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>FSSAI License</label>
                    <input 
                      type="text" 
                      name="fssaiLicense"
                      className="form-control" 
                      placeholder="10719006000024"
                      value={formData.fssaiLicense}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>PAN Card</label>
                    <input 
                      type="text" 
                      name="panCard"
                      className="form-control" 
                      placeholder="ABCDE1234F"
                      value={formData.panCard}
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
                <div className="step-header">
                  <h2>Step 3: Location</h2>
                  <p>Where is your restaurant located?</p>
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Full Address <span>*</span></label>
                    <input 
                      type="text" 
                      name="fullAddress"
                      className="form-control" 
                      placeholder="123, MG Road, Indiranagar"
                      value={formData.fullAddress}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>City <span>*</span></label>
                    <input 
                      type="text" 
                      name="city"
                      className="form-control" 
                      placeholder="Bangalore"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>State <span>*</span></label>
                    <input 
                      type="text" 
                      name="state"
                      className="form-control" 
                      placeholder="Karnataka"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Pincode <span>*</span></label>
                    <input 
                      type="text" 
                      name="pincode"
                      className="form-control" 
                      placeholder="560038"
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
                <div className="step-header">
                  <h2>Step 4: Bank Details</h2>
                  <p>Bank details are required for settlement</p>
                </div>
                
                <div className="info-box">
                  Bank details are required for settlement of your earnings.
                </div>

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Account Holder Name</label>
                    <input 
                      type="text" 
                      name="accountHolderName"
                      className="form-control" 
                      placeholder="Rajesh Kumar"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Account Number</label>
                    <input 
                      type="text" 
                      name="accountNumber"
                      className="form-control" 
                      placeholder="1234567890"
                      value={formData.accountNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>IFSC Code</label>
                    <input 
                      type="text" 
                      name="ifscCode"
                      className="form-control" 
                      placeholder="SBIN0001234"
                      value={formData.ifscCode}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>UPI ID</label>
                    <input 
                      type="text" 
                      name="upiId"
                      className="form-control" 
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
                <div className="step-header">
                  <h2>Step 5: Documents</h2>
                  <p>Upload your documents</p>
                </div>

                <div className="info-box info-sub">
                  Document upload is available after initial registration. For now, note your documents for later submission.
                </div>

                <div className="upload-section">
                  {[
                    { name: 'ownerPhoto', label: 'Owner Photo' },
                    { name: 'storeBanner', label: 'Store Banner' },
                    { name: 'gstCertificate', label: 'GST Certificate' },
                    { name: 'fssaiLicenseCopy', label: 'FSSAI License Copy' },
                    { name: 'panCardCopy', label: 'PAN Card Copy' },
                    { name: 'cancelledCheque', label: 'Cancelled Cheque' },
                  ].map((doc) => (
                    <div key={doc.name} className="upload-item">
                      <label>{doc.label}</label>
                      <div className="upload-placeholder">
                        <span>Click to upload {doc.label} (PDF, JPG, PNG)</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="step-footer-link">
                  Already registered? <Link to="/login">Sign in</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="reg-footer">
            <button className="btn-back" onClick={handleBack}>
              <ChevronLeft size={18} /> {step === 1 ? 'Back' : 'Previous'}
            </button>
            <button className="btn-next" onClick={handleNext}>
              {step === steps.length ? 'Submit' : 'Next'} <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        <div className="reg-progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / steps.length) * 100}%` }}></div>
          </div>
          <div className="step-indicator">
            Step {step} of {steps.length}
          </div>
        </div>
      </div>
    </div>
  );
}
