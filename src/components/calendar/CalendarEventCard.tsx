'use client';

import { cn } from '@/lib/utils';
import { formatTime } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types';

interface CalendarEventCardProps {
  appointment: Appointment;
  onClick?: (appointment: Appointment) => void;
  compact?: boolean;
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

export function getEventStatusColors(status: AppointmentStatus | string) {
  return statusColors[status] || statusColors.pending;
}

export default function CalendarEventCard({
  appointment,
  onClick,
  compact = false,
}: CalendarEventCardProps) {
  const colors = getEventStatusColors(appointment.status);
  const patientName = appointment.profiles
    ? `${appointment.profiles.first_name || ''} ${appointment.profiles.last_name || ''}`.trim()
    : '';

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(appointment)}
        className={cn(
          'w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate border-l-2 transition-all hover:opacity-80',
          colors.bg,
          colors.border,
          colors.text
        )}
        title={`${formatTime(appointment.start_time)} ${patientName}`}
      >
        <span className="font-medium">{formatTime(appointment.start_time)}</span>{' '}
        {patientName}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick?.(appointment)}
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
          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
        </span>
      </div>
      <p className="text-xs truncate mt-0.5 opacity-80 group-hover:opacity-100">
        {patientName}
      </p>
    </button>
  );
}
