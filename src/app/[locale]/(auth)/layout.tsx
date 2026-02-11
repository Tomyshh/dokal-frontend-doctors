import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary to-primary-700 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/branding/fulllogo_transparent_nobuffer.png"
            alt="Dokal"
            width={160}
            height={52}
            priority
            className="brightness-0 invert"
          />
        </div>
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 border border-white/20 p-8 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
