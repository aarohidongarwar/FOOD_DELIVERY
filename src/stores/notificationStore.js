import { create } from 'zustand';
import api from '../api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  fetchNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      set({ 
        notifications: data,
        unreadCount: data.filter(n => !n.is_read).length
      });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set(state => {
        const newNotifs = state.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        );
        return {
          notifications: newNotifs,
          unreadCount: newNotifs.filter(n => !n.is_read).length
        };
      });
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/mark-read');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  },

  addNotification: (notification) => {
    set(state => {
      // Check if already exists to prevent duplicates
      if (state.notifications.some(n => n.id === notification.id)) return state;
      const newNotifs = [notification, ...state.notifications];
      return {
        notifications: newNotifs,
        unreadCount: newNotifs.filter(n => !n.is_read).length
      };
    });
  }
}));

export default useNotificationStore;
