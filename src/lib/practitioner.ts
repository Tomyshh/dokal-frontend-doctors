import api from '@/lib/api';
import type { Practitioner } from '@/types';

function getHttpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

/**
 * Fetch the current authenticated practitioner's record.
 * Backend contract: `GET /practitioners/me` returns the practitioner for the current user.
 * Uses cache-busting to avoid 304 responses that can return stale (incomplete) data after registration.
 */
export async function getMyPractitioner(): Promise<Practitioner> {
  const { data } = await api.get<Practitioner>('/practitioners/me', {
    params: { _t: Date.now() },
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
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

  const p = practitioner as unknown as Record<string, unknown>;
  const hasText = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const specialtyId =
    practitioner.specialty_id ??
    practitioner.specialties?.id ??
    p.specialty;
  const hasSpecialty = hasText(specialtyId);

  const phone = practitioner.phone ?? p.phone;
  const city = practitioner.city ?? p.city;
  const addressLine = practitioner.address_line ?? p.address_line;
  const zipCode = practitioner.zip_code ?? p.zip_code;
  const licenseNumber = practitioner.license_number ?? p.license_number;

  return (
    hasText(phone) &&
    hasText(city) &&
    hasText(addressLine) &&
    hasText(zipCode) &&
    hasText(licenseNumber) &&
    hasSpecialty
  );
}

