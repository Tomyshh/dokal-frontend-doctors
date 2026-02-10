'use client';

import { useMemo, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import {
  startOfWeek,
  addDays,
  format,
  isToday,
  isSameDay,
} from 'date-fns';
import { fr, enUS, he, ru, es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CalendarEventCard from './CalendarEventCard';
import type { Appointment } from '@/types';

const localeMap: Record<string, import('date-fns').Locale> = { fr, en: enUS, he, ru, es };

const HOUR_HEIGHT = 60; // px per hour
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

interface CalendarWeekViewProps {
  currentDate: Date;
  appointments: Record<string, Appointment[]>;
  onEventClick: (appointment: Appointment) => void;
  onDayClick: (date: Date) => void;
}

export default function CalendarWeekView({
  currentDate,
  appointments,
  onEventClick,
  onDayClick,
}: CalendarWeekViewProps) {
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale] || fr;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate week days (Sun-Sat)
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollTo = Math.max(0, (currentHour - START_HOUR - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Calculate the position of the "now" line
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;
  const isCurrentWeek = weekDays.some((d) => isSameDay(d, now));

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col">
      {/* Header: day names + dates */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-white z-10">
        <div className="border-r border-border/50" />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onDayClick(day)}
              className={cn(
                'py-3 text-center border-r border-border/50 last:border-r-0 transition-colors hover:bg-muted/30',
                today && 'bg-primary-50/50'
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {format(day, 'EEE', { locale: dateFnsLocale })}
              </p>
              <p
                className={cn(
                  'text-sm font-bold mt-0.5',
                  today ? 'text-white bg-primary rounded-full w-7 h-7 inline-flex items-center justify-center' : 'text-gray-900'
                )}
              >
                {format(day, 'd')}
              </p>
            </button>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] relative">
        <div
          className="grid grid-cols-[60px_repeat(7,1fr)] relative"
          style={{ minHeight: HOURS.length * HOUR_HEIGHT }}
        >
          {/* Time labels */}
          <div className="border-r border-border/50 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-2 text-[11px] text-muted-foreground font-medium"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 7 }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointments[dateKey] || [];
            const today = isToday(day);

            return (
              <div
                key={dateKey}
                className={cn(
                  'relative border-r border-border/50 last:border-r-0',
                  today && 'bg-primary-50/20'
                )}
              >
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/30"
                    style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Appointments */}
                {dayAppointments.map((appt) => {
                  const { top, height } = getEventPosition(appt);
                  if (height <= 0) return null;

                  return (
                    <div
                      key={appt.id}
                      className="absolute left-0.5 right-0.5 z-10"
                      style={{ top, height: Math.max(height, 20) }}
                    >
                      <CalendarEventCard
                        appointment={appt}
                        onClick={onEventClick}
                        compact={height < 40}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Now indicator line */}
          {showNowLine && isCurrentWeek && (
            <div
              className="absolute left-[60px] right-0 z-20 pointer-events-none"
              style={{ top: nowOffset }}
            >
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-[2px] bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getEventPosition(appt: Appointment) {
  const [startH, startM] = appt.start_time.split(':').map(Number);
  const [endH, endM] = appt.end_time.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
  return { top, height };
}
