import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../stores/authStore';
import useNotificationStore from '../stores/notificationStore';
import useToastStore from '../stores/toastStore';

export default function GlobalSocket() {
  const { user } = useAuthStore();
  const { addNotification, fetchNotifications } = useNotificationStore();
  const toast = useToastStore();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      const socket = io('/', { path: '/socket.io' });
      socket.emit('register', user.id);
      
      socket.on('notification', (notif) => {
        addNotification(notif);
        toast.info(notif.message, { title: notif.title });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [user, addNotification, fetchNotifications]);

  return null;
}
