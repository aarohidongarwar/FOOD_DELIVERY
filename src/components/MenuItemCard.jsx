import { Plus, Minus } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import './MenuItemCard.css';

export default function MenuItemCard({ item, restaurantId, restaurantName }) {
  const { addItem, updateQuantity, getItemQuantity } = useCartStore();
  const qty = getItemQuantity(item.id);

  const handleAdd = () => {
    addItem(item, restaurantId, restaurantName);
  };

  return (
    <div className="menu-item-card" id={`menu-item-${item.id}`}>
      <div className="mic-info">
        <div className="mic-header">
          <div className={`veg-indicator ${item.is_veg ? '' : 'non-veg'}`} />
          {item.is_bestseller ? <span className="mic-bestseller">★ Bestseller</span> : null}
        </div>
        <h4 className="mic-name">{item.name}</h4>
        <p className="mic-price">₹{item.price}</p>
        {item.description && <p className="mic-desc">{item.description}</p>}
      </div>

      <div className="mic-right">
        {item.image_url && (
          <div className="mic-image-wrap">
            <img src={item.image_url} alt={item.name} className="mic-image" loading="lazy" />
          </div>
        )}

        <div className="mic-actions">
          {qty === 0 ? (
            <button className="mic-add-btn" onClick={handleAdd}>
              ADD
              <Plus size={14} />
            </button>
          ) : (
            <div className="mic-qty-control">
              <button className="mic-qty-btn" onClick={() => updateQuantity(item.id, qty - 1)}>
                <Minus size={14} />
              </button>
              <span className="mic-qty">{qty}</span>
              <button className="mic-qty-btn" onClick={() => updateQuantity(item.id, qty + 1)}>
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
