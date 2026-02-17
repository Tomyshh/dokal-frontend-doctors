'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCrmAppointments } from '@/hooks/useAppointments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorCallout } from '@/components/ui/ApiErrorCallout';
import AppointmentFilters from '@/components/appointments/AppointmentFilters';
import AppointmentTable from '@/components/appointments/AppointmentTable';
import { CalendarX, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ExternalEventDialog } from '@/components/shared/ExternalEventDialog';
import { useCreateExternalEvent, useExternalEvents } from '@/hooks/useExternalEvents';
import type { ExternalEvent } from '@/types';
import { CreateCrmAppointmentDialog } from '@/components/appointments/CreateCrmAppointmentDialog';

const PAGE_SIZE = 20;

export default function AppointmentsPage() {
  const t = useTranslations('appointments');
  const tc = useTranslations('calendar');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [createExternalOpen, setCreateExternalOpen] = useState(false);
  const [createAppointmentOpen, setCreateAppointmentOpen] = useState(false);

  const createExternalMutation = useCreateExternalEvent();

  const { data, isLoading, isError, error } = useCrmAppointments({
    date: date || undefined,
    status: status || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const { data: externalEvents } = useExternalEvents({ from: date, to: date });

  const dayExternalEvents = useMemo(() => {
    return (externalEvents || []).filter((e) => e.date === date);
  }, [externalEvents, date]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

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
            date={date}
            status={status}
            onDateChange={(d) => { setDate(d); setOffset(0); }}
            onStatusChange={(s) => { setStatus(s); setOffset(0); }}
          />
        </div>

        {isError ? (
          <ApiErrorCallout error={error} />
        ) : isLoading ? (
          <Spinner />
        ) : !data?.appointments?.length ? (
          <EmptyState icon={CalendarX} title={t('noAppointments')} />
        ) : (
          <>
            <AppointmentTable appointments={data.appointments} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {data.total} {t('title').toLowerCase()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    disabled={offset === 0}
                  >
                    <ChevronLeft className="h-4 w-4 rtl-flip-arrow" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + PAGE_SIZE)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4 rtl-flip-arrow" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* External events of the day */}
        {dayExternalEvents.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              {tc('externalEvent')}
            </h2>
            <ExternalEventsTable events={dayExternalEvents} />
          </div>
        )}
      </Card>

      <ExternalEventDialog
        open={createExternalOpen}
        onClose={() => setCreateExternalOpen(false)}
        defaultDate={date}
        submitting={createExternalMutation.isPending}
        onSubmit={async (payload) => {
          await createExternalMutation.mutateAsync(payload);
        }}
      />

      <CreateCrmAppointmentDialog
        open={createAppointmentOpen}
        onClose={() => setCreateAppointmentOpen(false)}
        defaultDate={date}
      />
    </div>
  );
}

function ExternalEventsTable({ events }: { events: ExternalEvent[] }) {
  const t = useTranslations('calendar');
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('externalEventTitle')}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('time')}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('type')}
            </th>
            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
              {t('source')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-muted/30 transition-colors">
              <td className="py-3 px-3 text-sm text-gray-900">{e.title}</td>
              <td className="py-3 px-3 text-sm text-gray-600">
                {e.start_at.substring(11, 16)} - {e.end_at.substring(11, 16)}
              </td>
              <td className="py-3 px-3 text-sm text-gray-600">
                {e.type_detected === 'appointment'
                  ? t('detectedAppointment')
                  : t('detectedBusy')}
              </td>
              <td className="py-3 px-3 text-sm text-gray-600">
                {e.source === 'google' ? t('googleEvent') : 'CRM'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
