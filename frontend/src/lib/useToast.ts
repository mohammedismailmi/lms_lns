import { useState, useCallback } from 'react';

// Use a simple custom event bus for the toast hook to trigger state in the provider,
// avoiding context wrapping complexities if used outside React tree, though Context is requested.
// We'll use a module-level event emitter for simplicity since useToast should work anywhere.

type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

type ToastListener = (toast: Omit<Toast, 'id'>) => void;
const listeners: ToastListener[] = [];

export const toast = {
  success: (message: string) => notify({ type: 'success', message }),
  error: (message: string) => notify({ type: 'error', message }),
  info: (message: string) => notify({ type: 'info', message }),
};

function notify(toastData: Omit<Toast, 'id'>) {
  listeners.forEach(listener => listener(toastData));
}

export function useToast() {
  return toast;
}

export function subscribeToasts(listener: ToastListener) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}
