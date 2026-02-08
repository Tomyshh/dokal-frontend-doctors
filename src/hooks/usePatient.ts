'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { PatientView } from '@/types';

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await api.get<PatientView>(`/crm/patients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
