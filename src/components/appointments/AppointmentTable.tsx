'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import AppointmentActions from './AppointmentActions';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import type { Appointment } from '@/types';
import { Link } from '@/i18n/routing';

interface AppointmentTableProps {
  appointments: Appointment[];
}

export default function AppointmentTable({ appointments }: AppointmentTableProps) {
  const t = useTranslations('appointments');
  const locale = useLocale();

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('patient')}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('date')}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('time')}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('reason')}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('status')}
            </th>
            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {appointments.map((appt) => (
            <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-3">
                <Link
                  href={`/patients/${appt.patient_id || appt.profiles?.id}`}
                  className="flex items-center gap-3 group"
                >
                  <Avatar
                    src={appt.profiles?.avatar_url}
                    firstName={appt.profiles?.first_name}
                    lastName={appt.profiles?.last_name}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {appt.profiles?.first_name} {appt.profiles?.last_name}
                    </p>
                    {appt.profiles?.phone && (
                      <p className="text-xs text-muted-foreground">{appt.profiles.phone}</p>
                    )}
                  </div>
                </Link>
              </td>
              <td className="py-3 px-3 text-sm text-gray-600">
                {formatDate(appt.appointment_date, 'dd/MM/yyyy', locale)}
              </td>
              <td className="py-3 px-3 text-sm text-gray-600">
                {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
              </td>
              <td className="py-3 px-3 text-sm text-gray-600">
                {locale === 'he'
                  ? appt.appointment_reasons?.label_he || appt.appointment_reasons?.label || '-'
                  : locale === 'fr'
                    ? appt.appointment_reasons?.label_fr || appt.appointment_reasons?.label || '-'
                    : appt.appointment_reasons?.label || '-'}
              </td>
              <td className="py-3 px-3">
                <Badge className={getStatusColor(appt.status)}>
                  {getAppointmentStatusLabel(t, appt.status)}
                </Badge>
              </td>
              <td className="py-3 px-3 text-right">
                <AppointmentActions appointmentId={appt.id} status={appt.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
