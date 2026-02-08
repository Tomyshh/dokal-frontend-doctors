'use client';

import { use } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import AppointmentActions from '@/components/appointments/AppointmentActions';
import { formatDate, formatTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { ArrowLeft, Calendar, Clock, MapPin, User, FileText } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { Appointment } from '@/types';

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('appointments');
  const tc = useTranslations('common');
  const locale = useLocale();

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data } = await api.get<Appointment>(`/appointments/${id}`);
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <Spinner size="lg" />;
  if (!appointment) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('notFound')}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/appointments">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          {t('backToAppointments')}
        </Button>
      </Link>

      {/* Appointment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('title')}
          </CardTitle>
          <Badge className={getStatusColor(appointment.status)}>
            {getStatusLabel(appointment.status, locale)}
          </Badge>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Patient */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('patient')}</h3>
            <div className="flex items-center gap-3">
              <Avatar
                src={appointment.profiles?.avatar_url}
                firstName={appointment.profiles?.first_name}
                lastName={appointment.profiles?.last_name}
                size="lg"
              />
              <div>
                <Link href={`/patients/${appointment.patient_id}`} className="text-base font-semibold text-gray-900 hover:text-primary">
                  {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                </Link>
                {appointment.profiles?.phone && (
                  <p className="text-sm text-muted-foreground">{appointment.profiles.phone}</p>
                )}
              </div>
            </div>
            {appointment.visited_before ? (
              <Badge variant="success">{t('visitedBefore')}</Badge>
            ) : (
              <Badge variant="warning">{t('firstVisit')}</Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">{tc('details')}</h3>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(appointment.appointment_date, 'EEEE dd MMMM yyyy', locale)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
            </div>
            {appointment.appointment_reasons && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>
                  {locale === 'fr'
                    ? appointment.appointment_reasons.label_fr || appointment.appointment_reasons.label
                    : appointment.appointment_reasons.label}
                </span>
              </div>
            )}
            {(appointment.patient_address_line || appointment.patient_city) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[appointment.patient_address_line, appointment.patient_zip_code, appointment.patient_city]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {appointment.practitioner_notes && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50">
            <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('notes')}
            </h3>
            <p className="text-sm text-gray-600">{appointment.practitioner_notes}</p>
          </div>
        )}

        {/* Cancellation reason */}
        {appointment.cancellation_reason && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100">
            <h3 className="text-sm font-semibold text-red-700 mb-1">{t('cancelReason')}</h3>
            <p className="text-sm text-red-600">{appointment.cancellation_reason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <AppointmentActions appointmentId={appointment.id} status={appointment.status} />
        </div>
      </Card>
    </div>
  );
}
