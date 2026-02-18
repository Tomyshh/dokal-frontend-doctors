'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CrmPatientListItem, Appointment, PatientView } from '@/types';

export type CrmPatientDetail = {
  /** Some backends return the patient record directly */
  id?: string;
  /** Some backends wrap it under `patient` */
  patient?: CrmPatientListItem;
  /** Some backends expose appointments history */
  appointments?: Appointment[];
  appointment_history?: Appointment[];
  /** Some backends return a PatientView-like shape */
  profile?: PatientView['profile'];
  health_profile?: PatientView['health_profile'];
  conditions?: PatientView['conditions'];
  allergies?: PatientView['allergies'];
  medications?: PatientView['medications'];
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
