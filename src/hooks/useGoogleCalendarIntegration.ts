'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GoogleCalendarStatus, GoogleCalendarEntry } from '@/types';
import type {
  UpdateGoogleCalendarConfigRequest,
  GoogleCalendarConnectResponse,
  GoogleCalendarSyncResponse,
} from '@/types/api';

const GCAL_BASE = '/integrations/google-calendar';
const GCAL_QUERY_KEY = ['google-calendar-status'];

/**
 * Fetch the current Google Calendar integration status & config.
 */
export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: GCAL_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<GoogleCalendarStatus>(`${GCAL_BASE}/status`);
      return data;
    },
  });
}

/**
 * Fetch the list of Google calendars accessible by the connected account.
 * Only enabled when the integration is connected.
 */
export function useGoogleCalendars(enabled: boolean) {
  return useQuery({
    queryKey: ['google-calendars'],
    queryFn: async () => {
      const { data } = await api.get<GoogleCalendarEntry[]>(`${GCAL_BASE}/calendars`);
      return data;
    },
    enabled,
  });
}

/**
 * Start the OAuth flow: returns an auth_url the frontend will redirect to.
 */
export function useStartGoogleCalendarConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<GoogleCalendarConnectResponse>(`${GCAL_BASE}/connect`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GCAL_QUERY_KEY });
    },
  });
}

/**
 * Disconnect Google Calendar (revoke tokens + remove watch).
 */
export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post(`${GCAL_BASE}/disconnect`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GCAL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['google-calendars'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}

/**
 * Update sync configuration (calendar, toggles, keywords, AI…).
 */
export function useUpdateGoogleCalendarConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateGoogleCalendarConfigRequest) => {
      const { data: result } = await api.patch<GoogleCalendarStatus>(
        `${GCAL_BASE}/config`,
        data,
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GCAL_QUERY_KEY });
    },
  });
}

/**
 * Trigger a manual sync (useful for first import / debug).
 */
export function useManualGoogleCalendarSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<GoogleCalendarSyncResponse>(`${GCAL_BASE}/sync`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GCAL_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}
