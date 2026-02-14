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
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Practitioner } from '@/types';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user, profile, subscriptionStatus, signOut } = useAuth();
  const t = useTranslations('auth');
  const ts = useTranslations('subscription');
  const locale = useLocale();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const hasAccess =
    subscriptionStatus?.hasSubscription ||
    subscriptionStatus?.subscription?.status === 'trialing' ||
    (subscriptionStatus?.trial?.isActive && (subscriptionStatus.trial.daysRemaining ?? 0) > 0);

  const {
    data: practitioner,
    isLoading: loadingPractitioner,
    isError: practitionerError,
  } = useQuery({
    queryKey: ['practitioner', profile?.id],
    queryFn: async () => {
      const { data } = await api.get<Practitioner>(`/practitioners/${profile?.id}`);
      return data;
    },
    enabled: !!profile?.id && (profile?.role === 'practitioner' || profile?.role === 'admin'),
    retry: 1,
  });

  const needsProfileCompletion = (() => {
    if (!profile) return false;
    if (profile.role !== 'practitioner' && profile.role !== 'admin') return false;
    if (loadingPractitioner) return false;
    if (practitionerError) return true;
    if (!practitioner) return true;
    return !(
      practitioner.phone &&
      practitioner.city &&
      practitioner.address_line &&
      practitioner.zip_code &&
      practitioner.license_number &&
      practitioner.specialty_id
    );
  })();

  // Redirect to onboarding if we know for sure the user has no access
  // Secretaries don't manage their own subscription (the clinic pays)
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    // No profile or not a practitioner/secretary/admin → send to complete-profile
    // (same flow as Google signup: they can onboard as a practitioner)
    const notPractitioner =
      !profile ||
      (profile.role !== 'practitioner' && profile.role !== 'secretary' && profile.role !== 'admin');
    if (notPractitioner) {
      router.replace(`/${locale}/complete-profile`);
      return;
    }

    // Must complete practitioner details before subscription step
    if (needsProfileCompletion) {
      router.replace(`/${locale}/complete-profile`);
      return;
    }

    if (subscriptionStatus === null) return;

    if (
      (profile.role === 'practitioner' || profile.role === 'admin') &&
      !hasAccess
    ) {
      router.replace(`/${locale}/subscription`);
    }
  }, [loading, user, profile, subscriptionStatus, hasAccess, router, locale, needsProfileCompletion]);

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // ─── Role check ────────────────────────────────────────────────────
  // Only block if we have a profile AND the role is wrong.
  // If profile is null (backend unreachable / still propagating), let them through
  // so they don't get stuck. The middleware already verified the session.
  if (profile && profile.role !== 'practitioner' && profile.role !== 'secretary' && profile.role !== 'admin') {
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

  // ─── Trial banner ──────────────────────────────────────────────────
  const showTrialBanner =
    !bannerDismissed &&
    subscriptionStatus?.trial?.isActive &&
    !subscriptionStatus.hasSubscription &&
    (subscriptionStatus.trial.daysRemaining ?? 0) <= 14;

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
