'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCrmAppointments } from '@/hooks/useAppointments';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { CalendarX } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from '@/i18n/routing';

export default function UpcomingAppointments() {
  const t = useTranslations('dashboard');
  const ta = useTranslations('appointments');
  const locale = useLocale();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading } = useCrmAppointments({ date: today, limit: 6 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upcomingAppointments')}</CardTitle>
        <Link href="/appointments" className="text-sm text-primary hover:underline">
          {ta('title')}
        </Link>
      </CardHeader>

      {isLoading ? (
        <Spinner />
      ) : !data?.appointments?.length ? (
        <EmptyState icon={CalendarX} title={ta('noAppointments')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('patient')}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('time')}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('reason')}
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={appt.profiles?.avatar_url}
                        firstName={appt.profiles?.first_name}
                        lastName={appt.profiles?.last_name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appt.profiles?.first_name} {appt.profiles?.last_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {locale === 'he'
                      ? appt.appointment_reasons?.label_he || appt.appointment_reasons?.label || '-'
                      : locale === 'fr'
                        ? appt.appointment_reasons?.label_fr || appt.appointment_reasons?.label || '-'
                        : appt.appointment_reasons?.label || '-'}
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={getStatusColor(appt.status)}>
                      {getAppointmentStatusLabel(ta, appt.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
