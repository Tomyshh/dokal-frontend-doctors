'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ExternalEvent, ExtractedPatientInfo, ConvertToAppointmentPayload } from '@/types';
import type { CreateExternalEventRequest } from '@/types/api';

export interface ExternalEventsResponse {
  events: ExternalEvent[];
  total: number;
}

/**
 * Fetch external events (manual + Google imported) for a date range.
 *
 * Backend recommended endpoint (Google overlay): GET /integrations/google-calendar/external-events?from=...&to=...
 * For backward compat, we fall back to /crm/external-events then /integrations/google-calendar/events.
 */
export function useExternalEvents(params: { from: string; to: string }) {
  const { from, to } = params;
  return useQuery({
    queryKey: ['external-events', from, to],
    queryFn: async () => {
      // 1) Preferred Google overlay endpoint
      try {
        const { data } = await api.get<ExternalEventsResponse>(
          '/integrations/google-calendar/external-events',
          { params: { from, to } },
        );
        return data.events;
      } catch {
        // ignore and try fallback
      }

      // 2) CRM endpoint (manual + imported, if enabled server-side)
      try {
        const { data } = await api.get<ExternalEventsResponse>('/crm/external-events', {
          params: { from, to },
        });
        return data.events;
      } catch {
        // ignore and try fallback
      }

      // 3) Legacy endpoint (Google-only)
      try {
        const { data } = await api.get<ExternalEventsResponse>(
          '/integrations/google-calendar/events',
          { params: { from, to } },
        );
        return data.events;
      } catch {
        return [] as ExternalEvent[];
      }
    },
    enabled: !!from && !!to,
  });
}

export function useCreateExternalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateExternalEventRequest) => {
      const { data: result } = await api.post<ExternalEvent>('/crm/external-events', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
    },
  });
}

export function useDeleteExternalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/external-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
    },
  });
}

export function useExtractPatientInfo() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.post<ExtractedPatientInfo>(
        `/crm/external-events/${eventId}/extract-patient-info`,
      );
      return data;
    },
  });
}

export function useConvertExternalEventToAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      payload,
    }: {
      eventId: string;
      payload: ConvertToAppointmentPayload;
    }) => {
      const { data } = await api.post<{ appointment_id: string }>(
        `/crm/external-events/${eventId}/convert-to-appointment`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      queryClient.invalidateQueries({ queryKey: ['crm-patients'] });
      queryClient.invalidateQueries({ queryKey: ['crm-patient-search'] });
    },
  });
}

export function useDismissExternalEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      await api.patch(`/crm/external-events/${eventId}`, {
        type_detected: 'busy',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}

export function usePendingReviewCount() {
  return useQuery({
    queryKey: ['pending-review-count'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>(
        '/crm/external-events/pending-review-count',
      );
      return data.count;
    },
    refetchInterval: 30_000,
  });
}

