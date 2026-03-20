'use client';

import { use, useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import AppointmentActions from '@/components/appointments/AppointmentActions';
import { CompletePatientInfoDialog } from '@/components/appointments/CompletePatientInfoDialog';
import { PreVisitInstructionsEditor } from '@/components/appointments/PreVisitInstructionsEditor';
import { QuestionnaireFieldsBuilder } from '@/components/appointments/QuestionnaireFieldsBuilder';
import { useUpdateAppointmentQuestionnaireConfig } from '@/hooks/useQuestionnaire';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  ChevronRight,
  ListChecks,
  ClipboardList,
  CheckCircle2,
  Pencil,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { Appointment, QuestionnaireField } from '@/types';
import {
  getAppointmentSourceLabel,
  getCrmAppointmentPatientDisplayName,
  getCrmAppointmentPatientRecordId,
  isDraftPatientAppointment,
} from '@/lib/crm';

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('appointments');
  const tc = useTranslations('common');
  const tq = useTranslations('questionnaire');
  const tcal = useTranslations('calendar');
  const locale = useLocale();
  const [completeInfoOpen, setCompleteInfoOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data } = await api.get<Appointment>(`/crm/appointments/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // Local questionnaire config state for the per-appointment dialog
  const [instructions, setInstructions] = useState<string[]>([]);
  const [fields, setFields] = useState<QuestionnaireField[]>([]);
  const updateConfig = useUpdateAppointmentQuestionnaireConfig(id);

  useEffect(() => {
    if (appointment) {
      setInstructions(appointment.pre_visit_instructions ?? []);
      setFields(appointment.questionnaire_fields ?? []);
    }
  }, [appointment]);

  const handleConfigSave = () => {
    updateConfig.mutate(
      { pre_visit_instructions: instructions, questionnaire_fields: fields },
      { onSuccess: () => setConfigOpen(false) },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl" aria-label={tc('loading')}>
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-6 w-40 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-3 w-28 rounded-md" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-28 rounded-md" />
              <Skeleton className="h-4 w-64 rounded-md" />
              <Skeleton className="h-4 w-56 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </Card>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('notFound')}
      </div>
    );
  }

  const patientName = getCrmAppointmentPatientDisplayName(appointment);
  const patientRecordId = getCrmAppointmentPatientRecordId(appointment);
  const isDraft = isDraftPatientAppointment(appointment);

  const hasQuestionnaireConfig =
    (appointment.pre_visit_instructions?.length ?? 0) > 0 ||
    (appointment.questionnaire_fields?.length ?? 0) > 0;

  const questionnaireSubmitted = !!appointment.questionnaire_submitted_at;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/appointments">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 rtl-flip-arrow" />
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
            {getAppointmentStatusLabel(t, appointment.status)}
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
                <Link
                  href={`/patients/${patientRecordId || appointment.patient_id || ''}`}
                  className="text-base font-semibold text-gray-900 hover:text-primary"
                >
                  {patientName}
                </Link>
                {appointment.profiles?.phone && (
                  <p className="text-sm text-muted-foreground">{appointment.profiles.phone}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {isDraft && (
                    <Badge className="bg-amber-50 text-amber-800 border border-amber-200">
                      {tcal('patientDraftBadge')}
                    </Badge>
                  )}
                  {appointment.patient_info_missing && (
                    patientRecordId ? (
                      <button
                        type="button"
                        onClick={() => setCompleteInfoOpen(true)}
                        title={tcal('completePatientInfoClickHint')}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1"
                        aria-label={tcal('completePatientInfoTitle')}
                      >
                        {tcal('missingInfoBadge')}
                        <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                      </button>
                    ) : (
                      <Badge className="bg-red-50 text-red-700 border border-red-200">
                        {tcal('missingInfoBadge')}
                      </Badge>
                    )
                  )}
                </div>
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
                  {locale === 'he'
                    ? appointment.appointment_reasons.label_he || appointment.appointment_reasons.label
                    : locale === 'fr'
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
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{getAppointmentSourceLabel(tcal, appointment.source)}</span>
            </div>
          </div>
        </div>

        {(appointment.external_title || appointment.external_description || appointment.external_location) && (
          <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/60">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{tcal('appointmentMeta')}</h3>
            {appointment.external_title && <p className="text-sm font-medium text-gray-900">{appointment.external_title}</p>}
            {appointment.external_description && (
              <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{appointment.external_description}</p>
            )}
            {appointment.external_location && <p className="text-sm text-gray-700 mt-1">{appointment.external_location}</p>}
          </div>
        )}

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

      {/* ── Pre-visit Instructions & Questionnaire ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-primary" />
            {tq('appointmentConfigTitle')}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setInstructions(appointment.pre_visit_instructions ?? []);
              setFields(appointment.questionnaire_fields ?? []);
              setConfigOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            {tc('edit')}
          </Button>
        </CardHeader>

        {/* Pre-visit instructions summary */}
        {(appointment.pre_visit_instructions?.length ?? 0) > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" />
              {tq('preVisitInstructions')}
            </h4>
            <ul className="space-y-1">
              {appointment.pre_visit_instructions!.map((instr, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {instr}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Questionnaire fields summary */}
        {(appointment.questionnaire_fields?.length ?? 0) > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              {tq('questionnaireFields')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {appointment.questionnaire_fields!.map((field) => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs bg-muted/60 text-gray-700 border border-border/50"
                >
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {!hasQuestionnaireConfig && (
          <p className="text-sm text-muted-foreground">{tq('noConfigForAppointment')}</p>
        )}
      </Card>

      {/* ── Questionnaire Responses (patient side) ── */}
      {questionnaireSubmitted && appointment.questionnaire_answers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              {tq('patientResponses')}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {tq('submittedAt', {
                date: formatDate(appointment.questionnaire_submitted_at!, 'dd/MM/yyyy HH:mm', locale),
              })}
            </span>
          </CardHeader>
          <div className="space-y-4">
            {appointment.questionnaire_fields?.map((field) => {
              const answer = appointment.questionnaire_answers![field.id];
              const label = field.translations?.[locale] || field.label;
              return (
                <div key={field.id}>
                  <p className="text-xs font-semibold text-gray-500 uppercase">{label}</p>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-line">
                    {answer || <span className="italic text-muted-foreground">{tq('noAnswer')}</span>}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Config Dialog ── */}
      <Dialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title={tq('appointmentConfigTitle')}
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              {tq('preVisitInstructions')}
            </h3>
            <PreVisitInstructionsEditor
              value={instructions}
              onChange={setInstructions}
              disabled={updateConfig.isPending}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              {tq('questionnaireFields')}
            </h3>
            <QuestionnaireFieldsBuilder
              value={fields}
              onChange={setFields}
              disabled={updateConfig.isPending}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setConfigOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleConfigSave} loading={updateConfig.isPending}>
              {tc('save')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog pour compléter les infos patient */}
      {patientRecordId && (
        <CompletePatientInfoDialog
          open={completeInfoOpen}
          onClose={() => setCompleteInfoOpen(false)}
          patientRecordId={patientRecordId}
          missingFields={appointment.patient_missing_fields ?? []}
        />
      )}
    </div>
  );
}
