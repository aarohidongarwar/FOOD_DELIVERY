import { create } from 'zustand';
import api from '../api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('quickbite_user') || 'null'),
  token: localStorage.getItem('quickbite_token') || null,
  loading: false,
  error: null,

  setUser: (user) => {
    localStorage.setItem('quickbite_user', JSON.stringify(user));
    set({ user });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('quickbite_token', data.token);
      localStorage.setItem('quickbite_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  register: async (registrationData) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', registrationData);
      localStorage.setItem('quickbite_token', data.token);
      localStorage.setItem('quickbite_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('quickbite_token');
    localStorage.removeItem('quickbite_user');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('quickbite_token');
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('quickbite_user', JSON.stringify(data));
      set({ user: data, token });
    } catch {
      localStorage.removeItem('quickbite_token');
      localStorage.removeItem('quickbite_user');
      set({ user: null, token: null });
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true });
    try {
      const { data } = await api.put('/auth/profile', profileData);
      localStorage.setItem('quickbite_user', JSON.stringify(data));
      set({ user: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  isAuthenticated: () => !!get().token,
  isRole: (role) => get().user?.role === role,
}));

export default useAuthStore;
