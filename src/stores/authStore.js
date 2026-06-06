import { create } from 'zustand';
import api from '../api';
import useLocationStore from './locationStore';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('quickbite_user') || 'null'),
  token: localStorage.getItem('quickbite_token') || null,
  loading: false,
  error: null,
  wallet: { balance: 0, transactions: [] },

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
      
      // Refresh user-scoped data (cart + saved addresses) for the newly logged in user
      useLocationStore.getState().refreshSavedAddresses();
      import('./cartStore').then(mod => mod.default.getState().refreshCart());
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
      
      // Refresh user-scoped data (cart + saved addresses) for the newly registered user
      useLocationStore.getState().refreshSavedAddresses();
      import('./cartStore').then(mod => mod.default.getState().refreshCart());
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  // Full logout: clears auth session + active location, redirects to landing
  // NOTE: Cart and saved addresses are user-scoped and intentionally NOT cleared
  logout: () => {
    localStorage.removeItem('quickbite_token');
    localStorage.removeItem('quickbite_user');
    localStorage.removeItem('quickbite_user_location');
    
    set({ user: null, token: null });
    
    // Force reload to completely reset all stores
    window.location.href = '/';
  },

  // Silent logout: clears auth session without redirect (used by LandingPage auto-logout)
  // Cart and saved addresses are user-scoped and intentionally NOT cleared
  silentLogout: () => {
    localStorage.removeItem('quickbite_token');
    localStorage.removeItem('quickbite_user');
    localStorage.removeItem('quickbite_user_location');
    
    set({ user: null, token: null });

    // Reset in-memory states for current session
    useLocationStore.getState().clearLocation();
    import('./cartStore').then(mod => {
      mod.default.setState({ items: [], restaurantId: null, restaurantName: '' });
    });
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

  fetchWallet: async () => {
    try {
      const { data } = await api.get('/auth/wallet');
      set({ wallet: data });
      const user = get().user;
      if (user) {
        const updatedUser = { ...user, wallet_balance: data.balance };
        localStorage.setItem('quickbite_user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
      return data;
    } catch (err) {
      console.error('Fetch wallet error:', err);
    }
  },

  addWalletFunds: async (amount) => {
    try {
      const { data } = await api.post('/auth/wallet/add', { amount });
      await get().fetchWallet();
      return data;
    } catch (err) {
      console.error('Add wallet funds error:', err);
      throw err;
    }
  },

  isAuthenticated: () => !!get().token,
  isRole: (role) => get().user?.role === role,
}));

export default useAuthStore;
