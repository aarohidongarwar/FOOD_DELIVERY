import { create } from 'zustand';

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

const getCartsKey = () => `quickbite_carts_${getUserId()}`;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getDefaultCartState = () => ({
  items: [],
  restaurantId: null,
  restaurantName: '',
  deliveryFee: 29
});

const loadCarts = () => {
  try {
    const data = localStorage.getItem(getCartsKey());
    if (data) return JSON.parse(data);
  } catch (err) { console.error('Failed to parse carts', err); }
  return { food: getDefaultCartState(), grocery: getDefaultCartState() };
};

const saveCarts = (carts) => {
  localStorage.setItem(getCartsKey(), JSON.stringify(carts));
};

const useCartStore = create((set, get) => ({
  carts: loadCarts(),

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
        const newCarts = { food: getDefaultCartState(), grocery: getDefaultCartState() };
        
        if (data && data.length > 0) {
          data.forEach(i => {
            const type = i.cart_type || 'food';
            newCarts[type].restaurantId = i.restaurant_id;
            newCarts[type].restaurantName = i.restaurant_name;
            newCarts[type].items.push({
              menu_item_id: i.menu_item_id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              image_url: i.image_url,
              is_veg: i.is_veg,
              cart_type: type
            });
          });
        }
        set({ carts: newCarts });
        saveCarts(newCarts);
      }
    } catch (err) { console.error('Failed to sync cart from server:', err); }
  },

  addItem: async (item, restaurantId, restaurantName, cartType = 'food') => {
    const state = get();
    const currentCart = state.carts[cartType];

    if (currentCart.restaurantId && currentCart.restaurantId !== restaurantId) {
      if (!window.confirm(`Your ${cartType} cart contains items from another store. Clear it and add this item?`)) {
        return false;
      }
      get().clearCart(cartType);
    }

    const cartState = get().carts[cartType];
    const existing = cartState.items.find(i => i.menu_item_id === item.id);
    let newItems;

    if (existing) {
      newItems = cartState.items.map(i =>
        i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...(cartState.restaurantId === restaurantId ? cartState.items : []), {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image_url: item.image_url,
        is_veg: item.is_veg,
        cart_type: cartType
      }];
    }

    const newCarts = {
      ...get().carts,
      [cartType]: {
        items: newItems,
        restaurantId,
        restaurantName,
        deliveryFee: item.delivery_fee || 29
      }
    };

    set({ carts: newCarts });
    saveCarts(newCarts);

    // Server call
    const token = getToken();
    if (token) {
      fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ restaurant_id: restaurantId, menu_item_id: item.id, quantity: 1, cart_type: cartType })
      }).catch(console.error);
    }
    return true;
  },

  removeItem: (menuItemId, cartType = 'food') => {
    const cartState = get().carts[cartType];
    const newItems = cartState.items.filter(i => i.menu_item_id !== menuItemId);
    
    let updatedCart;
    if (newItems.length === 0) {
      updatedCart = getDefaultCartState();
    } else {
      updatedCart = { ...cartState, items: newItems };
    }

    const newCarts = { ...get().carts, [cartType]: updatedCart };
    set({ carts: newCarts });
    saveCarts(newCarts);

    const token = getToken();
    if (token) {
      fetch(`${API_URL}/cart/${menuItemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
  },

  updateQuantity: (menuItemId, quantity, cartType = 'food') => {
    if (quantity <= 0) {
      get().removeItem(menuItemId, cartType);
      return;
    }
    const cartState = get().carts[cartType];
    const newItems = cartState.items.map(i =>
      i.menu_item_id === menuItemId ? { ...i, quantity } : i
    );
    
    const newCarts = { ...get().carts, [cartType]: { ...cartState, items: newItems } };
    set({ carts: newCarts });
    saveCarts(newCarts);

    const token = getToken();
    if (token) {
      fetch(`${API_URL}/cart/${menuItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ quantity })
      }).catch(console.error);
    }
  },

  clearCart: (cartType = null) => {
    let newCarts;
    
    if (cartType) {
      newCarts = { ...get().carts, [cartType]: getDefaultCartState() };
    } else {
      newCarts = { food: getDefaultCartState(), grocery: getDefaultCartState() };
    }
    
    set({ carts: newCarts });
    saveCarts(newCarts);

    const token = getToken();
    if (token) {
      const url = cartType ? `${API_URL}/cart?cart_type=${cartType}` : `${API_URL}/cart`;
      fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
  },

  refreshCart: () => {
    set({ carts: loadCarts() });
    get().syncFromServer();
  },

  getSubtotal: (cartType = 'food') => get().carts[cartType].items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getTotal: (cartType = 'food') => {
    const subtotal = get().getSubtotal(cartType);
    return subtotal > 0 ? subtotal + get().carts[cartType].deliveryFee : 0;
  },
  getItemCount: (cartType = null) => {
    if (cartType) {
      return get().carts[cartType].items.reduce((sum, i) => sum + i.quantity, 0);
    }
    return get().carts.food.items.reduce((sum, i) => sum + i.quantity, 0) + 
           get().carts.grocery.items.reduce((sum, i) => sum + i.quantity, 0);
  },
  getItemQuantity: (menuItemId, cartType = 'food') => get().carts[cartType].items.find(i => i.menu_item_id === menuItemId)?.quantity || 0,
}));

export default useCartStore;
