import api from '@/lib/api';
import type { Practitioner } from '@/types';

function getHttpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

/** Unwrap practitioner from common API response shapes (direct, { data }, { practitioner }) */
export function unwrapPractitioner(raw: unknown): Practitioner {
  if (!raw || typeof raw !== 'object') return raw as Practitioner;
  const obj = raw as Record<string, unknown>;
  const inner = obj.data ?? obj.practitioner;
  if (inner && typeof inner === 'object') return inner as Practitioner;
  return raw as Practitioner;
}

/**
 * Fetch the current authenticated practitioner's record.
 * Backend contract: `GET /practitioners/me` returns the practitioner for the current user.
 * Uses cache-busting to avoid 304 responses that can return stale (incomplete) data after registration.
 */
export async function getMyPractitioner(): Promise<Practitioner> {
  const { data } = await api.get<unknown>('/practitioners/me', {
    params: { _t: Date.now() },
  });
  return unwrapPractitioner(data) as Practitioner;
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

/** Extract a non-empty string from various possible keys (snake_case, camelCase, etc.) */
function getText(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v).trim();
  }
  return null;
}

/** Get text from obj or from nested organization/site/profiles (common backend patterns) */
function getTextOrNested(obj: Record<string, unknown>, ...keys: string[]): string | null {
  let v = getText(obj, ...keys);
  if (v) return v;
  for (const nest of ['organization', 'organizations', 'site', 'profiles', 'profile']) {
    const n = obj[nest];
    if (n && typeof n === 'object') v = getText(n as Record<string, unknown>, ...keys);
    if (v) return v;
  }
  return null;
}

/** Some backends return license in a licenses[] array */
function getLicenseFromLicensesArray(obj: Record<string, unknown>): string | null {
  const licenses = obj.licenses ?? obj.practitioner_licenses;
  if (!Array.isArray(licenses) || licenses.length === 0) return null;
  const first = licenses[0] as Record<string, unknown>;
  return getText(first, 'license_number', 'licenseNumber', 'license', 'number');
}

/** Check if specialty is present: id, or object with id/name (backend may return specialties with name only) */
function hasSpecialty(obj: Record<string, unknown>): boolean {
  const sid = obj.specialty_id ?? obj.specialtyId ?? obj.specialty_uuid;
  if (typeof sid === 'string' && sid.trim().length > 0) return true;
  if (typeof sid === 'number') return true;
  const spec = obj.specialties ?? obj.specialty;
  if (spec && typeof spec === 'object' && !Array.isArray(spec)) {
    const s = spec as Record<string, unknown>;
    if (s.id ?? s.uuid) return true;
    if (typeof s.name === 'string' && s.name.trim().length > 0) return true;
  }
  const arr = obj.specialties ?? obj.specialty;
  if (Array.isArray(arr) && arr.length > 0) {
    const first = arr[0] as Record<string, unknown>;
    if (first?.id ?? first?.uuid ?? first?.name) return true;
  }
  for (const nest of ['organization', 'organizations', 'site']) {
    const n = obj[nest];
    if (n && typeof n === 'object' && hasSpecialty(n as Record<string, unknown>)) return true;
  }
  return false;
}

export function isPractitionerProfileComplete(practitioner: Practitioner | null | undefined): boolean {
  if (!practitioner) return false;

  const p = practitioner as unknown as Record<string, unknown>;

  const phone = getText(p, 'phone');
  const city = getTextOrNested(p, 'city');
  const addressLine = getTextOrNested(p, 'address_line', 'addressLine', 'address');
  const zipCode = getTextOrNested(p, 'zip_code', 'zipCode', 'postal_code');
  const licenseNumber =
    getTextOrNested(p, 'license_number', 'licenseNumber', 'license', 'licence') ??
    getTextOrNested(p, 'specialization_license', 'specializationLicense') ??
    getLicenseFromLicensesArray(p);
  const specialtyOk = hasSpecialty(p);

  const ok =
    !!phone &&
    !!city &&
    !!addressLine &&
    !!zipCode &&
    !!licenseNumber &&
    specialtyOk;

  if (!ok && process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[isPractitionerProfileComplete] Incomplete:', {
      hasPhone: !!phone,
      hasCity: !!city,
      hasAddress: !!addressLine,
      hasZip: !!zipCode,
      hasLicense: !!licenseNumber,
      hasSpecialty: specialtyOk,
      rawKeys: Object.keys(p),
      license_value: p.license_number ?? p.licenseNumber ?? p.license ?? p.specialization_license,
      specialty_value: p.specialty_id ?? p.specialtyId ?? p.specialties ?? p.specialty,
      raw: p,
    });
  }

  return ok;
}

