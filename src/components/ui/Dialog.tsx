'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  title?: string;
  bodyClassName?: string;
  overlayClassName?: string;
}

export function Dialog({ open, onClose, children, className, title, bodyClassName, overlayClassName }: DialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn('fixed inset-0 bg-black/40 backdrop-blur-sm', overlayClassName)}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-50 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto w-full max-w-lg mx-4 animate-in fade-in zoom-in-95',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between p-6 pb-0">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn('p-6', bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}
