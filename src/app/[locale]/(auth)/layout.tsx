import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            // Use colored logo (avoid white-on-white)
            src="/branding/fulllogo.png"
            alt="Dokal"
            width={180}
            height={60}
            priority
          />
        </div>
        {children}
      </div>
    </div>
  );
}
