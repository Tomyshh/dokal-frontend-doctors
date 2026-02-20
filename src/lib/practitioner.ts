import api from '@/lib/api';
import type { Practitioner, Profile } from '@/types';

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

/** Fields used to compute profile completion percentage (UX indicator) */
const PROFILE_COMPLETION_FIELDS = [
  (p: Practitioner | null, profile: Profile | null) => !!profile?.avatar_url,
  (p: Practitioner | null) => !!(p?.about?.trim()),
  (p: Practitioner | null) => !!(p?.education?.trim()),
  (p: Practitioner | null) => !!(p?.languages?.length),
  (p: Practitioner | null) => !!(p?.phone?.trim()),
  (p: Practitioner | null) => !!(p?.email?.trim()),
  (p: Practitioner | null) => !!(p?.address_line?.trim()),
  (p: Practitioner | null) => !!(p?.zip_code?.trim()),
  (p: Practitioner | null) => !!(p?.city?.trim()),
  (p: Practitioner | null) => p?.price_min_agorot != null,
  (p: Practitioner | null) => p?.price_max_agorot != null,
] as const;

/**
 * Compute profile completion percentage (0-100) for UX display.
 * Based on avatar, about, education, languages, phone, email, address, zip, city, price range.
 */
export function computeProfileCompletionPercent(
  practitioner: Practitioner | null | undefined,
  profile: Profile | null | undefined
): number {
  if (!practitioner) return 0;
  const filled = PROFILE_COMPLETION_FIELDS.filter((fn) => fn(practitioner, profile ?? null)).length;
  return Math.round((filled / PROFILE_COMPLETION_FIELDS.length) * 100);
}

export type ProfileCompletionItem = {
  key: string;
  completed: boolean;
  section: 'avatar' | 'about' | 'contact' | 'address' | 'pricing';
};

/**
 * Get list of profile completion items with their status for display.
 */
export function getProfileCompletionItems(
  practitioner: Practitioner | null | undefined,
  profile: Profile | null | undefined
): ProfileCompletionItem[] {
  const p = practitioner ?? null;
  const prof = profile ?? null;
  return [
    { key: 'avatar', completed: !!prof?.avatar_url, section: 'avatar' },
    { key: 'about', completed: !!(p?.about?.trim()), section: 'about' },
    { key: 'education', completed: !!(p?.education?.trim()), section: 'about' },
    { key: 'languages', completed: !!(p?.languages?.length), section: 'about' },
    { key: 'phone', completed: !!(p?.phone?.trim()), section: 'contact' },
    { key: 'email', completed: !!(p?.email?.trim()), section: 'contact' },
    { key: 'address_line', completed: !!(p?.address_line?.trim()), section: 'address' },
    { key: 'zip_code', completed: !!(p?.zip_code?.trim()), section: 'address' },
    { key: 'city', completed: !!(p?.city?.trim()), section: 'address' },
    { key: 'price_min', completed: p?.price_min_agorot != null, section: 'pricing' },
    { key: 'price_max', completed: p?.price_max_agorot != null, section: 'pricing' },
  ];
}

