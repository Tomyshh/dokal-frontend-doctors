'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useCrmAppointments } from '@/hooks/useAppointments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorCallout } from '@/components/ui/ApiErrorCallout';
import AppointmentFilters from '@/components/appointments/AppointmentFilters';
import AppointmentActions from '@/components/appointments/AppointmentActions';
import { CalendarX, Plus, ChevronRight } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { ExternalEventDialog } from '@/components/shared/ExternalEventDialog';
import { useCreateExternalEvent } from '@/hooks/useExternalEvents';
import { CreateCrmAppointmentDialog } from '@/components/appointments/CreateCrmAppointmentDialog';
import type { Appointment } from '@/types';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { Link } from '@/i18n/routing';
import {
  getCrmAppointmentPatientDisplayName,
  getCrmAppointmentPatientRecordId,
  isDraftPatientAppointment,
} from '@/lib/crm';
import { Badge } from '@/components/ui/Badge';

const RANGE_DAYS = 60;

export default function AppointmentsPage() {
  const t = useTranslations('appointments');
  const tc = useTranslations('calendar');
  const locale = useLocale();
  const [status, setStatus] = useState<string>('upcoming'); // default: show upcoming
  const [createExternalOpen, setCreateExternalOpen] = useState(false);
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);

  const createExternalMutation = useCreateExternalEvent();

  const from = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const to = useMemo(() => format(addDays(new Date(), RANGE_DAYS), 'yyyy-MM-dd'), []);

  const { data, isLoading, isError, error } = useCrmAppointments({
    from,
    to,
    // Backend supports single-status filter; for "upcoming" we filter client-side
    status: status && status !== 'upcoming' ? status : undefined,
    limit: 500,
    offset: 0,
  });

  const grouped = useMemo(() => {
    const appts = (data?.appointments || []) as Appointment[];
    const now = new Date();

    const upcoming = appts
      .filter((a) => {
        const dt = new Date(`${a.appointment_date}T${(a.start_time || '00:00:00').substring(0, 8)}`);
        return dt >= now;
      })
      .filter((a) => {
        if (status !== 'upcoming') return true;
        return a.status === 'pending' || a.status === 'confirmed';
      })
      .sort((a, b) => {
        if (a.appointment_date !== b.appointment_date) {
          return a.appointment_date.localeCompare(b.appointment_date);
        }
        return a.start_time.localeCompare(b.start_time);
      });

    const map = new Map<string, Appointment[]>();
    for (const a of upcoming) {
      const key = a.appointment_date;
      const arr = map.get(key) || [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [data?.appointments, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateAppointmentOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newAppointment')}
          </Button>
          <Button variant="outline" onClick={() => setCreateExternalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {tc('addExternalEvent')}
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-6">
          <AppointmentFilters
            status={status}
            onStatusChange={(s) => { setStatus(s); }}
          />
        </div>

        {isError ? (
          <ApiErrorCallout error={error} />
        ) : isLoading ? (
          <Spinner />
        ) : grouped.size === 0 ? (
          <EmptyState icon={CalendarX} title={t('noAppointments')} />
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateKey, appts]) => (
              <div key={dateKey} className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  {formatDate(dateKey, 'EEEE d MMMM', locale)}
                </h2>

                <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-white overflow-hidden">
                  {appts.map((appt) => {
                    const patientName = getCrmAppointmentPatientDisplayName(appt);
                    const patientRecordId = getCrmAppointmentPatientRecordId(appt);
                    const isDraft = isDraftPatientAppointment(appt);
                    const reason =
                      locale === 'he'
                        ? appt.appointment_reasons?.label_he || appt.appointment_reasons?.label
                        : locale === 'fr'
                          ? appt.appointment_reasons?.label_fr || appt.appointment_reasons?.label
                          : appt.appointment_reasons?.label;

                    return (
                      <div key={appt.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20">
                        <div className="min-w-0 flex items-start gap-4">
                          <div className="shrink-0 text-sm font-semibold text-gray-900 w-[92px]">
                            {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <Link
                                href={`/appointments/${appt.id}`}
                                className="text-sm font-semibold text-gray-900 hover:text-primary truncate"
                              >
                                {patientName}
                              </Link>
                              {isDraft && (
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

                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="truncate">{reason || '-'}</span>
                              <span>•</span>
                              <Badge className={getStatusColor(appt.status)}>
                                {getAppointmentStatusLabel(t, appt.status)}
                              </Badge>
                              {patientRecordId && (
                                <>
                                  <span>•</span>
                                  <Link
                                    href={`/patients/${patientRecordId}`}
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                    title={tc('viewPatient')}
                                  >
                                    {tc('viewPatient')}
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <AppointmentActions appointmentId={appt.id} status={appt.status} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ExternalEventDialog
        open={createExternalOpen}
        onClose={() => setCreateExternalOpen(false)}
        defaultDate={from}
        submitting={createExternalMutation.isPending}
        onSubmit={async (payload) => {
          await createExternalMutation.mutateAsync(payload);
        }}
      />

      <CreateCrmAppointmentDialog
        open={createAppointmentOpen}
        onClose={() => setCreateAppointmentOpen(false)}
        defaultDate={from}
      />
    </div>
  );
}
