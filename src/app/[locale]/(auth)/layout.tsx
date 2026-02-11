import type { ReactNode } from 'react';
import { AuthBrandedLayout } from '@/components/auth/AuthBrandedLayout';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 flex items-center justify-center">
      <AuthBrandedLayout>{children}</AuthBrandedLayout>
    </div>
  );
}
