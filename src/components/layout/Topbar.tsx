'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Bell, Search, Globe, Menu } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { localeNames, type Locale } from '@/i18n/config';

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadCount();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setShowLangMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: hamburger on mobile + search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search')}
              className="h-10 w-64 rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Right: language, notifications */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm text-gray-600 hover:bg-muted transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{localeNames[locale]}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-border py-1 min-w-[140px] z-50">
                {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                  <button
                    key={loc}
                    onClick={() => switchLocale(loc)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors',
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
            className="relative h-10 w-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-muted transition-colors"
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
