import { create } from 'zustand';
import api from '../api';

const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,

  placeOrder: async (orderData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/orders', orderData);
      set({ loading: false, currentOrder: data });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to place order';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  fetchMyOrders: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/orders/my-orders');
      set({ orders: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchOrder: async (id) => {
    set({ loading: true, currentOrder: null });
    try {
      const { data } = await api.get(`/orders/${id}`);
      set({ currentOrder: data, loading: false });
      return data;
    } catch {
      set({ loading: false });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      // Update in list
      set(state => ({
        orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o),
        currentOrder: state.currentOrder?.id === orderId ? { ...state.currentOrder, status } : state.currentOrder,
      }));
      return data;
    } catch (err) {
      throw err;
    }
  },

  submitReview: async (orderId, rating, comment) => {
    try {
      await api.post(`/orders/${orderId}/review`, { rating, comment });
    } catch (err) {
      throw err;
    }
  },

  setCurrentOrder: (order) => set({ currentOrder: order }),
}));

export default useOrderStore;
