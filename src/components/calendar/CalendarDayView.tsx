'use client';

import { useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { isToday } from 'date-fns';
import { cn, formatTime } from '@/lib/utils';
import { getItemColors } from './CalendarEventCard';
import { Avatar } from '@/components/ui/Avatar';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { Badge } from '@/components/ui/Badge';
import { getStatusColor } from '@/lib/utils';
import { getItemStartTime, getItemEndTime, getItemTitle } from '@/hooks/useCalendarAppointments';
import type { CalendarItem } from '@/types';

const HOUR_HEIGHT = 72; // px per hour, larger for day view
const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

interface CalendarDayViewProps {
  currentDate: Date;
  items: CalendarItem[];
  onEventClick: (item: CalendarItem) => void;
}

export default function CalendarDayView({
  currentDate,
  items,
  onEventClick,
}: CalendarDayViewProps) {
  const t = useTranslations('calendar');
  const ta = useTranslations('appointments');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = isToday(currentDate);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollTo = Math.max(0, (currentHour - START_HOUR - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Now indicator
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const showNowLine = today && nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  // Sort items by start time
  const sorted = [...items].sort((a, b) =>
    getItemStartTime(a).localeCompare(getItemStartTime(b)),
  );

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col">
      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)] relative">
        <div
          className="grid grid-cols-[72px_1fr] relative"
          style={{ minHeight: HOURS.length * HOUR_HEIGHT }}
        >
          {/* Time labels column */}
          <div className="border-r border-border/50 relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute right-3 text-xs text-muted-foreground font-medium"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT - 8 }}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Main content area */}
          <div className="relative">
            {/* Hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full border-t border-border/30"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour grid lines */}
            {HOURS.map((hour) => (
              <div
                key={`${hour}-half`}
                className="absolute w-full border-t border-gray-100"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Calendar items */}
            {sorted.map((item) => {
              const { top, height } = getItemPosition(item);
              if (height <= 0) return null;

              const colors = getItemColors(item);
              const startTime = getItemStartTime(item);
              const endTime = getItemEndTime(item);
              const title = getItemTitle(item);
              const id = item.data.id;
              const isExternal = item.kind === 'external_event';

              if (isExternal) {
                // Render external event (simpler card)
                return (
                  <button
                    key={`external-${id}`}
                    type="button"
                    onClick={() => onEventClick(item)}
                    className={cn(
                      'absolute left-2 right-2 rounded-xl border-l-[4px] px-3 py-2 transition-all hover:shadow-md cursor-pointer group text-left',
                      colors.bg,
                      colors.border,
                      colors.text,
                    )}
                    style={{ top, height: Math.max(height, 36) }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        {formatTime(startTime)} - {formatTime(endTime)}
                      </span>
                      <Badge className="bg-blue-100 text-blue-700 text-[10px] py-0 px-1.5">
                        {item.data.type_detected === 'appointment'
                          ? t('detectedAppointment')
                          : t('detectedBusy')}
                      </Badge>
                    </div>
                    <p className="text-xs truncate mt-0.5 opacity-80">
                      <span className="opacity-60">[Google] </span>
                      {title}
                    </p>
                  </button>
                );
              }

              // CRM appointment
              const appt = item.data;
              const patientName = appt.profiles
                ? `${appt.profiles.first_name || ''} ${appt.profiles.last_name || ''}`.trim()
                : '-';

              const reasonLabel =
                locale === 'he'
                  ? appt.appointment_reasons?.label_he || appt.appointment_reasons?.label
                  : locale === 'fr'
                    ? appt.appointment_reasons?.label_fr || appt.appointment_reasons?.label
                    : appt.appointment_reasons?.label;

              return (
                <button
                  key={`appt-${appt.id}`}
                  type="button"
                  onClick={() => onEventClick(item)}
                  className={cn(
                    'absolute left-2 right-2 rounded-xl border-l-[4px] px-3 py-2 transition-all hover:shadow-md cursor-pointer group text-left',
                    colors.bg,
                    colors.border,
                    colors.text,
                  )}
                  style={{ top, height: Math.max(height, 36) }}
                >
                  <div className="flex items-start gap-3 h-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">
                          {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                        </span>
                        <Badge className={cn(getStatusColor(appt.status), 'text-[10px] py-0 px-1.5')}>
                          {getAppointmentStatusLabel(ta, appt.status)}
                        </Badge>
                      </div>
                      {height >= 50 && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <Avatar
                            src={appt.profiles?.avatar_url}
                            firstName={appt.profiles?.first_name}
                            lastName={appt.profiles?.last_name}
                            size="xs"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{patientName}</p>
                            {reasonLabel && height >= 70 && (
                              <p className="text-[11px] opacity-70 truncate">{reasonLabel}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {height < 50 && (
                        <p className="text-xs truncate mt-0.5">{patientName}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Now line */}
            {showNowLine && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: nowOffset }}
              >
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 shadow-sm" />
                  <div className="flex-1 h-[2px] bg-red-500 shadow-sm" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground bg-white/80 px-4 py-2 rounded-lg">
            {t('noEvents')}
          </p>
        </div>
      )}
    </div>
  );
}

function getItemPosition(item: CalendarItem) {
  const startTime = getItemStartTime(item);
  const endTime = getItemEndTime(item);
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT;
  return { top, height };
}
