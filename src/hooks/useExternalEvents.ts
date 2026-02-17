'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ExternalEvent } from '@/types';
import type { CreateExternalEventRequest } from '@/types/api';

export interface ExternalEventsResponse {
  events: ExternalEvent[];
  total: number;
}

/**
 * Fetch external events (manual + Google imported) for a date range.
 *
 * Backend recommended endpoint: GET /crm/external-events?from=...&to=...
 * For backward compat, we fall back to /integrations/google-calendar/events.
 */
export function useExternalEvents(params: { from: string; to: string }) {
  const { from, to } = params;
  return useQuery({
    queryKey: ['external-events', from, to],
    queryFn: async () => {
      // 1) Preferred CRM endpoint
      try {
        const { data } = await api.get<ExternalEventsResponse>('/crm/external-events', {
          params: { from, to },
        });
        return data.events;
      } catch {
        // ignore and try fallback
      }

      // 2) Legacy endpoint (Google-only)
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

