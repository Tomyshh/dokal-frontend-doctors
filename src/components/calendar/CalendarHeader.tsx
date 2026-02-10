'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/Button';
import ColleagueSelector from './ColleagueSelector';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { fr, enUS, he, ru, es } from 'date-fns/locale';
import type { CalendarView } from '@/hooks/useCalendarAppointments';

const localeMap: Record<string, import('date-fns').Locale> = { fr, en: enUS, he, ru, es };

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  selectedColleague: string | null;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onColleagueChange: (id: string | null) => void;
}

export default function CalendarHeader({
  currentDate,
  view,
  selectedColleague,
  onDateChange,
  onViewChange,
  onColleagueChange,
}: CalendarHeaderProps) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const dateFnsLocale = localeMap[locale] || fr;

  const navigateBack = () => {
    if (view === 'month') onDateChange(subMonths(currentDate, 1));
    else if (view === 'week') onDateChange(subWeeks(currentDate, 1));
    else onDateChange(subDays(currentDate, 1));
  };

  const navigateForward = () => {
    if (view === 'month') onDateChange(addMonths(currentDate, 1));
    else if (view === 'week') onDateChange(addWeeks(currentDate, 1));
    else onDateChange(addDays(currentDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: dateFnsLocale });
    }
    if (view === 'day') {
      return format(currentDate, 'EEEE d MMMM yyyy', { locale: dateFnsLocale });
    }
    // Week view: show range
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const sameMonth = startOfWeek.getMonth() === endOfWeek.getMonth();
    if (sameMonth) {
      return `${format(startOfWeek, 'd', { locale: dateFnsLocale })} - ${format(endOfWeek, 'd MMMM yyyy', { locale: dateFnsLocale })}`;
    }
    return `${format(startOfWeek, 'd MMM', { locale: dateFnsLocale })} - ${format(endOfWeek, 'd MMM yyyy', { locale: dateFnsLocale })}`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: navigation + title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={goToToday} className="text-primary font-medium">
          {t('today')}
        </Button>
        <h2 className="text-lg font-semibold text-gray-900 capitalize">{getTitle()}</h2>
      </div>

      {/* Right: view toggle + colleague selector */}
      <div className="flex items-center gap-3">
        <ColleagueSelector value={selectedColleague} onChange={onColleagueChange} />

        {/* View toggle */}
        <div className="inline-flex items-center rounded-xl border border-border bg-muted/30 p-0.5">
          {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                view === v
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-gray-700'
              )}
            >
              {t(v)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Get the start of the week (Sunday = 0) */
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
