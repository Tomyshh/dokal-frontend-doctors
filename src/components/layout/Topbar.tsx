'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter, usePathname } from '@/i18n/routing';
import { Bell, Globe, Menu, Loader2, AlertTriangle } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useNotifications';
import { usePendingReviewCount } from '@/hooks/useExternalEvents';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { localeNames, type Locale } from '@/i18n/config';
import { useAuth } from '@/providers/AuthProvider';
import { useUpdateSettings } from '@/hooks/useSettings';
import { useToast } from '@/providers/ToastProvider';
import {
  useGoogleCalendarStatus,
  useStartGoogleCalendarConnect,
} from '@/hooks/useGoogleCalendarIntegration';

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadCount();
  const { data: pendingReviewCount } = usePendingReviewCount();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { profile, user } = useAuth();
  const updateSettings = useUpdateSettings();
  const toast = useToast();

  const { data: gcalStatus, isLoading: gcalStatusLoading } = useGoogleCalendarStatus({
    autoRefresh: true,
    refetchIntervalMs: 30_000,
  });
  const gcalConnectMutation = useStartGoogleCalendarConnect();
  const showEnergyRing = !(gcalStatusLoading || gcalConnectMutation.isPending);
  const isGcalSynced = Boolean(
    gcalStatus?.connected && !gcalStatus?.last_error
  );
  const energyRingClass = showEnergyRing
    ? isGcalSynced
      ? 'energy-sync energy-sync--ok'
      : 'energy-sync energy-sync--ko'
    : '';

  const switchLocale = async (newLocale: Locale) => {
    setShowLangMenu(false);
    try {
      await updateSettings.mutateAsync({ locale: newLocale });
    } catch {
      toast.error(t('saveErrorTitle'), t('saveError'));
    }
    router.replace(pathname, { locale: newLocale });
  };

  const displayName =
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    profile?.email ||
    user?.email ||
    '';

  // Format date selon la locale (ex: FR "Lundi 9 Mars 2026", EN "Monday, March 9, 2026")
  const localeToBcp47: Record<Locale, string> = {
    he: 'he-IL',
    en: 'en',
    fr: 'fr-FR',
    ru: 'ru-RU',
    am: 'am-ET',
    es: 'es-ES',
  };
  const { todayFormatted, todayIso } = useMemo(() => {
    const d = new Date();
    return {
      todayFormatted: new Intl.DateTimeFormat(localeToBcp47[locale], {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d),
      todayIso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    };
  }, [locale]);

  const handleGoogleCalendarClick = async () => {
    if (gcalStatusLoading || gcalConnectMutation.isPending) return;

    if (!gcalStatus?.connected) {
      const result = await gcalConnectMutation.mutateAsync();
      if (result.auth_url) {
        window.location.href = result.auth_url;
      }
      return;
    }

    // Connected: don't allow disabling here — send user to settings.
    router.push('/settings');
  };

  const gcalTitle = gcalStatusLoading
    ? t('gcalSyncLoading')
    : gcalStatus?.connected
      ? t('gcalSyncEnabledManageInSettings')
      : t('gcalSyncDisabledEnable');

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: hamburger on mobile + greeting */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="truncate text-sm sm:text-base font-semibold text-foreground">
              {displayName ? t('helloName', { name: displayName }) : t('hello')}
            </div>
            <time
              dateTime={todayIso}
              className="block text-xs text-muted-foreground font-medium truncate"
            >
              {todayFormatted}
            </time>
          </div>
        </div>

        {/* Right: Google Calendar sync, language, notifications */}
        <div className="flex items-center gap-2">
          {/* Pending review events badge */}
          {(pendingReviewCount ?? 0) > 0 && (
            <Link
              href="/calendar"
              className="relative h-10 px-2.5 rounded-xl flex items-center gap-1.5 text-orange-600 hover:bg-orange-50 transition-colors"
              title={t('pendingReviewTooltip')}
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold">{pendingReviewCount}</span>
            </Link>
          )}

          {/* Google Calendar Sync Indicator (format paysage) */}
          <button
            type="button"
            onClick={handleGoogleCalendarClick}
            title={gcalTitle}
            aria-label={gcalTitle}
            className={cn(
              'relative h-10 min-w-[72px] px-1 rounded-xl flex items-center justify-center transition-colors',
              energyRingClass,
              gcalStatus?.connected
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-muted-foreground hover:bg-muted',
              (gcalStatusLoading || gcalConnectMutation.isPending) && 'opacity-80'
            )}
          >
            {gcalStatusLoading || gcalConnectMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Image
                src={
                  gcalStatus?.connected
                    ? '/logo/dokal_google_sync_activated.png'
                    : '/logo/dokal_google_sync_deactivated.png'
                }
                alt={t('gcalSync')}
                width={80}
                height={40}
                className="h-8 w-auto max-w-[80px] object-contain"
              />
            )}
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{localeNames[locale]}</span>
            </button>
            {showLangMenu && (
              <div className="absolute ltr:right-0 rtl:left-0 top-full mt-1 bg-card rounded-xl shadow-lg border border-border py-1 min-w-[140px] z-50">
                {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                  <button
                    key={loc}
                    onClick={() => void switchLocale(loc)}
                    className={cn(
                      'w-full ltr:text-left rtl:text-right px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors',
                      loc === locale && 'text-primary font-medium bg-primary-50'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full bg-destructive text-white text-xs font-medium flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
