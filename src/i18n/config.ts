export const locales = ['fr', 'en', 'he', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  he: 'עברית',
  ru: 'Русский',
};

export const rtlLocales: Locale[] = ['he'];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}
