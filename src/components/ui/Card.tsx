import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  id?: string;
}

export function Card({ children, className, padding = true, id }: CardProps) {
  return (
    <div id={id} className={cn('bg-card rounded-2xl shadow-card border border-border/50', padding && 'p-6', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h3>
  );
}
