'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Spinner } from '@/components/ui/Spinner';

export default function OnboardingLayoutClient({ children }: { children: ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();
  const isCompleteProfile = pathname?.endsWith('/complete-profile') ?? false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary to-primary-700">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary to-primary-700">
      <div
        className={
          isCompleteProfile
            ? 'max-w-2xl mx-auto px-6 py-8 lg:py-12'
            : 'max-w-5xl mx-auto px-6 py-10 lg:py-16'
        }
      >
        {/* Logo */}
        <div className={isCompleteProfile ? 'flex justify-center mb-8' : 'flex justify-center mb-10'}>
          <Image
            src="/branding/fulllogo_transparent_nobuffer.png"
            alt="Dokal"
            width={isCompleteProfile ? 140 : 160}
            height={isCompleteProfile ? 46 : 52}
            priority
            className="brightness-0 invert"
          />
        </div>

        {/* Main panel */}
        <div
          className={
            isCompleteProfile
              ? 'bg-white rounded-3xl shadow-2xl shadow-black/20 border border-white/20 p-6 sm:p-8'
              : 'bg-white rounded-3xl shadow-2xl shadow-black/20 border border-white/20 p-8 sm:p-10'
          }
        >
          {children}
        </div>

        {/* Footer branding */}
        <p className={isCompleteProfile ? 'text-center text-xs text-white/40 mt-6' : 'text-center text-xs text-white/40 mt-8'}>
          © 2026 Dokal. All rights reserved.
        </p>
      </div>
    </div>
  );
}

