'use client';

import { useState, type ReactNode } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import SocketProvider from '@/providers/SocketProvider';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, profile, signOut } = useAuth();
  const t = useTranslations('auth');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (profile && profile.role !== 'practitioner' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900">{t('accessDenied')}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('accessDenied')}
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={signOut}>{t('logout')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Nav */}
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Main Content */}
        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'
          )}
        >
          <Topbar onMenuToggle={() => setMobileNavOpen(true)} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SocketProvider>
  );
}
