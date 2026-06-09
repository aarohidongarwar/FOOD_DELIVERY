import { create } from 'zustand';

// Get current logged-in user's token
const getToken = () => localStorage.getItem('quickbite_token');

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem(getCartKey()) || '[]'),
  restaurantId: localStorage.getItem(getRestaurantKey()) || null,
  restaurantName: localStorage.getItem(getRestaurantNameKey()) || '',
  deliveryFee: 29,

  // Sync with server if logged in
  syncFromServer: async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const restaurantId = data[0].restaurant_id;
          const restaurantName = data[0].restaurant_name;
          const mappedItems = data.map(i => ({
            menu_item_id: i.menu_item_id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image_url: i.image_url,
            is_veg: i.is_veg
          }));
          localStorage.setItem(getCartKey(), JSON.stringify(mappedItems));
          localStorage.setItem(getRestaurantKey(), restaurantId);
          localStorage.setItem(getRestaurantNameKey(), restaurantName);
          set({ items: mappedItems, restaurantId, restaurantName });
        }
      }
    } catch (err) { console.error('Failed to sync cart from server:', err); }
  },

  addItem: async (item, restaurantId, restaurantName) => {
    const state = get();

    if (state.restaurantId && state.restaurantId !== restaurantId) {
      if (!window.confirm('Your cart contains items from another restaurant. Clear cart and add this item?')) {
        return false;
      }
      get().clearCart();
    }

    const existing = get().items.find(i => i.menu_item_id === item.id);
    let newItems;

    if (existing) {
      newItems = get().items.map(i =>
        i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...(get().restaurantId === restaurantId ? get().items : []), {
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

    // Server call
    const token = getToken();
    if (token) {
      fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restaurant_id: restaurantId, menu_item_id: item.id, quantity: 1 })
      }).catch(console.error);
    }
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

    const token = getToken();
    if (token) {
      fetch(`${API_URL}/cart/${menuItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
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

    const token = getToken();
    if (token) {
      fetch(`${API_URL}/cart/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity })
      }).catch(console.error);
    }
  },

  clearCart: () => {
    localStorage.removeItem(getCartKey());
    localStorage.removeItem(getRestaurantKey());
    localStorage.removeItem(getRestaurantNameKey());
    set({ items: [], restaurantId: null, restaurantName: '' });

    const token = getToken();
    if (token) {
      fetch(`${API_URL}/cart`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
  },

  refreshCart: () => {
    set(() => {
      const items = JSON.parse(localStorage.getItem(getCartKey()) || '[]');
      const restaurantId = localStorage.getItem(getRestaurantKey()) || null;
      const restaurantName = localStorage.getItem(getRestaurantNameKey()) || '';
      return { items, restaurantId, restaurantName };
    });
    get().syncFromServer();
  },

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getTotal: () => get().getSubtotal() + get().deliveryFee,
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getItemQuantity: (menuItemId) => get().items.find(i => i.menu_item_id === menuItemId)?.quantity || 0,
}));

export default useCartStore;
