'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { UserSettings, AppointmentReason, AppointmentInstruction } from '@/types';
import type {
  UpdateSettingsRequest,
  UpdatePractitionerProfileRequest,
  AddReasonRequest,
  UpdateReasonRequest,
  AddInstructionRequest,
  UpdateInstructionRequest,
} from '@/types/api';

// Settings
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get<UserSettings>('/settings');
      return data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateSettingsRequest) => {
      const { data: result } = await api.patch<UserSettings>('/settings', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// Practitioner Profile
export function useUpdatePractitionerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdatePractitionerProfileRequest) => {
      const { data: result } = await api.patch('/crm/profile', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Reasons
export function useReasons() {
  return useQuery({
    queryKey: ['reasons'],
    queryFn: async () => {
      const { data } = await api.get<AppointmentReason[]>('/crm/reasons');
      return data;
    },
  });
}

export function useAddReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddReasonRequest) => {
      const { data: result } = await api.post('/crm/reasons', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reasons'] });
    },
  });
}

export function useUpdateReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReasonRequest }) => {
      const { data: result } = await api.patch(`/crm/reasons/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reasons'] });
    },
  });
}

// Instructions
export function useInstructions() {
  return useQuery({
    queryKey: ['instructions'],
    queryFn: async () => {
      const { data } = await api.get<AppointmentInstruction[]>('/crm/instructions');
      return data;
    },
  });
}

export function useAddInstruction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddInstructionRequest) => {
      const { data: result } = await api.post('/crm/instructions', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] });
    },
  });
}

export function useUpdateInstruction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInstructionRequest }) => {
      const { data: result } = await api.patch(`/crm/instructions/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructions'] });
    },
  });
}
