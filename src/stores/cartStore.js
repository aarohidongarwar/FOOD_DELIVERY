import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: JSON.parse(localStorage.getItem('quickbite_cart') || '[]'),
  restaurantId: localStorage.getItem('quickbite_cart_restaurant') || null,
  restaurantName: localStorage.getItem('quickbite_cart_restaurant_name') || '',
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

    localStorage.setItem('quickbite_cart', JSON.stringify(newItems));
    localStorage.setItem('quickbite_cart_restaurant', restaurantId);
    localStorage.setItem('quickbite_cart_restaurant_name', restaurantName);
    set({ items: newItems, restaurantId, restaurantName, deliveryFee: item.delivery_fee || 29 });
    return true;
  },

  removeItem: (menuItemId) => {
    const newItems = get().items.filter(i => i.menu_item_id !== menuItemId);
    localStorage.setItem('quickbite_cart', JSON.stringify(newItems));
    if (newItems.length === 0) {
      localStorage.removeItem('quickbite_cart_restaurant');
      localStorage.removeItem('quickbite_cart_restaurant_name');
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
    localStorage.setItem('quickbite_cart', JSON.stringify(newItems));
    set({ items: newItems });
  },

  clearCart: () => {
    localStorage.removeItem('quickbite_cart');
    localStorage.removeItem('quickbite_cart_restaurant');
    localStorage.removeItem('quickbite_cart_restaurant_name');
    set({ items: [], restaurantId: null, restaurantName: '' });
  },

  getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  getTotal: () => get().getSubtotal() + get().deliveryFee,
  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getItemQuantity: (menuItemId) => get().items.find(i => i.menu_item_id === menuItemId)?.quantity || 0,
}));

export default useCartStore;
