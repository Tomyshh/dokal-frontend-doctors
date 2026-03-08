'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { fr, enUS, he, ru, es } from 'date-fns/locale';
import { X, CalendarX, ExternalLink } from 'lucide-react';
import { cn, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { getCrmAppointmentPatientDisplayName } from '@/lib/crm';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Link } from '@/i18n/routing';
import { useCalendarAppointments, groupAppointmentsByDate } from '@/hooks/useCalendarAppointments';
import type { Appointment } from '@/types';

const localeMap: Record<string, import('date-fns').Locale> = { fr, en: enUS, he, ru, es, am: enUS };

function getPatientAvatarInfo(appt: Appointment) {
  const pr = appt.patient_record;
  const prof = appt.profiles;
  return {
    avatarUrl: pr?.avatar_url || prof?.avatar_url || null,
    firstName: pr?.first_name || prof?.first_name || null,
    lastName: pr?.last_name || prof?.last_name || null,
  };
}

interface DashboardDaySidebarProps {
  date: Date;
  onClose: () => void;
}

export default function DashboardDaySidebar({ date, onClose }: DashboardDaySidebarProps) {
  const t = useTranslations('dashboard');
  const ta = useTranslations('appointments');
  const locale = useLocale();
  const rtl = locale === 'he';
  const dateFnsLocale = localeMap[locale] || fr;

  const dateStr = format(date, 'yyyy-MM-dd');
  const { data, isLoading } = useCalendarAppointments({ from: dateStr, to: dateStr });

  const appointments = useMemo(() => {
    if (!data?.appointments) return [];
    const grouped = groupAppointmentsByDate(data.appointments);
    return grouped[dateStr] || [];
  }, [data?.appointments, dateStr]);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 w-full sm:w-[400px] bg-card border-border shadow-2xl flex flex-col',
          'animate-slide-in-sidebar',
          rtl ? 'left-0 border-r' : 'right-0 border-l',
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-primary-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground capitalize">
                {format(date, 'EEEE', { locale: dateFnsLocale })}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {format(date, 'd MMMM yyyy', { locale: dateFnsLocale })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-2">
              {t('appointmentsCount', { count: appointments.length })}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title={t('noAppointmentsDay')}
            />
          ) : (
            <div className="space-y-2">
              {appointments.map((appt) => {
                const patientName = getCrmAppointmentPatientDisplayName(appt);
                const { avatarUrl, firstName, lastName } = getPatientAvatarInfo(appt);

                const reasonLabel =
                  locale === 'he'
                    ? appt.appointment_reasons?.label_he || appt.appointment_reasons?.label
                    : locale === 'fr'
                      ? appt.appointment_reasons?.label_fr || appt.appointment_reasons?.label
                      : appt.appointment_reasons?.label;

                return (
                  <div
                    key={appt.id}
                    className="group rounded-xl border border-border/50 bg-card hover:border-primary-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={avatarUrl}
                          firstName={firstName}
                          lastName={lastName}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {patientName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                          </p>
                          {reasonLabel && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {reasonLabel}
                            </p>
                          )}
                        </div>
                        <Badge className={getStatusColor(appt.status)}>
                          {getAppointmentStatusLabel(ta, appt.status)}
                        </Badge>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <Link href={`/appointments/${appt.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary hover:text-primary-700">
                            <ExternalLink className="h-3 w-3" />
                            {t('viewAppointment')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
