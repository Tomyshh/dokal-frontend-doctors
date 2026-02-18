'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CrmPatientListItem, Appointment } from '@/types';

export type CrmPatientDetail = {
  /** Some backends return the patient record directly */
  id?: string;
  /** Some backends wrap it under `patient` */
  patient?: CrmPatientListItem;
  /** Some backends expose appointments history */
  appointments?: Appointment[];
  appointment_history?: Appointment[];
  // keep permissive
  [key: string]: unknown;
};

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const { data } = await api.get<CrmPatientDetail>(`/crm/patients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
