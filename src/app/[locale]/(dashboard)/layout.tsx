'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import SocketProvider from '@/providers/SocketProvider';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Clock, X } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, profile, subscriptionStatus, signOut } = useAuth();
  const t = useTranslations('auth');
  const ts = useTranslations('subscription');
  const locale = useLocale();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const hasAccess =
    subscriptionStatus?.hasSubscription ||
    (subscriptionStatus?.trial?.isActive && (subscriptionStatus.trial.daysRemaining ?? 0) > 0);

  // Redirect to onboarding if no subscription and no active trial
  useEffect(() => {
    if (loading) return;
    if (!profile) return; // Wait for profile

    // Only redirect practitioners who have no access
    if (
      (profile.role === 'practitioner' || profile.role === 'admin') &&
      subscriptionStatus !== null &&
      !hasAccess
    ) {
      router.replace(`/${locale}/subscription`);
    }
  }, [loading, profile, subscriptionStatus, hasAccess, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // Role check — but be lenient if profile is null (may still be loading from backend)
  if (profile && profile.role !== 'practitioner' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900">{t('accessDenied')}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t('accessDeniedDetail')}
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={signOut}>{t('logout')}</Button>
          </div>
        </Card>
      </div>
    );
  }

  // If still waiting for subscription status to decide
  if (subscriptionStatus !== null && !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // Trial banner
  const showTrialBanner =
    !bannerDismissed &&
    subscriptionStatus?.trial?.isActive &&
    !subscriptionStatus.hasSubscription &&
    (subscriptionStatus.trial.daysRemaining ?? 0) <= 5;

  return (
    <SocketProvider>
      <div className="min-h-screen bg-background">
        {/* Trial Banner */}
        {showTrialBanner && subscriptionStatus?.trial && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="font-medium">
                  {ts('trialBannerText', { days: subscriptionStatus.trial.daysRemaining })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/subscription"
                  className="text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-full px-4 py-1.5 transition-colors"
                >
                  {ts('subscribeNowTitle')}
                </Link>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

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
