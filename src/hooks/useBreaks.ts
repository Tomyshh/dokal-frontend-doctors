'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CrmBreak } from '@/types';
import type { CreateBreakRequest } from '@/types/api';

export function useBreaks() {
  return useQuery({
    queryKey: ['crm-breaks'],
    queryFn: async () => {
      const { data } = await api.get<CrmBreak[]>('/crm/breaks');
      return data;
    },
  });
}

export function useCreateBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBreakRequest) => {
      const { data } = await api.post<CrmBreak>('/crm/breaks', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-breaks'] });
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}

export function useUpdateBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { recurring_days?: number[]; remove_day?: number } }) => {
      const { data: result } = await api.patch<CrmBreak | { deleted: true }>(`/crm/breaks/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-breaks'] });
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}

export function useDeleteBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/breaks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-breaks'] });
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}
