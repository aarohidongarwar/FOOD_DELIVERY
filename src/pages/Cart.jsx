import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CreditCard, ShoppingBag, Info, ChevronRight, CheckCircle } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';
import useOrderStore from '../stores/orderStore';
import './Cart.css';

export default function Cart() {
  const { items, restaurantId, restaurantName, deliveryFee, getSubtotal, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { placeOrder } = useOrderStore();
  const navigate = useNavigate();

  const [address, setAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="cart-page empty-cart-page container">
        <ShoppingBag size={80} className="text-muted" />
        <h2>Your cart is empty</h2>
        <p>You can go to home page to view more restaurants</p>
        <Link to="/restaurants" className="btn btn-primary mt-4">See restaurants near you</Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { returnTo: '/cart' } });
      return;
    }

    if (!address.trim()) {
      setError('Delivery address is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const orderData = {
        restaurant_id: restaurantId,
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, special_instructions: instructions })),
        delivery_address: address,
        payment_method: paymentMethod
      };

      const newOrder = await placeOrder(orderData);
      clearCart();
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
        <p>Ordering from <strong>{restaurantName}</strong></p>
      </div>

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
            <div className="cp-section-header">
              <CreditCard size={20} className="text-primary" />
              <h2>Payment Method</h2>
            </div>
            <div className="cp-payment-methods">
              <label className={`cp-payment-card ${paymentMethod === 'card' ? 'active' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                <div className="cp-payment-info">
                  <span className="cp-payment-title">Credit / Debit Card</span>
                  <span className="cp-payment-desc">Pay securely with your card</span>
                </div>
              </label>
              <label className={`cp-payment-card ${paymentMethod === 'upi' ? 'active' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                <div className="cp-payment-info">
                  <span className="cp-payment-title">UPI</span>
                  <span className="cp-payment-desc">Google Pay, PhonePe, Paytm</span>
                </div>
              </label>
              <label className={`cp-payment-card ${paymentMethod === 'cod' ? 'active' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <div className="cp-payment-info">
                  <span className="cp-payment-title">Cash on Delivery</span>
                  <span className="cp-payment-desc">Pay when your food arrives</span>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="cp-sidebar">
          <div className="cp-summary-card">
            <h2>Order Summary</h2>
            
            <div className="cp-items">
              {items.map(item => (
                <div key={item.menu_item_id} className="cp-item">
                  <div className={`veg-indicator ${item.is_veg ? '' : 'non-veg'}`} />
                  <span className="cp-item-name">{item.name} x{item.quantity}</span>
                  <span className="cp-item-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="cp-form-group mt-4">
              <label className="cp-label"><Info size={14} /> Any instructions for the restaurant?</label>
              <input 
                type="text" 
                className="input-field input-sm" 
                placeholder="E.g. Make it spicy, no onions..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="cp-bill">
              <div className="cp-bill-row">
                <span>Item Total</span>
                <span>₹{getSubtotal()}</span>
              </div>
              <div className="cp-bill-row">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="cp-bill-row">
                <span>Taxes & Charges</span>
                <span>₹{(getSubtotal() * 0.05).toFixed(2)}</span>
              </div>
              <div className="cp-bill-divider" />
              <div className="cp-bill-total">
                <span>To Pay</span>
                <span>₹{(getTotal() + (getSubtotal() * 0.05)).toFixed(2)}</span>
              </div>
            </div>

            {error && <div className="cp-error">{error}</div>}

            <button 
              className={`btn btn-primary cp-checkout-btn ${isSubmitting ? 'loading' : ''}`}
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Place Order'}
              {!isSubmitting && <ChevronRight size={18} />}
            </button>
          </div>
        </aside>
      </div>

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
              <p>Your delicious food is on its way.</p>
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
