import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'secondary';
}

const variantClasses: Record<string, string> = {
  default: 'bg-primary-50 text-primary-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  destructive: 'bg-red-100 text-red-800',
  secondary: 'bg-gray-100 text-gray-700',
};

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
