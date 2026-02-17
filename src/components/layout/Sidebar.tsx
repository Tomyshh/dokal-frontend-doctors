'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
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
  ClipboardList,
  FileText,
  LogOut,
  ChevronLeft,
  Users,
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

  const isSecretary = profile?.role === 'secretary';

  const pathnameWithoutLocale =
    pathname.startsWith(`/${locale}`) ? pathname.slice(`/${locale}`.length) || '/' : pathname;

  type SidebarLink = {
    href: string;
    icon: typeof LayoutDashboard;
    label: string;
    exact?: boolean;
  };

  // Build main links based on role
  const mainLinks = useMemo(() => {
    const links: SidebarLink[] = [
      { href: '/', icon: LayoutDashboard, label: t('overview'), exact: true },
    ];

    // Secretaries don't have a personal schedule
    if (!isSecretary) {
      links.push({ href: '/schedule', icon: CalendarDays, label: t('schedule') });
    }

    links.push(
      { href: '/calendar', icon: Calendar, label: t('calendar') },
      { href: '/messages', icon: MessageSquare, label: t('messages') },
      { href: '/appointments', icon: CalendarCheck, label: t('appointments') },
    );

    // Secretaries don't have reviews
    if (!isSecretary) {
      links.push({ href: '/reviews', icon: Star, label: t('reviews') });
    }

    links.push({ href: '/settings', icon: Settings, label: t('settings') });

    // Billing is not for secretaries (clinic pays)
    if (!isSecretary) {
      links.push({ href: '/billing', icon: CreditCard, label: t('billing') });
    }

    return links;
  }, [t, isSecretary]);

  // Build management links based on role & organization type
  const managementLinks = useMemo(() => {
    const links: { href: string; icon: typeof ClipboardList; label: string }[] = [];

    // Reasons & instructions are for practitioners
    if (!isSecretary) {
      links.push(
        { href: '/settings/reasons', icon: ClipboardList, label: t('reasons') },
        { href: '/settings/instructions', icon: FileText, label: t('instructions') },
      );
    }

    // Team management — always visible (page handles individual→clinic upgrade)
    links.push({ href: '/team', icon: Users, label: t('team') });

    return links;
  }, [t, isSecretary]);

  const isActive = (href: string, exact = false) => {
    if (exact) return pathnameWithoutLocale === href;
    return pathnameWithoutLocale.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-border/50 flex flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-border/50">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            // Use colored icon (avoid white-on-white)
            src="/branding/icononly.png"
            alt="Dokal"
            width={36}
            height={36}
            className="shrink-0"
          />
          {!collapsed && (
            <span className="text-xl font-bold text-primary truncate">DOKAL</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-muted transition-colors shrink-0"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform rtl-flip-arrow', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
            <link.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{link.label}</span>}
          </Link>
        ))}

        {/* Management Section */}
        {managementLinks.length > 0 && (
          <div className="pt-4">
            {!collapsed && (
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {t('management')}
              </p>
            )}
            {managementLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'sidebar-link',
                  isActive(link.href) && 'sidebar-link-active',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{link.label}</span>}
              </Link>
            ))}
          </div>
        )}
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
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
