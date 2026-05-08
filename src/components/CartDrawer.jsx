import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import './CartDrawer.css';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, restaurantName, deliveryFee, getSubtotal, getTotal, updateQuantity, clearCart } = useCartStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/cart');
  };

  if (!isOpen) return null;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="cart-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag size={64} className="cart-empty-icon" />
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <button className="btn btn-primary" onClick={onClose}>
              Browse Restaurants
            </button>
          </div>
        ) : (
          <>
            <div className="cart-restaurant-info">
              <p className="cart-restaurant-name">Ordering from <strong>{restaurantName}</strong></p>
              <button className="cart-clear-btn" onClick={clearCart}>
                <Trash2 size={14} /> Clear
              </button>
            </div>

            <div className="cart-items">
              {items.map(item => (
                <div key={item.menu_item_id} className="cart-item">
                  <div className={`veg-indicator ${item.is_veg ? '' : 'non-veg'}`} />
                  <div className="cart-item-details">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="cart-qty-control">
                    <button className="cart-qty-btn" onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}>
                      <Minus size={14} />
                    </button>
                    <span className="cart-qty">{item.quantity}</span>
                    <button className="cart-qty-btn" onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>₹{getSubtotal()}</span>
              </div>
              <div className="cart-summary-row">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="cart-summary-divider" />
              <div className="cart-summary-total">
                <span>Total</span>
                <span>₹{getTotal()}</span>
              </div>
              <button className="btn btn-primary cart-checkout-btn" onClick={handleCheckout}>
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
