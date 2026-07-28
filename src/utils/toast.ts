export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

type ToastListener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let listeners: ToastListener[] = [];

export const toast = {
  show: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    toasts = [...toasts, { id, type, message }];
    listeners.forEach(fn => fn(toasts));

    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      listeners.forEach(fn => fn(toasts));
    }, 3500);
  },
  success: (message: string) => toast.show(message, 'success'),
  error: (message: string) => toast.show(message, 'error'),
  warning: (message: string) => toast.show(message, 'warning'),
  info: (message: string) => toast.show(message, 'info'),
  subscribe: (fn: ToastListener) => {
    listeners.push(fn);
    fn(toasts);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  }
};
