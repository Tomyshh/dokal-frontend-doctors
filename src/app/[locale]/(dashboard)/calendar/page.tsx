'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { useCrmOrganization } from '@/hooks/useOrganization';
import {
  useCalendarAppointments,
  useExternalEvents,
  groupCalendarItemsByDate,
  type CalendarView,
} from '@/hooks/useCalendarAppointments';
import { Spinner } from '@/components/ui/Spinner';
import { ApiErrorCallout } from '@/components/ui/ApiErrorCallout';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import CalendarEventSidebar from '@/components/calendar/CalendarEventSidebar';
import type { CalendarItem } from '@/types';

export default function CalendarPage() {
  const t = useTranslations('calendar');
  const { profile } = useAuth();
  const { data: organization } = useCrmOrganization();

  // ─── State ──────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  /** null = my calendar, 'all' = all org, uuid = specific colleague */
  const [selectedColleague, setSelectedColleague] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  // ─── Date range calculation ─────────────────────────────────────────
  const { from, to } = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return {
        from: format(calStart, 'yyyy-MM-dd'),
        to: format(calEnd, 'yyyy-MM-dd'),
      };
    }
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return {
        from: format(weekStart, 'yyyy-MM-dd'),
        to: format(weekEnd, 'yyyy-MM-dd'),
      };
    }
    const dayStr = format(currentDate, 'yyyy-MM-dd');
    return { from: dayStr, to: dayStr };
  }, [currentDate, view]);

  // ─── Determine API mode ─────────────────────────────────────────────
  const isOrgMode = selectedColleague !== null;
  const practitionerIdFilter =
    selectedColleague === 'all' ? undefined : selectedColleague || undefined;

  // ─── Fetch CRM appointments ─────────────────────────────────────────
  const { data, isLoading, isError, error } = useCalendarAppointments({
    from,
    to,
    practitioner_id: practitionerIdFilter,
    isOrganization: isOrgMode,
  });

  // ─── Fetch external events (Google Calendar) ────────────────────────
  const { data: externalEvents } = useExternalEvents({ from, to });

  // ─── Merge into unified CalendarItem map ────────────────────────────
  const itemsByDate = useMemo(
    () =>
      groupCalendarItemsByDate(
        data?.appointments || [],
        externalEvents || [],
      ),
    [data?.appointments, externalEvents],
  );

  // ─── Handlers ───────────────────────────────────────────────────────
  const handleDayClick = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      if (view === 'month') {
        setView('day');
      }
    },
    [view],
  );

  const handleEventClick = useCallback((item: CalendarItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSelectedItem(null);
  }, []);

  // ─── Day items for day view ─────────────────────────────────────────
  const dayKey = format(currentDate, 'yyyy-MM-dd');
  const dayItems = itemsByDate[dayKey] || [];

  return (
    <div className="space-y-4">
      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      {/* Header: navigation, view toggle, colleague selector */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        selectedColleague={selectedColleague}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onColleagueChange={setSelectedColleague}
      />

      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span>{t('pending')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span>{t('confirmed')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>{t('completed')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span>{t('cancelled')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          <span>{t('noShow')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          <span>{t('googleEvent')}</span>
        </div>
      </div>

      {/* Calendar content */}
      {isError ? (
        <ApiErrorCallout error={error} />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {view === 'month' && (
            <CalendarMonthView
              currentDate={currentDate}
              items={itemsByDate}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              items={itemsByDate}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          )}
          {view === 'day' && (
            <CalendarDayView
              currentDate={currentDate}
              items={dayItems}
              onEventClick={handleEventClick}
            />
          )}
        </>
      )}

      {/* Event detail sidebar */}
      {selectedItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20 bg-black/10 backdrop-blur-[1px]"
            onClick={handleCloseSidebar}
          />
          <CalendarEventSidebar
            item={selectedItem}
            onClose={handleCloseSidebar}
          />
        </>
      )}
    </div>
  );
}
