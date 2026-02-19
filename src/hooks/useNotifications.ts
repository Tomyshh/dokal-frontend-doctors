'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Notification } from '@/types';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get<Notification[]>('/notifications');
      return data;
    },
    refetchInterval: 30000,
  });
}

/**
 * Unread notifications count. Only for patients — GET /notifications/unread-count
 * requires requirePatient. Practitioners get 403.
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/notifications/unread-count');
      return data.count;
    },
    refetchInterval: 15000,
    enabled: false, // Disabled: endpoint is patient-only. Enable when backend supports practitioners.
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });
}
