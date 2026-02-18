'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Appointment, CalendarItem, ExternalEvent } from '@/types';
import type { CrmAppointmentsQuery } from '@/types/api';
import { getCrmAppointmentPatientDisplayName } from '@/lib/crm';

export type CalendarView = 'month' | 'week' | 'day';

interface UseCalendarAppointmentsOptions {
  from: string;
  to: string;
  practitioner_id?: string;
  isOrganization?: boolean;
}

interface CalendarAppointmentsResponse {
  appointments: Appointment[];
  total: number;
}

/**
 * Fetches appointments for a date range (calendar views).
 * Uses /crm/appointments for personal calendar,
 * /crm/organization/appointments when viewing colleague or all-org calendars.
 */
export function useCalendarAppointments({
  from,
  to,
  practitioner_id,
  isOrganization = false,
}: UseCalendarAppointmentsOptions) {
  const endpoint = isOrganization
    ? '/crm/organization/appointments'
    : '/crm/appointments';

  const params: CrmAppointmentsQuery = {
    from,
    to,
    practitioner_id: practitioner_id || undefined,
    limit: 500,
    offset: 0,
  };

  return useQuery({
    queryKey: ['calendar-appointments', endpoint, params],
    queryFn: async () => {
      const { data } = await api.get<CalendarAppointmentsResponse>(endpoint, {
        params,
      });
      return data;
    },
    enabled: !!from && !!to,
  });
}

/**
 * Fetches external events (Google Calendar) for a date range.
 * Returns an empty array when the endpoint is not yet available (404).
 */
// External events hooks were moved to `src/hooks/useExternalEvents.ts`

/**
 * Groups appointments by date for month/week views.
 */
export function groupAppointmentsByDate(
  appointments: Appointment[]
): Record<string, Appointment[]> {
  const grouped: Record<string, Appointment[]> = {};
  for (const appt of appointments) {
    const date = appt.appointment_date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(appt);
  }
  // Sort each day's appointments by start_time
  for (const date of Object.keys(grouped)) {
    grouped[date].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }
  return grouped;
}

/**
 * Merges CRM appointments and external events into a unified CalendarItem
 * list grouped by date.
 */
export function groupCalendarItemsByDate(
  appointments: Appointment[],
  externalEvents: ExternalEvent[],
): Record<string, CalendarItem[]> {
  const grouped: Record<string, CalendarItem[]> = {};

  for (const appt of appointments) {
    const date = appt.appointment_date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({ kind: 'crm_appointment', data: appt });
  }

  for (const evt of externalEvents) {
    const date = evt.date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push({ kind: 'external_event', data: evt });
  }

  // Sort each day by start time
  for (const date of Object.keys(grouped)) {
    grouped[date].sort((a, b) => {
      const aTime =
        a.kind === 'crm_appointment'
          ? a.data.start_time
          : a.data.start_at.substring(11, 19);
      const bTime =
        b.kind === 'crm_appointment'
          ? b.data.start_time
          : b.data.start_at.substring(11, 19);
      return aTime.localeCompare(bTime);
    });
  }

  return grouped;
}

/** Extract a simple start_time (HH:mm:ss) from a CalendarItem */
export function getItemStartTime(item: CalendarItem): string {
  if (item.kind === 'crm_appointment') return item.data.start_time;
  // ExternalEvent stores ISO datetime in start_at
  const timePart = item.data.start_at.substring(11, 19);
  return timePart || '00:00:00';
}

/** Extract a simple end_time (HH:mm:ss) from a CalendarItem */
export function getItemEndTime(item: CalendarItem): string {
  if (item.kind === 'crm_appointment') return item.data.end_time;
  const timePart = item.data.end_at.substring(11, 19);
  return timePart || '23:59:59';
}

/** Get display title for a CalendarItem */
export function getItemTitle(item: CalendarItem): string {
  if (item.kind === 'crm_appointment') {
    return getCrmAppointmentPatientDisplayName(item.data);
  }
  return item.data.title || '';
}
