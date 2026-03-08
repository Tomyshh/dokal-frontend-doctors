'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn, formatTime } from '@/lib/utils';
import { useCrmAppointments } from '@/hooks/useAppointments';
import { useBreaks } from '@/hooks/useBreaks';
import { useWeeklySchedule } from '@/hooks/useSchedule';
import { Clock, CalendarDays, Loader2 } from 'lucide-react';
import type { Appointment } from '@/types';

interface DayTimelineProps {
  date: string;
  selectedStart?: string;
  selectedEnd?: string;
  slotDurationMinutes?: number;
  onSlotSelect?: (start: string, end: string) => void;
}

function toMinutes(t: string): number {
  const parts = t.replace(/:\d{2}$/, '').split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}

function fromMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay();
}

interface TimeSlot {
  start: number;
  end: number;
  type: 'free' | 'booked' | 'break' | 'selected';
  appointment?: Appointment;
  patientName?: string;
}

export function DayTimeline({ date, selectedStart, selectedEnd, slotDurationMinutes = 30, onSlotSelect }: DayTimelineProps) {
  const t = useTranslations('appointments');
  const { data: schedule, isLoading: loadingSchedule } = useWeeklySchedule();
  const { data: appointmentsData, isLoading: loadingAppointments } = useCrmAppointments({
    date,
    limit: 100,
  });
  const { data: breaksData, isLoading: loadingBreaks } = useBreaks();

  const dayOfWeek = useMemo(() => getDayOfWeek(date), [date]);

  const applicableBreaks = useMemo(() => {
    if (!breaksData) return [];
    return breaksData.filter((brk) => {
      if (!brk.is_active) return false;
      if (brk.is_recurring) {
        const days = brk.recurring_days ?? [];
        return days.includes(dayOfWeek);
      }
      return brk.date === date;
    });
  }, [breaksData, date, dayOfWeek]);

  const scheduleBlock = useMemo(() => {
    if (!schedule) return null;
    const blocks = schedule.filter((b) => b.day_of_week === dayOfWeek && b.is_active);
    if (blocks.length === 0) return null;
    const earliest = blocks.reduce((min, b) => (toMinutes(b.start_time) < toMinutes(min.start_time) ? b : min));
    const latest = blocks.reduce((max, b) => (toMinutes(b.end_time) > toMinutes(max.end_time) ? b : max));
    return {
      start: toMinutes(earliest.start_time),
      end: toMinutes(latest.end_time),
      slotDuration: earliest.slot_duration_minutes,
    };
  }, [schedule, dayOfWeek]);

  const appointments = useMemo(() => {
    return (appointmentsData?.appointments ?? []).filter(
      (a) => a.status !== 'cancelled_by_patient' && a.status !== 'cancelled_by_practitioner',
    );
  }, [appointmentsData]);

  const effectiveSlotDuration = scheduleBlock?.slotDuration ?? slotDurationMinutes;

  const slots = useMemo(() => {
    if (!scheduleBlock) return [];

    const selectedStartMin = selectedStart ? toMinutes(selectedStart) : -1;
    const selectedEndMin = selectedEnd ? toMinutes(selectedEnd) : -1;

    const result: TimeSlot[] = [];
    for (let m = scheduleBlock.start; m < scheduleBlock.end; m += effectiveSlotDuration) {
      const slotEnd = Math.min(m + effectiveSlotDuration, scheduleBlock.end);

      const overlapping = appointments.find((a) => {
        const aStart = toMinutes(a.start_time);
        const aEnd = toMinutes(a.end_time);
        return aStart < slotEnd && aEnd > m;
      });

      const overlappingBreak = applicableBreaks.find((brk) => {
        const bStart = toMinutes(brk.start_time);
        const bEnd = toMinutes(brk.end_time);
        return bStart < slotEnd && bEnd > m;
      });

      const isSelected = selectedStartMin >= 0 && selectedEndMin > 0 && m >= selectedStartMin && m < selectedEndMin;

      if (isSelected) {
        result.push({ start: m, end: slotEnd, type: 'selected' });
      } else if (overlapping) {
        const name = overlapping.patient_record
          ? `${overlapping.patient_record.first_name || ''} ${overlapping.patient_record.last_name || ''}`.trim()
          : overlapping.profiles
            ? `${overlapping.profiles.first_name || ''} ${overlapping.profiles.last_name || ''}`.trim()
            : '';
        result.push({ start: m, end: slotEnd, type: 'booked', appointment: overlapping, patientName: name });
      } else if (overlappingBreak) {
        result.push({ start: m, end: slotEnd, type: 'break' });
      } else {
        result.push({ start: m, end: slotEnd, type: 'free' });
      }
    }
    return result;
  }, [scheduleBlock, appointments, applicableBreaks, selectedStart, selectedEnd, effectiveSlotDuration]);

  const isLoading = loadingSchedule || loadingAppointments || loadingBreaks;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('timelineLoading')}
        </div>
      </div>
    );
  }

  if (!scheduleBlock) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {t('timelineNoSchedule')}
        </div>
      </div>
    );
  }

  const totalMinutes = scheduleBlock.end - scheduleBlock.start;

  const bookedCount = slots.filter((s) => s.type === 'booked').length;
  const breakCount = slots.filter((s) => s.type === 'break').length;
  const freeCount = slots.filter((s) => s.type === 'free').length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{t('timelineTitle')}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />
            {t('timelineFree')} ({freeCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-100 border border-red-300" />
            {t('timelineBusy')} ({bookedCount})
          </span>
          {breakCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-200/60" />
              {t('timelineBreak')} ({breakCount})
            </span>
          )}
        </div>
      </div>

      <p className="px-4 pb-2 text-[11px] text-muted-foreground">
        {t('timelineHint')}
      </p>

      {/* Timeline bar */}
      <div className="px-4 pb-3">
        <div className="flex gap-0.5 rounded-lg overflow-hidden">
          {slots.map((slot) => {
            const widthPercent = ((slot.end - slot.start) / totalMinutes) * 100;
            return (
              <button
                key={slot.start}
                type="button"
                disabled={slot.type === 'booked' || slot.type === 'break'}
                onClick={() => {
                  if ((slot.type === 'free' || slot.type === 'selected') && onSlotSelect) {
                    onSlotSelect(fromMinutes(slot.start), fromMinutes(slot.end));
                  }
                }}
                title={
                  slot.type === 'booked'
                    ? `${formatTime(fromMinutes(slot.start))} - ${formatTime(fromMinutes(slot.end))}${slot.patientName ? ` • ${slot.patientName}` : ''}`
                    : `${formatTime(fromMinutes(slot.start))} - ${formatTime(fromMinutes(slot.end))}`
                }
                className={cn(
                  'relative h-9 transition-all group',
                  slot.type === 'free' && 'bg-emerald-50 hover:bg-emerald-100 border-y border-emerald-200/60 cursor-pointer',
                  slot.type === 'booked' && 'bg-red-100/80 border-y border-red-200/60 cursor-not-allowed',
                  slot.type === 'break' && 'bg-amber-100/80 border-y border-amber-200/60 cursor-not-allowed',
                  slot.type === 'selected' && 'bg-primary/15 border-y border-primary/30 ring-1 ring-primary/20 cursor-pointer',
                )}
                style={{ width: `${widthPercent}%`, minWidth: '2px' }}
              >
                {slot.type === 'booked' && slot.patientName && widthPercent > 8 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] text-red-700 font-medium truncate px-0.5">
                    {slot.patientName}
                  </span>
                )}
                {slot.type === 'selected' && widthPercent > 6 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] text-primary font-semibold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time labels */}
      <div className="px-4 pb-3">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatTime(fromMinutes(scheduleBlock.start))}</span>
          {totalMinutes > 180 && (
            <span>{formatTime(fromMinutes(scheduleBlock.start + Math.floor(totalMinutes / 3)))}</span>
          )}
          {totalMinutes > 180 && (
            <span>{formatTime(fromMinutes(scheduleBlock.start + Math.floor((totalMinutes * 2) / 3)))}</span>
          )}
          <span>{formatTime(fromMinutes(scheduleBlock.end))}</span>
        </div>
      </div>
    </div>
  );
}
