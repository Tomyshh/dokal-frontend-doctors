'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * A specialty row as returned by `GET /api/v1/specialties`.
 * Mirrors the `public.specialties` table in the backend DB.
 */
export interface BackendSpecialty {
  id: string;          // UUID
  name: string;        // English canonical name
  name_he: string | null;
  name_fr: string | null;
  name_ru: string | null;
  name_en: string | null;
  name_am: string | null;
  name_es: string | null;
  icon_url: string | null;
}

/**
 * Fetches the full list of specialties from the backend.
 *
 * The backend must expose:
 *   GET /api/v1/specialties  →  BackendSpecialty[]
 *
 * This data is cached for the lifetime of the session (staleTime: Infinity)
 * since specialties virtually never change at runtime.
 */
export function useSpecialties() {
  return useQuery<BackendSpecialty[]>({
    queryKey: ['specialties'],
    queryFn: async () => {
      const { data } = await api.get<BackendSpecialty[]>('/specialties');
      return data;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 3000),
  });
}

/**
 * Returns the best display label for a specialty given a locale.
 */
export function getSpecialtyDisplayName(
  specialty: BackendSpecialty,
  locale: string,
): string {
  switch (locale) {
    case 'he': return specialty.name_he || specialty.name;
    case 'fr': return specialty.name_fr || specialty.name;
    case 'ru': return specialty.name_ru || specialty.name;
    case 'es': return specialty.name_es || specialty.name;
    case 'am': return specialty.name_am || specialty.name;
    default:   return specialty.name_en || specialty.name;
  }
}
