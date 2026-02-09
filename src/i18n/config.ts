export const locales = ['he', 'en', 'fr', 'ru', 'am', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'he';

export const localeNames: Record<Locale, string> = {
  he: 'עברית',
  en: 'English',
  fr: 'Français',
  ru: 'Русский',
  am: 'አማርኛ',
  es: 'Español',
};

export const rtlLocales: Locale[] = ['he'];

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale);
}
