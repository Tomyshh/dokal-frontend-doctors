export const locales = ['fr', 'en', 'he'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  he: 'עברית',
};

export const rtlLocales: Locale[] = ['he'];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}
