import { create } from 'zustand';
import api from '../api';

const useRestaurantStore = create((set) => ({
  restaurants: [],
  currentRestaurant: null,
  cuisines: [],
  loading: false,
  error: null,

  fetchRestaurants: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/restaurants', { params });
      set({ restaurants: data, loading: false });
    } catch (err) {
      set({ error: 'Failed to load restaurants', loading: false });
    }
  },

  fetchRestaurant: async (id) => {
    set({ loading: true, error: null, currentRestaurant: null });
    try {
      const { data } = await api.get(`/restaurants/${id}`);
      set({ currentRestaurant: data, loading: false });
      return data;
    } catch (err) {
      set({ error: 'Failed to load restaurant', loading: false });
    }
  },

  fetchCuisines: async () => {
    try {
      const { data } = await api.get('/restaurants/meta/cuisines');
      set({ cuisines: data });
    } catch {}
  },

  clearCurrent: () => set({ currentRestaurant: null }),
}));

export default useRestaurantStore;
