import api from '@/lib/api';
import type { Practitioner } from '@/types';

function getHttpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

/**
 * Fetch the current authenticated practitioner's record.
 * Backend contract: `GET /practitioners/me` returns the practitioner for the current user.
 */
export async function getMyPractitioner(): Promise<Practitioner> {
  const { data } = await api.get<Practitioner>('/practitioners/me');
  return data;
}

/**
 * Same as `getMyPractitioner`, but returns null if the practitioner is not created yet (404).
 * Useful during onboarding right after signup/registration.
 */
export async function getMyPractitionerOrNull(): Promise<Practitioner | null> {
  try {
    return await getMyPractitioner();
  } catch (err) {
    const status = getHttpStatus(err);
    if (status === 404) return null;
    throw err;
  }
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

