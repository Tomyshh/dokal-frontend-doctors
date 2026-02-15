import api from '@/lib/api';
import type { Organization, OrganizationMember, Practitioner } from '@/types';

function getHttpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

async function tryGetPractitionerById(id: string): Promise<Practitioner | null> {
  try {
    const { data } = await api.get<Practitioner>(`/practitioners/${id}`);
    return data;
  } catch (err) {
    const status = getHttpStatus(err);
    if (status === 404) return null;
    throw err;
  }
}

async function resolvePractitionerIdViaOrganization(userId: string): Promise<string | null> {
  try {
    const { data: org } = await api.get<Organization>('/crm/organization');
    const { data: members } = await api.get<OrganizationMember[]>(`/organizations/${org.id}/members`);
    const me = members.find(
      (m) => m.user_id === userId && m.staff_type === 'practitioner' && !!m.practitioner?.id
    );
    return me?.practitioner?.id ?? null;
  } catch (err) {
    // Non-fatal: organization may not exist yet during onboarding in some environments.
    const status = getHttpStatus(err);
    if (status === 404) return null;
    return null;
  }
}

/**
 * Fetch the current practitioner's record from the backend.
 *
 * Why: some backends model `practitioners.id` independently from `profiles.id` (userId),
 * so `/practitioners/{userId}` can legitimately 404. In that case, we resolve the actual
 * practitioner id via `/crm/organization` + `/organizations/:id/members`.
 */
export async function getPractitionerForUserId(userId: string): Promise<Practitioner | null> {
  const direct = await tryGetPractitionerById(userId);
  if (direct) return direct;

  const practitionerId = await resolvePractitionerIdViaOrganization(userId);
  if (!practitionerId) return null;
  return await tryGetPractitionerById(practitionerId);
}

export function isPractitionerProfileComplete(practitioner: Practitioner | null | undefined): boolean {
  if (!practitioner) return false;
  return !!(
    practitioner.phone &&
    practitioner.city &&
    practitioner.address_line &&
    practitioner.zip_code &&
    practitioner.license_number &&
    practitioner.specialty_id
  );
}

