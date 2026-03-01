'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { QuestionnaireConfig } from '@/types';
import type { UpdateQuestionnaireConfigRequest } from '@/types/api';

// ──────────────────────────────────────────────────────────────────────────────
// Profile-level questionnaire defaults (apply to all appointments)
// GET  /crm/profile/questionnaire-config
// PATCH /crm/profile/questionnaire-config
// ──────────────────────────────────────────────────────────────────────────────

export function useProfileQuestionnaireConfig() {
  return useQuery({
    queryKey: ['profile-questionnaire-config'],
    queryFn: async () => {
      const { data } = await api.get<QuestionnaireConfig>('/crm/profile/questionnaire-config');
      return data;
    },
  });
}

export function useUpdateProfileQuestionnaireConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateQuestionnaireConfigRequest) => {
      const { data } = await api.patch<QuestionnaireConfig>(
        '/crm/profile/questionnaire-config',
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-questionnaire-config'] });
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Appointment-level questionnaire override (specific to one appointment)
// PATCH /crm/appointments/{id}/questionnaire-config
// ──────────────────────────────────────────────────────────────────────────────

export function useUpdateAppointmentQuestionnaireConfig(appointmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateQuestionnaireConfigRequest) => {
      const { data } = await api.patch(
        `/crm/appointments/${appointmentId}/questionnaire-config`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
  });
}
