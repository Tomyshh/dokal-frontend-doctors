import { SPECIALTY_KEYS, type SpecialtyKey } from '@/data/specialties';
import { SPECIALTY_NAME_EN } from '@/data/specialties-en';

/**
 * Backend currently validates `specialty` as a known specialty name.
 * Our UI stores a specialty *key* (camelCase, e.g. "generalPractice").
 *
 * This maps UI keys -> backend specialty "name" (English label).
 */
export function specialtyKeyToBackendSpecialtyName(value: string): string | null {
  const key = value.trim() as SpecialtyKey;
  if (!key) return null;
  if (!SPECIALTY_KEYS.includes(key)) return null;
  return SPECIALTY_NAME_EN[key] ?? null;
}

