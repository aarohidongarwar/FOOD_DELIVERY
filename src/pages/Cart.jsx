import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CreditCard, ShoppingBag, Info, ChevronRight, CheckCircle, Utensils, ShoppingBasket } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';
import useOrderStore from '../stores/orderStore';
import useLocationStore from '../stores/locationStore';
import api from '../api';
import './Cart.css';

export default function Cart() {
  const { carts, getSubtotal, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated, wallet, fetchWallet, updateProfile, fetchMe } = useAuthStore();
  const { placeOrder } = useOrderStore();
  const navigate = useNavigate();
  const { userLocation } = useLocationStore();

  const hasFood = carts.food.items.length > 0;
  const hasGrocery = carts.grocery.items.length > 0;

  const [activeTab, setActiveTab] = useState(hasFood ? 'food' : (hasGrocery ? 'grocery' : 'food'));

  // If one cart is cleared, switch to the other
  useEffect(() => {
    if (activeTab === 'food' && !hasFood && hasGrocery) setActiveTab('grocery');
    if (activeTab === 'grocery' && !hasGrocery && hasFood) setActiveTab('food');
  }, [hasFood, hasGrocery, activeTab]);

  const activeCart = carts[activeTab];
  const items = activeCart.items;
  const restaurantId = activeCart.restaurantId;
  const restaurantName = activeCart.restaurantName;
  const deliveryFee = activeCart.deliveryFee;

  const getFormattedAddress = () => {
    if (!userLocation) return '';
    const parts = [];
    if (userLocation.flatNo) parts.push(userLocation.flatNo);
    if (userLocation.fullAddress) parts.push(userLocation.fullAddress);
    else if (userLocation.city) parts.push(userLocation.city);
    if (userLocation.landmark) parts.push(`Landmark: ${userLocation.landmark}`);
    return parts.join(', ');
  };

  const [address, setAddress] = useState(getFormattedAddress() || user?.address || '');
  const [saveToProfile, setSaveToProfile] = useState(!user?.address);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Promo Code States
  const [activePromos, setActivePromos] = useState([]);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    const formatted = getFormattedAddress();
    if (formatted) {
      setAddress(formatted);
    } else if (user?.address) {
      setAddress(user.address);
    }
  }, [userLocation, user?.address]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchMe();
      fetchWallet();
      api.get('/orders/promo-codes/active')
        .then(({ data }) => setActivePromos(data))
        .catch(err => console.error(err));
    }
  }, [isAuthenticated, fetchWallet, fetchMe]);

  useEffect(() => {
    if (user) {
      const formatted = getFormattedAddress();
      if (formatted) {
        setAddress(formatted);
        setSaveToProfile(true);
      } else if (user.address) {
        setAddress(user.address);
        setSaveToProfile(false);
      } else {
        setSaveToProfile(true);
      }
    }
  }, [user]);

  if (!hasFood && !hasGrocery && !showSuccess) {
    return (
      <div className="cart-page empty-cart-page container">
        <ShoppingBag size={80} className="text-muted" />
        <h2>Your cart is empty</h2>
        <p>You can go to home page to view more restaurants or grocery stores.</p>
        <Link to="/restaurants" className="btn btn-primary mt-4">See restaurants near you</Link>
      </div>
    );
  }

  const handleApplyPromo = async (codeToApply) => {
    const code = codeToApply || promoCodeInput;
    if (!code.trim()) return;

    setPromoError('');
    setPromoSuccess('');

    try {
      const { data } = await api.post('/orders/promo-codes/validate', {
        code: code.trim(),
        restaurant_id: restaurantId,
        item_total: getSubtotal(activeTab)
      });
      setAppliedPromo(data);
      setPromoSuccess(`Promo applied! Discount of ₹${data.discount_amount} applied.`);
    } catch (err) {
      setPromoError(err.response?.data?.error || 'Invalid promo code');
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoSuccess('');
    setPromoError('');
  };

  const subtotal = getSubtotal(activeTab);
  const tax = subtotal * 0.05;
  const delivery_fee = deliveryFee;
  const discount = appliedPromo ? parseFloat(appliedPromo.discount_amount) : 0;
  const finalTotal = Math.max(0, subtotal + delivery_fee + tax - discount);

  const walletBalance = wallet?.balance || 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, finalTotal) : 0;
  const toPay = finalTotal - walletDeduction;

  const handlePlaceOrder = () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { returnTo: '/cart' } });
      return;
    }

    if (!address || !address.trim()) {
      setError('Delivery address is required');
      return;
    }

    executeOrder();
  };

  const executeOrder = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      if (saveToProfile && address.trim() !== user?.address) {
        await updateProfile({ address: address.trim() });
      }

      const orderData = {
        restaurant_id: restaurantId,
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, special_instructions: instructions })),
        delivery_address: address.trim(),
        delivery_lat: userLocation?.lat || null,
        delivery_lon: userLocation?.lon || null,
        payment_method: toPay === 0 ? 'wallet' : paymentMethod,
        use_wallet: useWallet,
        promo_code: appliedPromo?.code || null
      };

      const newOrder = await placeOrder(orderData);
      setShowPaymentGateway(false);
      clearCart(activeTab);
      setShowSuccess(true);
      setTimeout(() => {
        navigate(`/tracking/${newOrder.id}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-page container">
      <div className="cp-header">
        <h1>Checkout</h1>
        <p>Complete your order</p>
      </div>

      {(hasFood && hasGrocery) && (
        <div className="cart-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <button 
            className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('food')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Utensils size={18} /> Food Cart ({carts.food.items.reduce((s, i) => s + i.quantity, 0)})
          </button>
          <button 
            className={`btn ${activeTab === 'grocery' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('grocery')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ShoppingBasket size={18} /> Grocery Cart ({carts.grocery.items.reduce((s, i) => s + i.quantity, 0)})
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="cart-empty" style={{ textAlign: 'center', padding: '40px 0' }}>
          <p>This cart is empty.</p>
        </div>
      ) : (
        <div className="cp-layout">
          <div className="cp-main">
            {/* Address Section */}
            <section className="cp-section">
              <div className="cp-section-header">
                <MapPin size={20} className="text-primary" />
                <h2>Delivery Address</h2>
              </div>
              {isAuthenticated() ? (
                <div className="cp-form-group">
                  <textarea 
                    className="input-field" 
                    rows="3" 
                    placeholder="Enter your full delivery address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  {user && (
                    <label className="cp-address-checkbox-label" style={{ marginTop: '12px', display: 'flex' }}>
                      <input 
                        type="checkbox" 
                        checked={saveToProfile} 
                        onChange={(e) => setSaveToProfile(e.target.checked)} 
                      />
                      <span>Update profile address with this address</span>
                    </label>
                  )}
                </div>
              ) : (
                <div className="cp-auth-prompt">
                  <p>Please login to add delivery address</p>
                  <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                </div>
              )}
            </section>

            {/* Payment Section */}
            <section className="cp-section">
              <div className="cp-section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} className="text-primary" />
                <h2 style={{ margin: 0 }}>Payment Method</h2>
                <span style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                  color: '#ef4444', 
                  fontSize: '10px', 
                  fontWeight: 'bold', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  letterSpacing: '0.5px'
                }}>
                  TEST MODE
                </span>
              </div>

              {isAuthenticated() && (
                <div className="cp-wallet-section">
                  <div className="cp-wallet-info">
                    <span className="cp-wallet-title">👛 Wallet Balance: ₹{walletBalance.toFixed(2)}</span>
                    {walletBalance > 0 ? (
                      <label className="cp-wallet-checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={useWallet} 
                          onChange={(e) => setUseWallet(e.target.checked)} 
                        />
                        <span>Use wallet balance to pay for this order</span>
                      </label>
                    ) : (
                      <span className="cp-wallet-empty">Your wallet is empty. You can add funds in your Profile page.</span>
                    )}
                  </div>
                  {useWallet && (
                    <div className="cp-wallet-deduction-msg">
                      {walletBalance >= finalTotal ? (
                        <span className="text-green">Order fully covered by wallet balance (₹{finalTotal.toFixed(2)}). No other payment method required.</span>
                      ) : (
                        <span className="text-orange">₹{walletBalance.toFixed(2)} will be paid from wallet. Remaining ₹{toPay.toFixed(2)} to be paid via:</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="cp-payment-methods">
                {toPay > 0 ? (
                  <>
                    <div className={`cp-payment-method-container ${paymentMethod === 'card' ? 'active-container' : ''}`}>
                      <label className={`cp-payment-card ${paymentMethod === 'card' ? 'active' : ''}`} style={{marginBottom: paymentMethod === 'card' ? '0' : '12px', borderBottomLeftRadius: paymentMethod === 'card' ? '0' : '8px', borderBottomRightRadius: paymentMethod === 'card' ? '0' : '8px'}}>
                        <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                        <div className="cp-payment-info">
                          <span className="cp-payment-title">Credit / Debit Card</span>
                          <span className="cp-payment-desc">Pay securely with your card</span>
                        </div>
                      </label>
                      {paymentMethod === 'card' && (
                        <div className="cp-payment-inline-content" style={{padding: '16px', border: '1px solid var(--primary)', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', marginBottom: '12px', backgroundColor: 'rgba(249, 115, 22, 0.03)'}}>
                          <div style={{marginBottom: '12px'}}>
                            <label style={{display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: '#475569'}}>Card Number</label>
                            <input type="text" placeholder="4567 8901 2345 6789" style={{width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box'}} />
                          </div>
                          <div style={{display: 'flex', gap: '12px'}}>
                            <div style={{flex: 1}}>
                              <label style={{display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: '#475569'}}>Expiry</label>
                              <input type="text" placeholder="MM/YY" style={{width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box'}} />
                            </div>
                            <div style={{flex: 1}}>
                              <label style={{display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: '#475569'}}>CVV</label>
                              <input type="password" placeholder="***" style={{width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box'}} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`cp-payment-method-container ${paymentMethod === 'upi' ? 'active-container' : ''}`}>
                      <label className={`cp-payment-card ${paymentMethod === 'upi' ? 'active' : ''}`} style={{marginBottom: paymentMethod === 'upi' ? '0' : '12px', borderBottomLeftRadius: paymentMethod === 'upi' ? '0' : '8px', borderBottomRightRadius: paymentMethod === 'upi' ? '0' : '8px'}}>
                        <input type="radio" name="payment" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                        <div className="cp-payment-info">
                          <span className="cp-payment-title">UPI</span>
                          <span className="cp-payment-desc">Google Pay, PhonePe, Paytm</span>
                        </div>
                      </label>
                      {paymentMethod === 'upi' && (
                        <div className="cp-payment-inline-content" style={{padding: '20px', border: '1px solid var(--primary)', borderTop: 'none', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', marginBottom: '12px', backgroundColor: 'rgba(249, 115, 22, 0.03)', textAlign: 'center'}}>
                          <div style={{background: '#ffffff', padding: '12px', borderRadius: '8px', display: 'inline-block', marginBottom: '12px', border: '1px solid #e2e8f0'}}>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=quickbite@upi&pn=QuickBite&am=${toPay.toFixed(2)}`)}`} 
                              alt="UPI QR Code" 
                              style={{display: 'block', margin: '0 auto'}}
                            />
                          </div>
                          <p style={{fontSize: '0.9rem', color: '#475569', margin: 0}}>Scan with any UPI app to pay <strong>₹{toPay.toFixed(2)}</strong></p>
                        </div>
                      )}
                    </div>

                    <div className={`cp-payment-method-container ${paymentMethod === 'cod' ? 'active-container' : ''}`}>
                      <label className={`cp-payment-card ${paymentMethod === 'cod' ? 'active' : ''}`} style={{marginBottom: '12px'}}>
                        <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                        <div className="cp-payment-info">
                          <span className="cp-payment-title">Cash on Delivery</span>
                          <span className="cp-payment-desc">Pay when your order arrives</span>
                        </div>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="cp-payment-wallet-only text-green">
                    <span>✨ Wallet payment selected (Full amount covered)</span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <aside className="cp-sidebar">
            <div className="cp-summary-card">
              <h2>{activeTab === 'food' ? 'Food' : 'Grocery'} Order</h2>
              <p className="text-muted" style={{ marginBottom: '16px', fontSize: '0.9rem' }}>Ordering from <strong>{restaurantName}</strong></p>
              
              <div className="cp-items">
                {items.map(item => (
                  <div key={item.menu_item_id} className="cp-item">
                    <div className={`veg-indicator ${item.is_veg ? '' : 'non-veg'}`} />
                    <span className="cp-item-name">{item.name} x{item.quantity}</span>
                    <span className="cp-item-price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="cp-promo-section mt-4">
                <label className="cp-label">🏷️ Apply Promo Code</label>
                <div className="cp-promo-input-wrap">
                  <input 
                    type="text" 
                    className="input-field input-sm" 
                    placeholder="Enter code (e.g. FLAT50)"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    disabled={appliedPromo !== null}
                  />
                  {appliedPromo ? (
                    <button className="btn btn-secondary btn-sm" onClick={handleRemovePromo}>Remove</button>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => handleApplyPromo()}>Apply</button>
                  )}
                </div>
                {promoError && <div className="cp-promo-error text-red mt-1">{promoError}</div>}
                {promoSuccess && <div className="cp-promo-success text-green mt-1">{promoSuccess}</div>}

                {activePromos.length > 0 && !appliedPromo && (
                  <div className="cp-available-promos">
                    <span className="cp-promo-subtitle">Available Offers:</span>
                    <div className="cp-promos-list">
                      {activePromos.slice(0, 3).map(promo => (
                        <div 
                          key={promo.id} 
                          className="cp-promo-badge-item"
                          onClick={() => {
                            setPromoCodeInput(promo.code);
                            handleApplyPromo(promo.code);
                          }}
                        >
                          <span className="promo-badge">{promo.code}</span>
                          <span className="promo-desc">{promo.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="cp-form-group mt-4">
                <label className="cp-label"><Info size={14} /> Any instructions for the {activeTab === 'grocery' ? 'store' : 'restaurant'}?</label>
                <input 
                  type="text" 
                  className="input-field input-sm" 
                  placeholder={activeTab === 'grocery' ? "E.g. Pack carefully..." : "E.g. Make it spicy, no onions..."}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              <div className="cp-bill">
                <div className="cp-bill-row">
                  <span>Item Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="cp-bill-row">
                  <span>Delivery Fee</span>
                  <span>₹{delivery_fee.toFixed(2)}</span>
                </div>
                <div className="cp-bill-row">
                  <span>Taxes & Charges</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="cp-bill-row text-green">
                    <span>Promo Discount ({appliedPromo?.code})</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                {useWallet && walletDeduction > 0 && (
                  <div className="cp-bill-row text-primary">
                    <span>Wallet Deduction</span>
                    <span>-₹{walletDeduction.toFixed(2)}</span>
                  </div>
                )}
                <div className="cp-bill-divider" />
                <div className="cp-bill-total">
                  <span>To Pay</span>
                  <span>₹{toPay.toFixed(2)}</span>
                </div>
              </div>

              {error && <div className="cp-error">{error}</div>}

              <button 
                className={`btn btn-primary cp-checkout-btn ${isSubmitting ? 'loading' : ''}`}
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : (paymentMethod === 'cod' || toPay === 0 ? 'Place Order' : `Pay ₹${toPay.toFixed(2)} & Place Order`)}
                {!isSubmitting && <ChevronRight size={18} />}
              </button>
            </div>
          </aside>
        </div>
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="order-success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="order-success-card"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="success-icon-wrap">
                <CheckCircle size={80} className="text-green" />
              </div>
              <h2>Order Placed!</h2>
              <p>Your {activeTab === 'grocery' ? 'grocery' : 'delicious food'} is on its way.</p>
              <div className="success-loader">
                <div className="success-loader-bar"></div>
              </div>
              <p className="redirect-text">Redirecting to tracking...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
