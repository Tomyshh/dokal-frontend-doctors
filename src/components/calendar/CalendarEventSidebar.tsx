'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import AppointmentActions from '@/components/appointments/AppointmentActions';
import { getItemColors } from './CalendarEventCard';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { getItemStartTime, getItemEndTime } from '@/hooks/useCalendarAppointments';
import { X, User, Clock, FileText, Stethoscope, ExternalLink, Globe } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { CalendarItem } from '@/types';
import { useDeleteExternalEvent } from '@/hooks/useExternalEvents';
import { Dialog } from '@/components/ui/Dialog';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import {
  formatMissingFieldLabel,
  getAppointmentSourceLabel,
  getCrmAppointmentPatientDisplayName,
  getCrmAppointmentPatientPhone,
  getCrmAppointmentPatientRecordId,
  isDraftPatientAppointment,
} from '@/lib/crm';
import { useUpdateCrmAppointment, useUpdateCrmOrganizationAppointment } from '@/hooks/useAppointments';

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
  const tc = useTranslations('common');
  const toast = useToast();
  const { profile } = useAuth();
  const isOrgActor = profile?.role === 'secretary' || profile?.role === 'admin';

  // Tous les hooks doivent être appelés inconditionnellement (règles des hooks React)
  const deleteExternalMutation = useDeleteExternalEvent();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateMutation = useUpdateCrmAppointment();
  const updateOrgMutation = useUpdateCrmOrganizationAppointment();
  const updateMetaMutation = isOrgActor ? updateOrgMutation : updateMutation;
  const [metaEditMode, setMetaEditMode] = useState(false);
  const [extTitle, setExtTitle] = useState<string>('');
  const [extDesc, setExtDesc] = useState<string>('');
  const [extLoc, setExtLoc] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const appointment = item?.kind === 'crm_appointment' ? item.data : null;
  const missingFields = appointment?.patient_missing_fields || [];
  const hasMissingInfo = appointment?.patient_info_missing === true;
  const missingFieldsLabel = useMemo(() => {
    if (!hasMissingInfo || missingFields.length === 0) return '';
    return missingFields.map((f) => formatMissingFieldLabel(t, f)).join(', ');
  }, [hasMissingInfo, missingFields, t]);

  useEffect(() => {
    if (!appointment) return;
    setMetaEditMode(false);
    setExtTitle(appointment.external_title || '');
    setExtDesc(appointment.external_description || '');
    setExtLoc(appointment.external_location || '');
    setNotes(appointment.practitioner_notes || '');
  }, [appointment?.id]);

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
        <div className="border-t border-border p-4 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            {tc('close')}
          </Button>
          {evt.source === 'manual' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              {t('deleteExternalEvent')}
            </Button>
          )}
        </div>

        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          title={t('deleteExternalEvent')}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t('deleteExternalEventConfirm')}</p>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button
                variant="destructive"
                loading={deleteExternalMutation.isPending}
                onClick={async () => {
                  try {
                    await deleteExternalMutation.mutateAsync(evt.id);
                    setDeleteDialogOpen(false);
                    onClose();
                    toast.success(tc('saveSuccess'));
                  } catch (err: unknown) {
                    const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
                    toast.error(tc('saveErrorTitle'), msg);
                  }
                }}
              >
                {t('deleteExternalEvent')}
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    );
  }

  // ─── CRM appointment sidebar ─────────────────────────────────────────
  if (!appointment) return null;
  const patientName = getCrmAppointmentPatientDisplayName(appointment);
  const patientPhone = getCrmAppointmentPatientPhone(appointment);
  const patientRecordId = getCrmAppointmentPatientRecordId(appointment);
  const isDraftPatient = isDraftPatientAppointment(appointment);

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
            {patientPhone && (
              <p className="text-xs text-muted-foreground">{patientPhone}</p>
            )}
          </div>
          <Link href={`/patients/${patientRecordId || appointment.patient_id || ''}`} className="shrink-0">
            <Button variant="ghost" size="icon-sm" title={t('viewPatient')}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Draft / missing info callouts */}
        {(isDraftPatient || hasMissingInfo) && (
          <div className="space-y-2">
            {isDraftPatient && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-900">{t('patientDraftTitle')}</p>
                <p className="text-xs text-amber-800 mt-0.5">{t('patientDraftDesc')}</p>
                {patientRecordId && (
                  <div className="mt-2">
                    <Link href={`/patients/${patientRecordId}`}>
                      <Button size="sm" className="h-8">
                        {t('completePatient')}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {hasMissingInfo && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-red-900">{t('missingInfoTitle')}</p>
                  <Badge className="bg-red-100 text-red-700">{t('missingInfoBadge')}</Badge>
                </div>
                {missingFieldsLabel && (
                  <p className="text-xs text-red-800 mt-1">
                    {t('missingInfoFields')}: {missingFieldsLabel}
                  </p>
                )}
                {patientRecordId && (
                  <div className="mt-2">
                    <Link href={`/patients/${patientRecordId}`}>
                      <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-700 hover:bg-red-100">
                        {t('completePatient')}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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

          {/* Source */}
          <div className="flex items-start gap-3">
            <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t('source')}</p>
              <Badge className="bg-gray-100 text-gray-700">
                {getAppointmentSourceLabel(t, appointment.source)}
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

          {/* Editable metadata (Google import / CRM clarity) */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-700 uppercase">{t('appointmentMeta')}</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setMetaEditMode((v) => !v)}
              >
                {metaEditMode ? tc('close') : tc('edit')}
              </Button>
            </div>

            {metaEditMode ? (
              <div className="mt-3 space-y-3">
                <Input
                  id="ext-title"
                  label={t('externalTitle')}
                  value={extTitle}
                  onChange={(e) => setExtTitle(e.target.value)}
                  disabled={updateMetaMutation.isPending}
                />
                <Textarea
                  id="ext-desc"
                  label={t('externalDescription')}
                  value={extDesc}
                  onChange={(e) => setExtDesc(e.target.value)}
                  rows={3}
                  disabled={updateMetaMutation.isPending}
                />
                <Input
                  id="ext-loc"
                  label={t('externalLocation')}
                  value={extLoc}
                  onChange={(e) => setExtLoc(e.target.value)}
                  disabled={updateMetaMutation.isPending}
                />
                <Textarea
                  id="notes"
                  label={t('notes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={updateMetaMutation.isPending}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setExtTitle(appointment.external_title || '');
                      setExtDesc(appointment.external_description || '');
                      setExtLoc(appointment.external_location || '');
                      setNotes(appointment.practitioner_notes || '');
                      setMetaEditMode(false);
                    }}
                    disabled={updateMetaMutation.isPending}
                  >
                    {tc('cancel')}
                  </Button>
                  <Button
                    size="sm"
                    className="h-8"
                    loading={updateMetaMutation.isPending}
                    onClick={async () => {
                      try {
                        await updateMetaMutation.mutateAsync({
                          id: appointment.id,
                          data: {
                            external_title: extTitle.trim() || null,
                            external_description: extDesc.trim() || null,
                            external_location: extLoc.trim() || null,
                            practitioner_notes: notes.trim() || null,
                          },
                        });
                        setMetaEditMode(false);
                        toast.success(tc('saveSuccess'));
                      } catch (err: unknown) {
                        const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
                        toast.error(tc('saveErrorTitle'), msg);
                      }
                    }}
                  >
                    {tc('save')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {(appointment.external_title || appointment.external_description || appointment.external_location) ? (
                  <>
                    {appointment.external_title && (
                      <p className="text-sm font-medium text-gray-900">{appointment.external_title}</p>
                    )}
                    {appointment.external_description && (
                      <p className="text-sm text-gray-700 whitespace-pre-line">{appointment.external_description}</p>
                    )}
                    {appointment.external_location && (
                      <p className="text-sm text-gray-700">{appointment.external_location}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('noExternalMeta')}</p>
                )}
                {appointment.practitioner_notes && (
                  <p className="text-sm text-gray-700 whitespace-pre-line">{appointment.practitioner_notes}</p>
                )}
              </div>
            )}
          </div>
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
