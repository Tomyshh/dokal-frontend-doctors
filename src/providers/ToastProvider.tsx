'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { ToastContainer, type ToastData, type ToastVariant } from '@/components/ui/Toast';

// ─── Types ─────────────────────────────────────────────────────────────────
interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  /** Show a toast with explicit variant */
  toast: (variant: ToastVariant, options: ToastOptions) => void;
  /** Shortcut: success toast */
  success: (title: string, message?: string) => void;
  /** Shortcut: error toast */
  error: (title: string, message?: string) => void;
  /** Shortcut: warning toast */
  warning: (title: string, message?: string) => void;
  /** Shortcut: info toast */
  info: (title: string, message?: string) => void;
  /** Dismiss a toast by id */
  dismiss: (id: string) => void;
  /** Dismiss all toasts */
  dismissAll: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

// ─── Provider ──────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback(
    (variant: ToastVariant, options: ToastOptions) => {
      const id = `toast-${++toastCounter}-${Date.now()}`;
      const newToast: ToastData = {
        id,
        variant,
        title: options.title,
        message: options.message,
        duration: options.duration,
      };
      // Max 5 toasts at once
      setToasts((prev) => [...prev.slice(-4), newToast]);
    },
    [],
  );

  const success = useCallback(
    (title: string, message?: string) => showToast('success', { title, message }),
    [showToast],
  );

  const error = useCallback(
    (title: string, message?: string) => showToast('error', { title, message }),
    [showToast],
  );

  const warning = useCallback(
    (title: string, message?: string) => showToast('warning', { title, message }),
    [showToast],
  );

  const info = useCallback(
    (title: string, message?: string) => showToast('info', { title, message }),
    [showToast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toast: showToast, success, error, warning, info, dismiss, dismissAll }),
    [showToast, success, error, warning, info, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
