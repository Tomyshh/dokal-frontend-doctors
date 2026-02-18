'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CrmAppointmentsResponse } from '@/types';
import type {
  CrmAppointmentsQuery,
  CancelAppointmentRequest,
  CompleteAppointmentRequest,
  CreateCrmAppointmentRequest,
  UpdateCrmAppointmentRequest,
} from '@/types/api';

export function useCrmAppointments(params: CrmAppointmentsQuery) {
  return useQuery({
    queryKey: ['crm-appointments', params],
    queryFn: async () => {
      const { data } = await api.get<CrmAppointmentsResponse>('/crm/appointments', { params });
      return data;
    },
  });
}

export function useCreateCrmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCrmAppointmentRequest) => {
      const { data } = await api.post<{ id: string }>('/crm/appointments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['external-events'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useUpdateCrmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCrmAppointmentRequest }) => {
      const { data: result } = await api.patch(`/crm/appointments/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}

export function useUpdateCrmOrganizationAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCrmAppointmentRequest }) => {
      const { data: result } = await api.patch(`/crm/organization/appointments/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/crm/appointments/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useConfirmOrganizationAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/crm/organization/appointments/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CancelAppointmentRequest }) => {
      await api.patch(`/crm/appointments/${id}/cancel`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useCancelOrganizationAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CancelAppointmentRequest }) => {
      await api.patch(`/crm/organization/appointments/${id}/cancel`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompleteAppointmentRequest }) => {
      await api.patch(`/crm/appointments/${id}/complete`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useCompleteOrganizationAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompleteAppointmentRequest }) => {
      await api.patch(`/crm/organization/appointments/${id}/complete`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/crm/appointments/${id}/no-show`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useNoShowOrganizationAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/crm/organization/appointments/${id}/no-show`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}
