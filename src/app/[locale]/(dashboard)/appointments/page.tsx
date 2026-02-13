'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCrmAppointments } from '@/hooks/useAppointments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ApiErrorCallout } from '@/components/ui/ApiErrorCallout';
import AppointmentFilters from '@/components/appointments/AppointmentFilters';
import AppointmentTable from '@/components/appointments/AppointmentTable';
import { CalendarX, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 20;

export default function AppointmentsPage() {
  const t = useTranslations('appointments');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError, error } = useCrmAppointments({
    date: date || undefined,
    status: status || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
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
      </Card>
    </div>
  );
}
