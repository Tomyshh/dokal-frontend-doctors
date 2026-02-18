'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import AppointmentActions from './AppointmentActions';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import type { Appointment } from '@/types';
import { Link } from '@/i18n/routing';
import {
  getAppointmentSourceLabel,
  getCrmAppointmentPatientDisplayName,
  getCrmAppointmentPatientPhone,
  getCrmAppointmentPatientRecordId,
  isDraftPatientAppointment,
} from '@/lib/crm';

interface AppointmentTableProps {
  appointments: Appointment[];
}

export default function AppointmentTable({ appointments }: AppointmentTableProps) {
  const t = useTranslations('appointments');
  const tc = useTranslations('calendar');
  const locale = useLocale();
  const { profile } = useAuth();

  // Secretaries see all org appointments → show practitioner column
  const showPractitionerColumn = profile?.role === 'secretary';

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('patient')}
            </th>
            {showPractitionerColumn && (
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
                {t('practitioner')}
              </th>
            )}
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
              {tc('source')}
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
                  href={`/patients/${getCrmAppointmentPatientRecordId(appt) || appt.patient_id || appt.profiles?.id || ''}`}
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
                      {getCrmAppointmentPatientDisplayName(appt)}
                    </p>
                    {getCrmAppointmentPatientPhone(appt) && (
                      <p className="text-xs text-muted-foreground">{getCrmAppointmentPatientPhone(appt)}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      {isDraftPatientAppointment(appt) && (
                        <Badge className="bg-amber-50 text-amber-800 border border-amber-200">
                          {tc('patientDraftBadge')}
                        </Badge>
                      )}
                      {appt.patient_info_missing && (
                        <Badge className="bg-red-50 text-red-700 border border-red-200">
                          {tc('missingInfoBadge')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              </td>
              {showPractitionerColumn && (
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <Avatar
                      src={appt.practitioners?.profiles?.avatar_url}
                      firstName={appt.practitioners?.profiles?.first_name}
                      lastName={appt.practitioners?.profiles?.last_name}
                      size="xs"
                    />
                    <span className="text-sm text-gray-700">
                      {appt.practitioners?.profiles?.first_name} {appt.practitioners?.profiles?.last_name}
                    </span>
                  </div>
                </td>
              )}
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
                <Badge className="bg-gray-100 text-gray-700">
                  {getAppointmentSourceLabel(tc, appt.source)}
                </Badge>
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
