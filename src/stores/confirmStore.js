import { create } from 'zustand';

const useConfirmStore = create((set) => ({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default', // 'default' | 'danger'
  onConfirm: null,
  onCancel: null,

  confirm: ({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default' }) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => { set({ isOpen: false }); resolve(true); },
        onCancel: () => { set({ isOpen: false }); resolve(false); },
      });
    });
  },

  close: () => set({ isOpen: false }),
}));

export default useConfirmStore;
