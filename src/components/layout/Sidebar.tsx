'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { usePractitionerProfile } from '@/providers/PractitionerProfileProvider';
import { useCrmOrganization } from '@/hooks/useOrganization';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  MessageSquare,
  CalendarCheck,
  Star,
  Settings,
  CreditCard,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Users,
  ClipboardCheck,
  User,
  Palette,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const t = useTranslations('nav');
  const ta = useTranslations('auth');
  const pathname = usePathname();
  const locale = useLocale();
  const { profile, signOut } = useAuth();
  const { data: organization } = useCrmOrganization();
  const practitionerProfile = usePractitionerProfile();

  const isSecretary = profile?.role === 'secretary';
  const showSettingsBadge = Boolean(
    !isSecretary &&
      practitionerProfile &&
      !practitionerProfile.isLoading &&
      practitionerProfile.completionPercent < 100
  );

  const pathnameWithoutLocale =
    pathname.startsWith(`/${locale}`) ? pathname.slice(`/${locale}`.length) || '/' : pathname;

  const isSettingsSection = pathnameWithoutLocale.startsWith('/settings');
  const [settingsOpen, setSettingsOpen] = useState(isSettingsSection);

  type SidebarLink = {
    href: string;
    icon: typeof LayoutDashboard;
    label: string;
    exact?: boolean;
    badge?: boolean;
  };

  const mainLinks = useMemo(() => {
    const links: SidebarLink[] = [
      { href: '/', icon: LayoutDashboard, label: t('overview'), exact: true },
    ];

    if (!isSecretary) {
      links.push({ href: '/schedule', icon: CalendarDays, label: t('schedule') });
    }

    links.push(
      { href: '/calendar', icon: Calendar, label: t('calendar') },
      { href: '/messages', icon: MessageSquare, label: t('messages') },
      { href: '/appointments', icon: CalendarCheck, label: t('appointments') },
      { href: '/patients', icon: Users, label: t('patients') },
    );

    if (!isSecretary) {
      links.push({ href: '/reviews', icon: Star, label: t('reviews') });
    }

    if (!isSecretary) {
      links.push({ href: '/billing', icon: CreditCard, label: t('billing') });
    }

    return links;
  }, [t, isSecretary]);

  const profileIncompleteCount = practitionerProfile?.completionItems
    ? practitionerProfile.completionItems.filter((i) => !i.completed).length
    : 0;
  const showProfileBadge = !practitionerProfile?.isLoading && profileIncompleteCount > 0;

  const cardIncompleteCount = practitionerProfile?.businessCardCompletionItems
    ? practitionerProfile.businessCardCompletionItems.filter((i) => !i.completed).length
    : 0;
  const showCardBadge = !practitionerProfile?.isLoading && cardIncompleteCount > 0;

  const settingsSubLinks = useMemo(() => {
    const links: { href: string; icon: typeof Settings; label: string; badge?: number }[] = [];

    if (!isSecretary) {
      links.push(
        { href: '/settings/profile', icon: User, label: t('profile'), badge: showProfileBadge ? profileIncompleteCount : undefined },
        { href: '/settings/appearance', icon: Palette, label: t('appearance') },
        { href: '/settings/business-card', icon: CreditCard, label: t('businessCard'), badge: showCardBadge ? cardIncompleteCount : undefined },
        { href: '/settings/google-calendar', icon: Calendar, label: t('googleCalendar') },
        { href: '/settings/instructions', icon: FileText, label: t('instructions') },
        { href: '/settings/questionnaire', icon: ClipboardCheck, label: t('questionnaire') },
      );
    }

    return links;
  }, [t, isSecretary, showProfileBadge, profileIncompleteCount, showCardBadge, cardIncompleteCount]);

  const teamLink = useMemo(() => (
    { href: '/team', icon: Users, label: t('team') }
  ), [t]);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathnameWithoutLocale === href;
    return pathnameWithoutLocale === href || pathnameWithoutLocale.startsWith(href + '/');
  };

  const isSettingsRootActive = pathnameWithoutLocale === '/settings';

  return (
    <aside
      className={cn(
        'fixed ltr:left-0 rtl:right-0 top-0 z-40 h-screen bg-card ltr:border-r rtl:border-l border-border/50 flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center justify-between p-4 border-b border-border/50', collapsed ? 'h-16' : 'h-20')}>
        <div className={cn('flex-1 min-w-0 relative rounded-sm overflow-hidden', collapsed ? 'h-8' : 'h-12')}>
          <Image
            src="/logo/Dokal.png"
            alt="Dokal"
            fill
            className="object-contain object-left rounded-sm"
          />
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform rtl-flip-arrow', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t('menu')}
          </p>
        )}
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'sidebar-link',
              isActive(link.href, link.exact) && 'sidebar-link-active',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? link.label : undefined}
          >
            <span className="relative">
              <link.icon className="h-5 w-5 shrink-0" />
              {link.badge && collapsed && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                  aria-label={t('profileIncompleteBadge')}
                />
              )}
            </span>
            {!collapsed && (
              <>
                <span className="truncate">{link.label}</span>
                {link.badge && (
                  <span
                    className="ml-auto shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                    aria-label={t('profileIncompleteBadge')}
                  >
                    {practitionerProfile?.completionPercent ?? 0}%
                  </span>
                )}
              </>
            )}
          </Link>
        ))}

        {/* Settings Section with sub-menu */}
        <div className="pt-4">
          {!collapsed && (
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('settings')}
            </p>
          )}

          {/* Settings main link + toggle */}
          {collapsed ? (
            <Link
              href="/settings"
              className={cn(
                'sidebar-link justify-center px-2',
                isSettingsSection && 'sidebar-link-active'
              )}
              title={t('settings')}
            >
              <span className="relative">
                <Settings className="h-5 w-5 shrink-0" />
                {showSettingsBadge && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                    aria-label={t('profileIncompleteBadge')}
                  />
                )}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="sidebar-link w-full"
            >
              <span className="relative">
                <Settings className="h-5 w-5 shrink-0" />
                {showSettingsBadge && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                    aria-label={t('profileIncompleteBadge')}
                  />
                )}
              </span>
              <span className="truncate flex-1 text-left">{t('settings')}</span>
              {showSettingsBadge && (
                <span
                  className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                  aria-label={t('profileIncompleteBadge')}
                >
                  {practitionerProfile?.completionPercent ?? 0}%
                </span>
              )}
              <ChevronDown className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                settingsOpen && 'rotate-180'
              )} />
            </button>
          )}

          {/* Settings sub-links */}
          {!collapsed && settingsOpen && (
            <div className="ltr:ml-4 rtl:mr-4 mt-1 space-y-0.5 ltr:border-l-2 rtl:border-r-2 border-border/50 ltr:pl-3 rtl:pr-3 min-w-0 overflow-hidden">
              <Link
                href="/settings"
                className={cn(
                  'sidebar-link text-sm py-2 min-w-0',
                  isSettingsRootActive && 'sidebar-link-active'
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{t('general')}</span>
              </Link>
              {settingsSubLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'sidebar-link text-sm py-2 min-w-0',
                    isActive(link.href) && 'sidebar-link-active'
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{link.label}</span>
                  {link.badge != null && link.badge > 0 && (
                    <span
                      className="shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
                      aria-label={t('profileIncompleteBadge')}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Team link */}
          <Link
            href={teamLink.href}
            className={cn(
              'sidebar-link mt-1',
              isActive(teamLink.href) && 'sidebar-link-active',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? teamLink.label : undefined}
          >
            <teamLink.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{teamLink.label}</span>}
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-border/50">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar
            src={profile?.avatar_url}
            firstName={profile?.first_name}
            lastName={profile?.last_name}
            size="md"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title={ta('logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
