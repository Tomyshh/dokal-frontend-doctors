'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { QuestionnaireConfig } from '@/types';
import type { UpdateQuestionnaireConfigRequest } from '@/types/api';

const EMPTY_CONFIG: QuestionnaireConfig = {
  pre_visit_instructions: [],
  questionnaire_fields: [],
};

// ──────────────────────────────────────────────────────────────────────────────
// Profile-level questionnaire defaults (apply to all appointments)
// GET  /crm/profile/questionnaire-config
// PATCH /crm/profile/questionnaire-config
// ──────────────────────────────────────────────────────────────────────────────

export function useProfileQuestionnaireConfig() {
  return useQuery({
    queryKey: ['profile-questionnaire-config'],
    queryFn: async () => {
      try {
        const { data } = await api.get<QuestionnaireConfig>('/crm/profile/questionnaire-config');
        return data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return EMPTY_CONFIG;
        throw err;
      }
    },
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
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
