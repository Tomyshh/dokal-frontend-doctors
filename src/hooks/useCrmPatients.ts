'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CrmPatientListItem } from '@/types';
import type { CreateCrmPatientRequest } from '@/types/api';

export interface CrmPatientSearchResponse {
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

export function useCreateCrmPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCrmPatientRequest) => {
      const { data } = await api.post<CrmPatientListItem>('/crm/patients', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-patient-search'] });
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
    },
  });
}

