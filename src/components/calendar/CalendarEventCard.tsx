'use client';

import { cn, formatTime } from '@/lib/utils';
import type { Appointment, AppointmentStatus, CalendarItem } from '@/types';
import { getItemStartTime, getItemEndTime, getItemTitle } from '@/hooks/useCalendarAppointments';
import { isDraftPatientAppointment } from '@/lib/crm';

interface CalendarEventCardProps {
  item: CalendarItem;
  onClick?: (item: CalendarItem) => void;
  compact?: boolean;
  /** @deprecated Use `item` instead. Kept for backward compat with existing call-sites. */
  appointment?: Appointment;
}

const statusColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  pending: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    dot: 'bg-amber-400',
  },
  confirmed: {
    bg: 'bg-primary-50',
    border: 'border-primary-300',
    text: 'text-primary-900',
    dot: 'bg-primary',
  },
  completed: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    dot: 'bg-emerald-500',
  },
  cancelled_by_patient: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    dot: 'bg-red-400',
  },
  cancelled_by_practitioner: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    dot: 'bg-red-400',
  },
  no_show: {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  },
};

/** Colors for Google Calendar external events */
export const externalEventColors = {
  appointment: {
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
    dot: 'bg-blue-400',
  },
  busy: {
    bg: 'bg-slate-100',
    border: 'border-slate-400',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
};

export function getEventStatusColors(status: AppointmentStatus | string) {
  return statusColors[status] || statusColors.pending;
}

export function getItemColors(item: CalendarItem) {
  if (item.kind === 'crm_appointment') {
    return getEventStatusColors(item.data.status);
  }
  return externalEventColors[item.data.type_detected] || externalEventColors.busy;
}

function getSourceShort(source?: string | null) {
  switch (source) {
    case 'dokal_crm':
      return 'CRM';
    case 'dokal_app':
      return 'APP';
    case 'google_calendar_sync':
      return 'G';
    case 'legacy_unknown':
    default:
      return '?';
  }
}

export default function CalendarEventCard({
  item,
  onClick,
  compact = false,
}: CalendarEventCardProps) {
  const colors = getItemColors(item);
  const title = getItemTitle(item);
  const startTime = getItemStartTime(item);
  const endTime = getItemEndTime(item);
  const isExternal = item.kind === 'external_event';
  const isDraft =
    item.kind === 'crm_appointment' ? isDraftPatientAppointment(item.data) : false;
  const isMissing =
    item.kind === 'crm_appointment' ? item.data.patient_info_missing === true : false;
  const sourceShort =
    item.kind === 'crm_appointment' ? getSourceShort(item.data.source) : '';

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(item)}
        className={cn(
          'w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate border-l-2 transition-all hover:opacity-80',
          colors.bg,
          colors.border,
          colors.text
        )}
        title={`${formatTime(startTime)} ${title}`}
      >
        <span className="font-medium">{formatTime(startTime)}</span>{' '}
        {isExternal && <span className="opacity-60">[G] </span>}
        {!isExternal && sourceShort && <span className="opacity-60">[{sourceShort}] </span>}
        {!isExternal && isDraft && <span className="opacity-60">[D] </span>}
        {!isExternal && isMissing && <span className="opacity-60">[!] </span>}
        {title}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={cn(
        'w-full text-left px-2 py-1.5 rounded-lg border-l-[3px] transition-all hover:shadow-sm cursor-pointer group',
        colors.bg,
        colors.border,
        colors.text
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', colors.dot)} />
        <span className="text-xs font-semibold truncate">
          {formatTime(startTime)} - {formatTime(endTime)}
        </span>
        {isExternal && (
          <span className="text-[9px] font-medium px-1 py-0 rounded bg-white/60 shrink-0">
            G
          </span>
        )}
      </div>
      <p className="text-xs truncate mt-0.5 opacity-80 group-hover:opacity-100">
        {title}
      </p>
      {!isExternal && (
        <div className="flex items-center gap-1.5 mt-1 text-[10px] opacity-70 group-hover:opacity-90">
          {sourceShort && (
            <span className="px-1 py-0 rounded bg-white/60 border border-border/60">
              {sourceShort}
            </span>
          )}
          {isDraft && (
            <span className="px-1 py-0 rounded bg-amber-50 border border-amber-200 text-amber-800">
              DRAFT
            </span>
          )}
          {isMissing && (
            <span className="px-1 py-0 rounded bg-red-50 border border-red-200 text-red-700">
              !
            </span>
          )}
        </div>
      )}
    </button>
  );
}
