'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Appointment } from '@/types';
import type { CrmAppointmentsQuery } from '@/types/api';

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
