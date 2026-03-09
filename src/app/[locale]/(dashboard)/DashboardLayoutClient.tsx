'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import SocketProvider from '@/providers/SocketProvider';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import MobileNav from '@/components/layout/MobileNav';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Clock, X, EyeOff } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import { getMyPractitionerOrNull } from '@/lib/practitioner';
import { useAppointmentsRealtime } from '@/hooks/useAppointmentsRealtime';
import { PractitionerProfileProvider, usePractitionerProfile } from '@/providers/PractitionerProfileProvider';
import SubscriptionBlocker from '@/components/payment/SubscriptionBlocker';
import { useGoogleCalendarStatus } from '@/hooks/useGoogleCalendarIntegration';
import GoogleCalendarPrompt from '@/components/onboarding/GoogleCalendarPrompt';

function NotPublishedBanner() {
  const t = useTranslations('settings');
  const practitionerProfile = usePractitionerProfile();

  if (
    !practitionerProfile ||
    practitionerProfile.isLoading ||
    practitionerProfile.isPublished
  ) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3 text-sm">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <EyeOff className="h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold">{t('notPublishedTitle')}</span>
          <span className="mx-1.5 opacity-60">—</span>
          <span className="opacity-90">{t('notPublishedDescription')}</span>
        </div>
        <Link
          href="/settings/profile"
          className="shrink-0 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-full px-4 py-1.5 transition-colors"
        >
          {t('notPublishedAction')}
        </Link>
      </div>
    </div>
  );
}

export default function DashboardLayoutClient({ children }: { children: ReactNode }) {
  const { loading, user, profile, subscriptionStatus, signOut } = useAuth();
  useAppointmentsRealtime();
  const t = useTranslations('auth');
  const ts = useTranslations('subscription');
  const locale = useLocale();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [gcalPromptOpen, setGcalPromptOpen] = useState(false);

  const hasAccess = useMemo(() => {
    if (!subscriptionStatus) return false;

    // Active subscription (backend includes active, past_due, trialing w/ active trial, cancelled w/ remaining period)
    if (subscriptionStatus.hasSubscription) return true;

    const subStatus = subscriptionStatus.subscription?.status;

    // past_due = accès uniquement si période payée pas encore terminée
    if (subStatus === 'past_due' && subscriptionStatus.subscription?.current_period_end) {
      return new Date(subscriptionStatus.subscription.current_period_end) > new Date();
    }

    // Active trial
    if (
      subStatus === 'trialing' &&
      subscriptionStatus.trial?.isActive &&
      (subscriptionStatus.trial.daysRemaining ?? 0) > 0
    ) return true;

    // Cancelled but still within paid period
    if (
      subStatus === 'cancelled' &&
      subscriptionStatus.subscription?.current_period_end
    ) {
      return new Date(subscriptionStatus.subscription.current_period_end) > new Date();
    }

    return false;
  }, [subscriptionStatus]);

  const {
    data: practitioner,
    isLoading: loadingPractitioner,
  } = useQuery({
    queryKey: ['practitioner-profile'],
    queryFn: async () => {
      return await getMyPractitionerOrNull();
    },
    enabled: !!profile?.id && (profile?.role === 'practitioner' || profile?.role === 'admin'),
    retry: 1,
  });

  const { data: gcalStatus, isLoading: gcalStatusLoading } = useGoogleCalendarStatus();

  useEffect(() => {
    if (loading || gcalStatusLoading || !profile) return;
    if (profile.role !== 'practitioner' && profile.role !== 'admin') return;
    if (!hasAccess) return;
    if (gcalStatus?.connected) return;
    try {
      if (localStorage.getItem('dokal-gcal-prompt-dismissed')) return;
    } catch { /* SSR guard */ }
    setGcalPromptOpen(true);
  }, [loading, gcalStatusLoading, gcalStatus, profile, hasAccess]);

  // Redirect to onboarding: only when user has no practitioner profile at all (not yet registered)
  // No longer redirect when profile is incomplete — user completes via Settings with live progress
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    // No profile or not a practitioner/secretary/admin → send to complete-profile
    const notPractitioner =
      !profile ||
      (profile.role !== 'practitioner' && profile.role !== 'secretary' && profile.role !== 'admin');
    if (notPractitioner) {
      router.replace(`/${locale}/complete-profile`);
      return;
    }

  }, [loading, user, profile, router, locale]);

  // ─── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:block fixed ltr:left-0 rtl:right-0 top-0 bottom-0 w-[260px] p-4">
          <div className="h-full rounded-2xl border border-border bg-card p-4 space-y-4">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="ltr:lg:ml-[260px] rtl:lg:mr-[260px]">
          <div className="sticky top-0 z-10 bg-background border-b border-border">
            <div className="h-[72px] px-6 flex items-center justify-between">
              <Skeleton className="h-9 w-56 rounded-xl" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          </div>
          <main className="p-6 space-y-4" aria-label="Chargement">
            <Skeleton className="h-8 w-64 rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </main>
        </div>
      </div>
    );
  }

  // ─── Subscription blocker (full-screen paywall) ─────────────────────
  const showBlocker =
    !loading &&
    profile &&
    (profile.role === 'practitioner' || profile.role === 'admin') &&
    subscriptionStatus !== null &&
    !hasAccess;

  if (showBlocker) {
    return <SubscriptionBlocker subscriptionStatus={subscriptionStatus} />;
  }

  // ─── Role check ────────────────────────────────────────────────────
  if (profile && profile.role !== 'practitioner' && profile.role !== 'secretary' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-foreground">{t('accessDenied')}</h1>
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

  // ─── Trial / Cancelled banner ──────────────────────────────────────
  const showTrialBanner =
    !bannerDismissed &&
    subscriptionStatus?.trial?.isActive &&
    !subscriptionStatus.hasSubscription &&
    (subscriptionStatus.trial.daysRemaining ?? 0) <= 14;

  const showCancelledBanner =
    !bannerDismissed &&
    subscriptionStatus?.subscription?.status === 'cancelled' &&
    subscriptionStatus.subscription.current_period_end &&
    new Date(subscriptionStatus.subscription.current_period_end) > new Date();

  return (
    <PractitionerProfileProvider
      practitioner={practitioner ?? null}
      profile={profile ?? null}
      isLoading={loadingPractitioner}
    >
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

        {/* Main Content (banners + topbar + main) — marge adaptative selon l'état du sidemenu */}
        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'ltr:lg:ml-[72px] rtl:lg:mr-[72px]' : 'ltr:lg:ml-[260px] rtl:lg:mr-[260px]'
          )}
        >
          <NotPublishedBanner />

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

        {/* Cancelled subscription banner */}
        {showCancelledBanner && subscriptionStatus?.subscription?.current_period_end && (
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2.5 text-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="font-medium">
                  {ts('cancelledAccessUntil', {
                    date: new Date(subscriptionStatus.subscription.current_period_end).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
                  })}
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

          <Topbar onMenuToggle={() => setMobileNavOpen(true)} />
          <GoogleCalendarPrompt open={gcalPromptOpen} onDismiss={() => setGcalPromptOpen(false)} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SocketProvider>
    </PractitionerProfileProvider>
  );
}

