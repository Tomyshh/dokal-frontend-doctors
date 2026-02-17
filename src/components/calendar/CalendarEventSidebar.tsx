'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import AppointmentActions from '@/components/appointments/AppointmentActions';
import { getItemColors } from './CalendarEventCard';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { getItemStartTime, getItemEndTime } from '@/hooks/useCalendarAppointments';
import { X, User, Clock, FileText, Stethoscope, ExternalLink, Globe } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { CalendarItem } from '@/types';

interface CalendarEventSidebarProps {
  item: CalendarItem | null;
  onClose: () => void;
}

export default function CalendarEventSidebar({
  item,
  onClose,
}: CalendarEventSidebarProps) {
  const t = useTranslations('calendar');
  const ta = useTranslations('appointments');
  const locale = useLocale();

  if (!item) return null;

  const colors = getItemColors(item);
  const startTime = getItemStartTime(item);
  const endTime = getItemEndTime(item);

  // ─── External event sidebar ──────────────────────────────────────────
  if (item.kind === 'external_event') {
    const evt = item.data;
    return (
      <div className="fixed inset-y-0 right-0 z-30 w-full sm:w-[380px] bg-white border-l border-border shadow-xl flex flex-col transition-transform duration-200">
        {/* Header */}
        <div className={cn('px-5 py-4 border-b border-border flex items-center justify-between', colors.bg)}>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('externalEvent')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDate(evt.date, 'EEEE d MMMM yyyy', locale)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <p className="text-lg font-semibold text-gray-900">{evt.title || '-'}</p>
            {evt.description && (
              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{evt.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('time')}</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatTime(startTime)} - {formatTime(endTime)}
                </p>
              </div>
            </div>

            {/* Source */}
            <div className="flex items-start gap-3">
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('source')}</p>
                <Badge className="bg-blue-100 text-blue-700">{t('googleEvent')}</Badge>
              </div>
            </div>

            {/* Detected type */}
            <div className="flex items-start gap-3">
              <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('type')}</p>
                <Badge
                  className={
                    evt.type_detected === 'appointment'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
                  }
                >
                  {evt.type_detected === 'appointment'
                    ? t('detectedAppointment')
                    : t('detectedBusy')}
                </Badge>
              </div>
            </div>

            {/* Location */}
            {evt.location && (
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm text-gray-700">{evt.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('viewAppointment')}
          </Button>
        </div>
      </div>
    );
  }

  // ─── CRM appointment sidebar ─────────────────────────────────────────
  const appointment = item.data;

  const patientName = appointment.profiles
    ? `${appointment.profiles.first_name || ''} ${appointment.profiles.last_name || ''}`.trim()
    : '-';

  const practitionerName = appointment.practitioners?.profiles
    ? `${appointment.practitioners.profiles.first_name || ''} ${appointment.practitioners.profiles.last_name || ''}`.trim()
    : null;

  const reasonLabel =
    locale === 'he'
      ? appointment.appointment_reasons?.label_he ||
        appointment.appointment_reasons?.label
      : locale === 'fr'
        ? appointment.appointment_reasons?.label_fr ||
          appointment.appointment_reasons?.label
        : appointment.appointment_reasons?.label;

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full sm:w-[380px] bg-white border-l border-border shadow-xl flex flex-col transition-transform duration-200">
      {/* Header */}
      <div className={cn('px-5 py-4 border-b border-border flex items-center justify-between', colors.bg)}>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('eventDetails')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(appointment.appointment_date, 'EEEE d MMMM yyyy', locale)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Patient */}
        <div className="flex items-center gap-3">
          <Avatar
            src={appointment.profiles?.avatar_url}
            firstName={appointment.profiles?.first_name}
            lastName={appointment.profiles?.last_name}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{patientName}</p>
            {appointment.profiles?.phone && (
              <p className="text-xs text-muted-foreground">{appointment.profiles.phone}</p>
            )}
          </div>
          <Link
            href={`/patients/${appointment.patient_id || appointment.profiles?.id}`}
            className="shrink-0"
          >
            <Button variant="ghost" size="icon-sm" title={t('viewPatient')}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Details grid */}
        <div className="space-y-3">
          {/* Time */}
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('time')}</p>
              <p className="text-sm font-medium text-gray-900">
                {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start gap-3">
            <div className={cn('h-4 w-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center', colors.bg)}>
              <div className={cn('h-2 w-2 rounded-full', colors.dot)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('status')}</p>
              <Badge className={getStatusColor(appointment.status)}>
                {getAppointmentStatusLabel(ta, appointment.status)}
              </Badge>
            </div>
          </div>

          {/* Reason */}
          {reasonLabel && (
            <div className="flex items-start gap-3">
              <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('reason')}</p>
                <p className="text-sm text-gray-900">{reasonLabel}</p>
              </div>
            </div>
          )}

          {/* Practitioner (if org view) */}
          {practitionerName && (
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Praticien</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Avatar
                    src={appointment.practitioners?.profiles?.avatar_url}
                    firstName={appointment.practitioners?.profiles?.first_name}
                    lastName={appointment.practitioners?.profiles?.last_name}
                    size="xs"
                  />
                  <p className="text-sm text-gray-900">{practitionerName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.practitioner_notes && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t('notes')}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {appointment.practitioner_notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <AppointmentActions appointmentId={appointment.id} status={appointment.status} />
          <Link href={`/appointments/${appointment.id}`}>
            <Button variant="outline" size="sm">
              {t('viewAppointment')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
