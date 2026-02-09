'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Organization, OrganizationMember, Appointment } from '@/types';
import type {
  UpdateOrganizationRequest,
  AddOrganizationMemberRequest,
  UpdateOrganizationMemberRequest,
  CrmAppointmentsQuery,
} from '@/types/api';

// ─── Current practitioner's organization ─────────────────────────────

/** GET /crm/organization — info about the practitioner's organization */
export function useCrmOrganization() {
  return useQuery({
    queryKey: ['crm-organization'],
    queryFn: async () => {
      const { data } = await api.get<Organization>('/crm/organization');
      return data;
    },
  });
}

/** GET /crm/organization/appointments — all appointments of the organization (multi-practitioner) */
export function useCrmOrganizationAppointments(params: CrmAppointmentsQuery) {
  return useQuery({
    queryKey: ['crm-organization-appointments', params],
    queryFn: async () => {
      const { data } = await api.get<{ appointments: Appointment[]; total: number }>(
        '/crm/organization/appointments',
        { params },
      );
      return data;
    },
  });
}

// ─── Organization CRUD ────────────────────────────────────────────────

/** GET /organizations — my organizations */
export function useMyOrganizations() {
  return useQuery({
    queryKey: ['my-organizations'],
    queryFn: async () => {
      const { data } = await api.get<Organization[]>('/organizations');
      return data;
    },
  });
}

/** PATCH /organizations/:id — update organization */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrganizationRequest }) => {
      const { data: result } = await api.patch<Organization>(`/organizations/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-organization'] });
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
  });
}

// ─── Organization Members ─────────────────────────────────────────────

/** GET /organizations/:id/members */
export function useOrganizationMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-members', organizationId],
    queryFn: async () => {
      const { data } = await api.get<OrganizationMember[]>(
        `/organizations/${organizationId}/members`,
      );
      return data;
    },
    enabled: !!organizationId,
  });
}

/** POST /organizations/:id/members — add a member */
export function useAddOrganizationMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: AddOrganizationMemberRequest;
    }) => {
      const { data: result } = await api.post(
        `/organizations/${organizationId}/members`,
        data,
      );
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', variables.organizationId],
      });
    },
  });
}

/** PATCH /organizations/:id/members/:memberId — change role */
export function useUpdateOrganizationMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      memberId,
      data,
    }: {
      organizationId: string;
      memberId: string;
      data: UpdateOrganizationMemberRequest;
    }) => {
      const { data: result } = await api.patch(
        `/organizations/${organizationId}/members/${memberId}`,
        data,
      );
      return result;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', variables.organizationId],
      });
    },
  });
}

/** DELETE /organizations/:id/members/:memberId — remove a member */
export function useRemoveOrganizationMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      memberId,
    }: {
      organizationId: string;
      memberId: string;
    }) => {
      await api.delete(`/organizations/${organizationId}/members/${memberId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['organization-members', variables.organizationId],
      });
    },
  });
}

// ─── Organization Stats ───────────────────────────────────────────────

/** GET /organizations/:id/stats */
export function useOrganizationStats(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['organization-stats', organizationId],
    queryFn: async () => {
      const { data } = await api.get(`/organizations/${organizationId}/stats`);
      return data;
    },
    enabled: !!organizationId,
  });
}
