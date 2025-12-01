import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: ToastAction;
}

interface ToastStore {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number, action?: ToastAction) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  showToast: (message: string, type: ToastType = 'info', duration = 3000, action?: ToastAction) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration, action };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

/**
 * Hook for using toast notifications
 * Usage: const { showToast } = useToast();
 *        showToast('Success!', 'success');
 */
export function useToast() {
  const { showToast, removeToast } = useToastStore();
  
  return {
    showToast,
    removeToast,
    success: (message: string, duration?: number, action?: ToastAction) => showToast(message, 'success', duration, action),
    error: (message: string, duration?: number, action?: ToastAction) => showToast(message, 'error', duration, action),
    info: (message: string, duration?: number, action?: ToastAction) => showToast(message, 'info', duration, action),
    warning: (message: string, duration?: number, action?: ToastAction) => showToast(message, 'warning', duration, action),
  };
}
