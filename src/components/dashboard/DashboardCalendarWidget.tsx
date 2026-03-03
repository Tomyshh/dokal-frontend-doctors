'use client';

import { useMemo, useState } from 'react';
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
  addMonths,
  subMonths,
} from 'date-fns';
import { fr, enUS, he, ru, es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCalendarAppointments, groupAppointmentsByDate } from '@/hooks/useCalendarAppointments';

const localeMap: Record<string, import('date-fns').Locale> = { fr, en: enUS, he, ru, es, am: enUS };

interface DashboardCalendarWidgetProps {
  onDayClick: (date: Date, count: number) => void;
}

export default function DashboardCalendarWidget({ onDayClick }: DashboardCalendarWidgetProps) {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const rtl = locale === 'he';
  const dateFnsLocale = localeMap[locale] || fr;

  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const from = format(monthStart, 'yyyy-MM-dd');
  const to = format(monthEnd, 'yyyy-MM-dd');

  const { data, isLoading } = useCalendarAppointments({ from, to });

  const grouped = useMemo(() => {
    if (!data?.appointments) return {};
    return groupAppointmentsByDate(data.appointments);
  }, [data?.appointments]);

  const calendarDays = useMemo(() => {
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [monthStart, monthEnd]);

  const weekDayHeaders = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return format(d, 'EEEEE', { locale: dateFnsLocale });
    });
  }, [dateFnsLocale]);

  const handlePrev = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNext = () => setCurrentDate((d) => addMonths(d, 1));

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="mb-2">
        <CardTitle>{t('calendar')}</CardTitle>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={rtl ? handleNext : handlePrev}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-foreground min-w-[120px] text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: dateFnsLocale })}
          </span>
          <button
            type="button"
            onClick={rtl ? handlePrev : handleNext}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      {isLoading ? (
        <div className="flex-1 px-1 pb-4">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col px-1 pb-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDayHeaders.map((day, i) => (
              <div
                key={i}
                className="text-center text-[11px] font-semibold text-muted-foreground uppercase py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-[2px] flex-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayAppts = grouped[dateKey] || [];
              const count = dayAppts.length;
              const isCurrentMonth = isSameMonth(day, currentDate);
              const today = isToday(day);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => onDayClick(day, count)}
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-lg p-1 transition-all duration-150 group',
                    'hover:bg-primary-50 hover:scale-105',
                    !isCurrentMonth && 'opacity-30',
                    today && 'ring-2 ring-primary ring-offset-1 ring-offset-card',
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium leading-none',
                      today && 'text-primary font-bold',
                      !today && isCurrentMonth && 'text-foreground',
                      !isCurrentMonth && 'text-muted-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {count > 0 && isCurrentMonth && (
                    <span
                      className={cn(
                        'mt-0.5 flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold leading-none px-1',
                        today
                          ? 'bg-primary text-white'
                          : 'bg-primary-100 text-primary-700',
                      )}
                    >
                      {count}
                    </span>
                  )}
                  {count === 0 && isCurrentMonth && (
                    <span className="mt-0.5 h-[16px]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
