/**
 * Common languages for practitioner profiles.
 * Display names in English; can be localized later if needed.
 */
export const COMMON_LANGUAGES = [
  'Arabic',
  'Amharic',
  'Chinese',
  'English',
  'French',
  'German',
  'Hebrew',
  'Hindi',
  'Italian',
  'Japanese',
  'Korean',
  'Portuguese',
  'Romanian',
  'Russian',
  'Spanish',
  'Turkish',
  'Ukrainian',
  'Yiddish',
] as const;

export type CommonLanguage = (typeof COMMON_LANGUAGES)[number];
