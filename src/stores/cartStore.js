import { create } from 'zustand';

// Get current logged-in user's ID for scoping cart data
const getUserId = () => {
  try {
    const userStr = localStorage.getItem('quickbite_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || 'guest';
    }
  } catch { }
  return 'guest';
};

const getCartKey = () => `quickbite_cart_${getUserId()}`;
const getRestaurantKey = () => `quickbite_cart_restaurant_${getUserId()}`;
const getRestaurantNameKey = () => `quickbite_cart_restaurant_name_${getUserId()}`;

const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem(getCartKey()) || '[]'),
  restaurantId: localStorage.getItem(getRestaurantKey()) || null,
  restaurantName: localStorage.getItem(getRestaurantNameKey()) || '',
  deliveryFee: 29,

  addItem: (item, restaurantId, restaurantName) => {
    const state = get();

    // If cart has items from a different restaurant, clear first
    if (state.restaurantId && state.restaurantId !== restaurantId) {
      if (!window.confirm('Your cart contains items from another restaurant. Clear cart and add this item?')) {
        return false;
      }
      set({ items: [], restaurantId: null, restaurantName: '' });
    }

    const existing = state.items.find(i => i.menu_item_id === item.id);
    let newItems;

    if (existing) {
      newItems = state.items.map(i =>
        i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...(state.restaurantId === restaurantId ? state.items : []), {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url,
        is_veg: item.is_veg,
      }];
    }

    localStorage.setItem(getCartKey(), JSON.stringify(newItems));
    localStorage.setItem(getRestaurantKey(), restaurantId);
    localStorage.setItem(getRestaurantNameKey(), restaurantName);
    set({ items: newItems, restaurantId, restaurantName, deliveryFee: item.delivery_fee || 29 });
    return true;
  },

  removeItem: (menuItemId) => {
    const newItems = get().items.filter(i => i.menu_item_id !== menuItemId);
    localStorage.setItem(getCartKey(), JSON.stringify(newItems));
    if (newItems.length === 0) {
      localStorage.removeItem(getRestaurantKey());
      localStorage.removeItem(getRestaurantNameKey());
      set({ items: newItems, restaurantId: null, restaurantName: '' });
    } else {
      set({ items: newItems });
    }
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    const newItems = get().items.map(i =>
      i.menu_item_id === menuItemId ? { ...i, quantity } : i
    );
    localStorage.setItem(getCartKey(), JSON.stringify(newItems));
    set({ items: newItems });
  },

  clearCart: () => {
    localStorage.removeItem(getCartKey());
    localStorage.removeItem(getRestaurantKey());
    localStorage.removeItem(getRestaurantNameKey());
    set({ items: [], restaurantId: null, restaurantName: '' });
  },

  // Called after login to load the correct user's cart into memory
  refreshCart: () => set(() => {
    const items = JSON.parse(localStorage.getItem(getCartKey()) || '[]');
    const restaurantId = localStorage.getItem(getRestaurantKey()) || null;
    const restaurantName = localStorage.getItem(getRestaurantNameKey()) || '';
    return { items, restaurantId, restaurantName };
  }),

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getTotal: () => get().getSubtotal() + get().deliveryFee,
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getItemQuantity: (menuItemId) => get().items.find(i => i.menu_item_id === menuItemId)?.quantity || 0,
}));

export default useCartStore;
