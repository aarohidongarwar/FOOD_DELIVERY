import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, Utensils, ShoppingBasket } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import './CartDrawer.css';

export default function CartDrawer({ isOpen, onClose }) {
  const { carts, getSubtotal, getTotal, updateQuantity, clearCart } = useCartStore();
  const navigate = useNavigate();

  const hasFood = carts.food.items.length > 0;
  const hasGrocery = carts.grocery.items.length > 0;

  const [activeTab, setActiveTab] = useState('food');

  useEffect(() => {
    if (isOpen) {
      if (hasFood && !hasGrocery) setActiveTab('food');
      else if (hasGrocery && !hasFood) setActiveTab('grocery');
      else if (hasFood && hasGrocery && activeTab !== 'food' && activeTab !== 'grocery') setActiveTab('food');
    }
  }, [isOpen, hasFood, hasGrocery]);

  // Fallback to the other tab if the active one is cleared
  useEffect(() => {
    if (activeTab === 'food' && !hasFood && hasGrocery) setActiveTab('grocery');
    if (activeTab === 'grocery' && !hasGrocery && hasFood) setActiveTab('food');
  }, [hasFood, hasGrocery, activeTab]);

  const activeCart = carts[activeTab];
  const items = activeCart.items;
  const restaurantName = activeCart.restaurantName;
  const deliveryFee = activeCart.deliveryFee;

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

        {(hasFood && hasGrocery) && (
          <div className="cart-tabs" style={{ display: 'flex', gap: '8px', padding: '0 24px 16px', borderBottom: '1px solid #e2e8f0' }}>
            <button 
              className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setActiveTab('food')}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px' }}
            >
              <Utensils size={14} /> Food ({carts.food.items.reduce((s, i) => s + i.quantity, 0)})
            </button>
            <button 
              className={`btn ${activeTab === 'grocery' ? 'btn-primary' : 'btn-outline'} btn-sm`}
              onClick={() => setActiveTab('grocery')}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px' }}
            >
              <ShoppingBasket size={14} /> Grocery ({carts.grocery.items.reduce((s, i) => s + i.quantity, 0)})
            </button>
          </div>
        )}

        {!hasFood && !hasGrocery ? (
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
            {items.length === 0 ? (
              <div className="cart-empty">
                <p>No items in your {activeTab} cart.</p>
              </div>
            ) : (
              <>
                <div className="cart-restaurant-info">
                  <p className="cart-restaurant-name">Ordering from <strong>{restaurantName}</strong></p>
                  <button className="cart-clear-btn" onClick={() => clearCart(activeTab)}>
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
                        <button className="cart-qty-btn" onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1, activeTab)}>
                          <Minus size={14} />
                        </button>
                        <span className="cart-qty">{item.quantity}</span>
                        <button className="cart-qty-btn" onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1, activeTab)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span>₹{getSubtotal(activeTab)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="cart-summary-divider" />
                  <div className="cart-summary-total">
                    <span>Total</span>
                    <span>₹{getTotal(activeTab)}</span>
                  </div>
                  <button className="btn btn-primary cart-checkout-btn" onClick={handleCheckout}>
                    Checkout {activeTab === 'grocery' ? 'Grocery' : 'Food'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
