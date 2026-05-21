import { create } from 'zustand';

const useLocationStore = create((set) => ({
  userLocation: (() => {
    const saved = localStorage.getItem('quickbite_user_location');
    return saved ? JSON.parse(saved) : null;
  })(),
  savedAddresses: (() => {
    const saved = localStorage.getItem('quickbite_saved_addresses');
    return saved ? JSON.parse(saved) : [];
  })(),
  showLocationPopup: false,

  setUserLocation: (location) => {
    localStorage.setItem('quickbite_user_location', JSON.stringify(location));
    set({ userLocation: location });
  },

  setShowLocationPopup: (show) => set({ showLocationPopup: show }),

  addSavedAddress: (address) => set((state) => {
    const updated = [address, ...state.savedAddresses.filter(a => a.id !== address.id)];
    localStorage.setItem('quickbite_saved_addresses', JSON.stringify(updated));
    return { savedAddresses: updated };
  }),

  removeSavedAddress: (id) => set((state) => {
    const updated = state.savedAddresses.filter(a => a.id !== id);
    localStorage.setItem('quickbite_saved_addresses', JSON.stringify(updated));
    return { savedAddresses: updated };
  }),

  clearLocation: () => {
    localStorage.removeItem('quickbite_user_location');
    set({ userLocation: null });
  }
}));

export default useLocationStore;
