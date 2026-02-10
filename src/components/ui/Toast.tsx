'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

// ─── Variant config ────────────────────────────────────────────────────────
const variantConfig: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    containerClass: string;
    iconClass: string;
    progressClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    containerClass:
      'bg-white border-success/30 shadow-[0_8px_32px_-4px_rgba(16,185,129,0.18)]',
    iconClass: 'text-success bg-success/10',
    progressClass: 'bg-success',
  },
  error: {
    icon: XCircle,
    containerClass:
      'bg-white border-destructive/30 shadow-[0_8px_32px_-4px_rgba(239,68,68,0.18)]',
    iconClass: 'text-destructive bg-destructive/10',
    progressClass: 'bg-destructive',
  },
  warning: {
    icon: AlertTriangle,
    containerClass:
      'bg-white border-warning/30 shadow-[0_8px_32px_-4px_rgba(245,158,11,0.18)]',
    iconClass: 'text-warning bg-warning/10',
    progressClass: 'bg-warning',
  },
  info: {
    icon: Info,
    containerClass:
      'bg-white border-primary/30 shadow-[0_8px_32px_-4px_rgba(0,80,68,0.14)]',
    iconClass: 'text-primary bg-primary/10',
    progressClass: 'bg-primary',
  },
};

// ─── Single Toast ──────────────────────────────────────────────────────────
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  const [state, setState] = useState<'entering' | 'visible' | 'exiting'>('entering');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const duration = toast.duration ?? 5000;
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  // Enter animation
  useEffect(() => {
    const enterTimer = setTimeout(() => setState('visible'), 20);
    return () => clearTimeout(enterTimer);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setState('exiting');
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [duration]);

  // Remove after exit animation
  useEffect(() => {
    if (state === 'exiting') {
      const exitTimer = setTimeout(() => onDismiss(toast.id), 300);
      return () => clearTimeout(exitTimer);
    }
  }, [state, toast.id, onDismiss]);

  const handleDismiss = () => {
    clearTimeout(timerRef.current);
    setState('exiting');
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'pointer-events-auto relative w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden',
        'rounded-2xl border backdrop-blur-sm',
        'transition-all duration-300 ease-out',
        config.containerClass,
        state === 'entering' && 'translate-x-full opacity-0 scale-95',
        state === 'visible' && 'translate-x-0 opacity-100 scale-100',
        state === 'exiting' && 'translate-x-full opacity-0 scale-95',
      )}
    >
      {/* Content */}
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            config.iconClass,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] w-full bg-gray-100">
        <div
          className={cn('h-full rounded-full', config.progressClass)}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Toast Container ───────────────────────────────────────────────────────
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
