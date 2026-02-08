'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { WeeklySchedule, ScheduleOverride } from '@/types';
import type { AddScheduleRequest, UpdateScheduleRequest, UpsertOverrideRequest } from '@/types/api';

export function useWeeklySchedule() {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: async () => {
      const { data } = await api.get<WeeklySchedule[]>('/crm/schedule');
      return data;
    },
  });
}

export function useAddScheduleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddScheduleRequest) => {
      const { data: result } = await api.post<WeeklySchedule>('/crm/schedule', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

export function useUpdateScheduleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduleRequest }) => {
      const { data: result } = await api.patch<WeeklySchedule>(`/crm/schedule/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

export function useDeleteScheduleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/schedule/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

// Overrides
export function useScheduleOverrides() {
  return useQuery({
    queryKey: ['overrides'],
    queryFn: async () => {
      const { data } = await api.get<ScheduleOverride[]>('/crm/overrides');
      return data;
    },
  });
}

export function useUpsertOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpsertOverrideRequest) => {
      const { data: result } = await api.post<ScheduleOverride>('/crm/overrides', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overrides'] });
    },
  });
}

export function useDeleteOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/crm/overrides/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overrides'] });
    },
  });
}
