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

/**
 * Uses backend's is_complete flag from GET /practitioners/me.
 * 404 → no practitioner → incomplete.
 * 200 with is_complete: true → complete.
 * 200 with is_complete: false or undefined → incomplete.
 */
export function isPractitionerCompleteFromBackend(practitioner: Practitioner | null | undefined): boolean {
  if (!practitioner) return false;
  return practitioner.is_complete === true;
}

