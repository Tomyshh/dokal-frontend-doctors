'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Organization, OrganizationMember, Appointment } from '@/types';
import type {
  UpdateOrganizationRequest,
  UpdateOrganizationMemberRequest,
  InviteMemberRequest,
  InviteMemberResponse,
  CrmAppointmentsQuery,
  CancelAppointmentRequest,
  CompleteAppointmentRequest,
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

// ─── Organization-level appointment actions (for secretaries / org admins) ──

export function useOrgConfirmAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/crm/organization/appointments/${id}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-organization-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useOrgCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CancelAppointmentRequest }) => {
      await api.patch(`/crm/organization/appointments/${id}/cancel`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-organization-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useOrgCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompleteAppointmentRequest }) => {
      await api.patch(`/crm/organization/appointments/${id}/complete`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-organization-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
    },
  });
}

export function useOrgNoShowAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/crm/organization/appointments/${id}/no-show`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-organization-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
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

/** GET /organizations/:id/members — enriched member list */
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

/** POST /organizations/:id/invite — invite a new member (practitioner or secretary) */
export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: InviteMemberRequest;
    }) => {
      const { data: result } = await api.post<InviteMemberResponse>(
        `/organizations/${organizationId}/invite`,
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
