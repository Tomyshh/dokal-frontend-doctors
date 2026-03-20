'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useQueries } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, CheckCheck, CalendarCheck, MessageSquare, Star, Clock } from 'lucide-react';
import { formatDateTime, formatDate, formatTime, cn } from '@/lib/utils';
import { getCrmAppointmentPatientDisplayName } from '@/lib/crm';
import type { NotificationType, Notification, Appointment } from '@/types';
import type { LucideIcon } from 'lucide-react';

const notifIcons: Record<NotificationType, LucideIcon> = {
  appointment_request: Clock,
  appointment_confirmed: CalendarCheck,
  appointment_cancelled: CalendarCheck,
  appointment_created: CalendarCheck,
  appointment_rescheduled: CalendarCheck,
  appointment_completed: CalendarCheck,
  appointment_reminder: Bell,
  new_message: MessageSquare,
  review_received: Star,
};

const notifColors: Record<NotificationType, string> = {
  appointment_request: 'bg-yellow-50 text-yellow-600',
  appointment_confirmed: 'bg-green-50 text-green-600',
  appointment_cancelled: 'bg-red-50 text-red-600',
  appointment_created: 'bg-green-50 text-green-600',
  appointment_rescheduled: 'bg-blue-50 text-blue-600',
  appointment_completed: 'bg-green-50 text-green-600',
  appointment_reminder: 'bg-blue-50 text-blue-600',
  new_message: 'bg-primary-50 text-primary',
  review_received: 'bg-yellow-50 text-yellow-600',
};

const notifTitleKey: Record<NotificationType, string> = {
  appointment_request: 'appointmentRequest',
  appointment_confirmed: 'appointmentConfirmed',
  appointment_cancelled: 'appointmentCancelled',
  appointment_created: 'appointmentCreated',
  appointment_rescheduled: 'appointmentRescheduled',
  appointment_completed: 'appointmentCompleted',
  appointment_reminder: 'appointmentReminder',
  new_message: 'newMessage',
  review_received: 'reviewReceived',
};

const notifBodyKey: Record<NotificationType, string> = {
  appointment_request: 'appointmentRequestBody',
  appointment_confirmed: 'appointmentConfirmedBody',
  appointment_cancelled: 'appointmentCancelledBody',
  appointment_created: 'appointmentCreatedBody',
  appointment_rescheduled: 'appointmentRescheduledBody',
  appointment_completed: 'appointmentCompletedBody',
  appointment_reminder: 'appointmentReminderBody',
  new_message: 'newMessageBody',
  review_received: 'reviewReceivedBody',
};

function getNotificationDeepLink(
  type: string,
  data: Record<string, unknown>
): string | null {
  const conversationId = typeof data?.conversation_id === 'string' ? data.conversation_id : null;
  const appointmentId = typeof data?.appointment_id === 'string' ? data.appointment_id : null;

  if (type === 'new_message' && conversationId) return `/messages/${conversationId}`;
  if (
    (type === 'appointment_cancelled' || type === 'appointment_request') &&
    appointmentId
  )
    return `/appointments/${appointmentId}`;
  if (type === 'review_received') return '/reviews';

  return null;
}

function getAppointmentId(notif: Notification): string | null {
  const id = notif.data?.appointment_id;
  return typeof id === 'string' ? id : null;
}

function needsAppointmentFetch(type: string): boolean {
  return type === 'appointment_request' || type === 'appointment_cancelled';
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const appointmentIds = useMemo(() => {
    if (!notifications) return [];
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const n of notifications) {
      if (needsAppointmentFetch(n.type)) {
        const id = getAppointmentId(n);
        if (id && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    return ids;
  }, [notifications]);

  const appointmentQueries = useQueries({
    queries: appointmentIds.map((id) => ({
      queryKey: ['appointment', id],
      queryFn: async () => {
        const { data } = await api.get<Appointment>(`/crm/appointments/${id}`);
        return data;
      },
      enabled: !!id,
    })),
  });

  const appointmentsById = useMemo(() => {
    const map = new Map<string, Appointment>();
    appointmentQueries.forEach((q, i) => {
      if (q.data && appointmentIds[i]) map.set(appointmentIds[i], q.data);
    });
    return map;
  }, [appointmentQueries, appointmentIds]);

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
          <div className="p-4 space-y-3" aria-label={tCommon('loading')}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-56 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-3 w-[85%] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="p-6">
            <EmptyState icon={Bell} title={t('noNotifications')} />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notifications.map((notif) => {
              const Icon = notifIcons[notif.type] || Bell;
              const colorClass = notifColors[notif.type] || 'bg-gray-50 text-gray-600';
              const title = notif.type in notifTitleKey ? t(notifTitleKey[notif.type]) : notif.title;

              const appointmentId = getAppointmentId(notif);
              const appointment = appointmentId ? appointmentsById.get(appointmentId) : null;

              let body: string;
              if (
                (notif.type === 'appointment_request' || notif.type === 'appointment_cancelled') &&
                appointment
              ) {
                const patientName = getCrmAppointmentPatientDisplayName(appointment);
                const dateStr = formatDate(appointment.appointment_date, 'dd MMM yyyy', locale);
                const timeStr = formatTime(appointment.start_time);
                body =
                  notif.type === 'appointment_request'
                    ? t('appointmentRequestBodyWithDetails', {
                        patientName,
                        date: dateStr,
                        time: timeStr,
                      })
                    : t('appointmentCancelledBodyWithDetails', {
                        patientName,
                        date: dateStr,
                        time: timeStr,
                      });
              } else {
                body = notif.type in notifBodyKey ? t(notifBodyKey[notif.type]) : notif.body;
              }

              const deepLink = getNotificationDeepLink(notif.type, notif.data ?? {});

              return (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    'flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer',
                    !notif.is_read && 'bg-primary-50/30'
                  )}
                  onClick={() => {
                    if (!notif.is_read) markRead.mutate(notif.id);
                    if (deepLink) router.push(deepLink);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!notif.is_read) markRead.mutate(notif.id);
                      if (deepLink) router.push(deepLink);
                    }
                  }}
                >
                  <div className={cn('rounded-xl p-2.5 shrink-0', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(notif.created_at, locale)}
                        </span>
                        {!notif.is_read && (
                          <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{body}</p>
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
