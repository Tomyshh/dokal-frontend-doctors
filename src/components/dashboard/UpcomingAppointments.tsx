'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useCrmAppointments } from '@/hooks/useAppointments';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { CalendarX } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useRouter } from '@/i18n/routing';

export default function UpcomingAppointments() {
  const t = useTranslations('dashboard');
  const ta = useTranslations('appointments');
  const locale = useLocale();
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, isLoading } = useCrmAppointments({ date: today, limit: 6 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upcomingAppointments')}</CardTitle>
        <Link href="/appointments" className="text-sm text-primary hover:underline font-medium">
          {ta('title')}
        </Link>
      </CardHeader>

      {isLoading ? (
        <div className="py-2">
          <TableSkeleton rows={6} columns={4} />
        </div>
      ) : !data?.appointments?.length ? (
        <EmptyState icon={CalendarX} title={ta('noAppointments')} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('patient')}
                </th>
                <th className="text-start text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('time')}
                </th>
                <th className="text-start text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('reason')}
                </th>
                <th className="text-start text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-2">
                  {ta('status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.appointments.map((appt) => (
                <tr
                  key={appt.id}
                  onClick={() => router.push(`/appointments/${appt.id}`)}
                  className="hover:bg-primary-50/50 cursor-pointer transition-colors duration-150 group"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={appt.profiles?.avatar_url}
                        firstName={appt.profiles?.first_name}
                        lastName={appt.profiles?.last_name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {appt.profiles?.first_name} {appt.profiles?.last_name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">
                    {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                  </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">
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
