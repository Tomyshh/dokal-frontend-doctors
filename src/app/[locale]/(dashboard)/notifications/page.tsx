'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, CheckCheck, CalendarCheck, MessageSquare, Star, Clock } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';
import type { LucideIcon } from 'lucide-react';

const notifIcons: Record<NotificationType, LucideIcon> = {
  appointment_request: Clock,
  appointment_confirmed: CalendarCheck,
  appointment_cancelled: CalendarCheck,
  appointment_reminder: Bell,
  new_message: MessageSquare,
  review_received: Star,
};

const notifColors: Record<NotificationType, string> = {
  appointment_request: 'bg-yellow-50 text-yellow-600',
  appointment_confirmed: 'bg-green-50 text-green-600',
  appointment_cancelled: 'bg-red-50 text-red-600',
  appointment_reminder: 'bg-blue-50 text-blue-600',
  new_message: 'bg-primary-50 text-primary',
  review_received: 'bg-yellow-50 text-yellow-600',
};

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
          <CheckCheck className="h-4 w-4" />
          {t('markAllRead')}
        </Button>
      </div>

      <Card padding={false}>
        {isLoading ? (
          <Spinner />
        ) : !notifications?.length ? (
          <div className="p-6">
            <EmptyState icon={Bell} title={t('noNotifications')} />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notif) => {
              const Icon = notifIcons[notif.type] || Bell;
              const colorClass = notifColors[notif.type] || 'bg-gray-50 text-gray-600';

              return (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer',
                    !notif.is_read && 'bg-primary-50/30'
                  )}
                  onClick={() => { if (!notif.is_read) markRead.mutate(notif.id); }}
                >
                  <div className={cn('rounded-xl p-2.5 shrink-0', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeDate(notif.created_at, locale)}
                        </span>
                        {!notif.is_read && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
