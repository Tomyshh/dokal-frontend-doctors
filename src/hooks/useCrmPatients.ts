'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CrmPatientListItem } from '@/types';
import type { CreateCrmPatientRequest, CrmPatientsListQuery, UpdateCrmPatientRequest } from '@/types/api';

export interface CrmPatientSearchResponse {
  patients: CrmPatientListItem[];
  total: number;
}

export interface CrmPatientsListResponse {
  patients: CrmPatientListItem[];
  total: number;
}

export function useCrmPatientSearch(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ['crm-patient-search', q],
    queryFn: async () => {
      const { data } = await api.get<CrmPatientSearchResponse>('/crm/patients/search', {
        params: { q, limit: 20 },
      });
      return data;
    },
    enabled: enabled && !!q,
  });
}

export function useCrmPatients(params: CrmPatientsListQuery) {
  return useQuery({
    queryKey: ['crm-patients', params],
    queryFn: async () => {
      const { data } = await api.get<CrmPatientsListResponse>('/crm/patients', { params });
      return data;
    },
  });
}

export function useCreateCrmPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCrmPatientRequest) => {
      const { data } = await api.post<CrmPatientListItem>('/crm/patients', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-patient-search'] });
      queryClient.invalidateQueries({ queryKey: ['crm-patients'] });
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
    },
  });
}

export function useUpdateCrmPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCrmPatientRequest }) => {
      const { data: result } = await api.patch<CrmPatientListItem>(`/crm/patients/${id}`, data);
      return result;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['patient', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['crm-patient-search'] });
      queryClient.invalidateQueries({ queryKey: ['crm-patients'] });
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
    },
  });
}

