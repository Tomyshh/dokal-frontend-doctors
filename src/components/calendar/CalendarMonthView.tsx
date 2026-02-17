'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import { fr, enUS, he, ru, es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getItemColors } from './CalendarEventCard';
import { getItemStartTime, getItemTitle } from '@/hooks/useCalendarAppointments';
import type { CalendarItem } from '@/types';

const localeMap: Record<string, import('date-fns').Locale> = { fr, en: enUS, he, ru, es, am: enUS };

interface CalendarMonthViewProps {
  currentDate: Date;
  items: Record<string, CalendarItem[]>;
  onDayClick: (date: Date) => void;
  onEventClick: (item: CalendarItem) => void;
}

const MAX_VISIBLE_EVENTS = 3;

export default function CalendarMonthView({
  currentDate,
  items,
  onDayClick,
  onEventClick,
}: CalendarMonthViewProps) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale] || fr;

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentDate]);

  // Day-of-week headers
  const weekDayHeaders = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return format(d, 'EEE', { locale: dateFnsLocale });
    });
  }, [dateFnsLocale]);

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDayHeaders.map((day, i) => (
          <div
            key={i}
            className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayItems = items[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const hasMore = dayItems.length > MAX_VISIBLE_EVENTS;
          const visibleItems = dayItems.slice(0, MAX_VISIBLE_EVENTS);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                'relative min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 border-b border-r border-border/50 text-left transition-colors group',
                'hover:bg-muted/30',
                !isCurrentMonth && 'bg-gray-50/50',
                (index + 1) % 7 === 0 && 'border-r-0'
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'inline-flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full transition-colors',
                    today && 'bg-primary text-white',
                    !today && isCurrentMonth && 'text-gray-900 group-hover:bg-muted',
                    !today && !isCurrentMonth && 'text-gray-400'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayItems.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {dayItems.length}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const colors = getItemColors(item);
                  const startTime = getItemStartTime(item);
                  const title = getItemTitle(item);
                  const id =
                    item.kind === 'crm_appointment'
                      ? item.data.id
                      : item.data.id;
                  const isExternal = item.kind === 'external_event';

                  return (
                    <div
                      key={`${item.kind}-${id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(item);
                      }}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] leading-tight truncate cursor-pointer',
                        'border-l-2 transition-all hover:opacity-80',
                        colors.bg,
                        colors.border,
                        colors.text
                      )}
                      title={`${startTime.substring(0, 5)} - ${title}`}
                    >
                      <span className="font-semibold">{startTime.substring(0, 5)}</span>
                      {isExternal && <span className="opacity-60"> [G]</span>}
                      <span className="hidden sm:inline"> {title}</span>
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="text-[10px] text-muted-foreground font-medium pl-1.5">
                    {t('moreEvents', { count: dayItems.length - MAX_VISIBLE_EVENTS })}
                  </div>
                )}
              </div>

              {/* Dot indicators for mobile */}
              {dayItems.length > 0 && (
                <div className="flex items-center gap-0.5 mt-1 sm:hidden">
                  {dayItems.slice(0, 4).map((item, i) => {
                    const colors = getItemColors(item);
                    return (
                      <div
                        key={i}
                        className={cn('h-1.5 w-1.5 rounded-full', colors.dot)}
                      />
                    );
                  })}
                  {dayItems.length > 4 && (
                    <span className="text-[9px] text-muted-foreground">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
