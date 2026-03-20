'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ContentHaloWrapProps = {
  children: ReactNode;
  className?: string;
  /** Rayon des coins du halo (aligné sur l’enfant) */
  rounded?: string;
};

/**
 * Halos diffus type mockup mobile — derrière captures, cartes pricing, etc.
 */
export function ContentHaloWrap({
  children,
  className,
  rounded = 'rounded-2xl',
}: ContentHaloWrapProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'pointer-events-none absolute -inset-10 -z-10 bg-gradient-to-br from-primary-400/28 via-primary-500/14 to-transparent blur-3xl',
          rounded
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute -inset-6 -z-10 bg-primary-300/22 blur-2xl',
          rounded
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute -inset-3 -z-10 bg-primary-400/10 blur-xl',
          rounded
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}
