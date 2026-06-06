import { create } from 'zustand';

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

const getSavedAddressesKey = () => `quickbite_saved_addresses_${getUserId()}`;

const useLocationStore = create((set) => ({
  userLocation: (() => {
    const saved = localStorage.getItem('quickbite_user_location');
    return saved ? JSON.parse(saved) : null;
  })(),
  savedAddresses: (() => {
    const saved = localStorage.getItem(getSavedAddressesKey());
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
    localStorage.setItem(getSavedAddressesKey(), JSON.stringify(updated));
    return { savedAddresses: updated };
  }),

  removeSavedAddress: (id) => set((state) => {
    const updated = state.savedAddresses.filter(a => a.id !== id);
    localStorage.setItem(getSavedAddressesKey(), JSON.stringify(updated));
    return { savedAddresses: updated };
  }),

  refreshSavedAddresses: () => set(() => {
    const saved = localStorage.getItem(getSavedAddressesKey());
    return { savedAddresses: saved ? JSON.parse(saved) : [] };
  }),

  clearLocation: () => {
    localStorage.removeItem('quickbite_user_location');
    set({ userLocation: null });
  }
}));

export default useLocationStore;
