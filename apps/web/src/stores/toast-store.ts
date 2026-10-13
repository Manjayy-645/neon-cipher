import { create } from 'zustand';

export interface ToastData {
  id: string;
  message: string;
  type?: 'info' | 'locked' | 'success' | 'error';
  duration?: number;
}

interface ToastState {
  toast: ToastData | null;
  showToast: (message: string, options?: { type?: 'info' | 'locked' | 'success' | 'error'; duration?: number }) => void;
  hideToast: () => void;
}

let toastTimer: NodeJS.Timeout | null = null;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  showToast: (message, options) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    const duration = options?.duration ?? 2500;
    const toastData: ToastData = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type: options?.type ?? 'info',
      duration,
    };

    set({ toast: toastData });

    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, duration);
  },
  hideToast: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set({ toast: null });
  },
}));

// Convenience helper to trigger toasts outside React components
export function triggerToast(message: string, options?: { type?: 'info' | 'locked' | 'success' | 'error'; duration?: number }) {
  useToastStore.getState().showToast(message, options);
}
