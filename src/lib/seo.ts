import type { Metadata } from 'next';
import { locales, defaultLocale, type Locale } from '@/i18n/config';
import { site } from '@/config/site';

export function getSiteUrl(): string {
  return site.url;
}

export function absoluteUrl(pathname: string): string {
  const base = getSiteUrl();
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, base).toString();
}

export function localeToOgLocale(locale: Locale): string {
  switch (locale) {
    case 'he':
      return 'he_IL';
    case 'en':
      return 'en_IL';
    case 'fr':
      return 'fr_IL';
    case 'ru':
      return 'ru_IL';
    case 'am':
      return 'am_ET';
    case 'es':
      return 'es_IL';
    default:
      return 'he_IL';
  }
}

export function buildAlternatesForPath(pathWithoutLocale: `/${string}`): NonNullable<Metadata['alternates']> {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = absoluteUrl(`/${l}${pathWithoutLocale}`);
  }

  return {
    canonical: pathWithoutLocale,
    languages,
  };
}

export function buildDefaultMetadata(locale: Locale): Metadata {
  const titleByLocale: Record<Locale, string> = {
    he: 'Dokal Pro — מערכת לניהול מרפאה בישראל',
    en: 'Dokal Pro — Medical CRM in Israel',
    fr: 'Dokal Pro — CRM médical en Israël',
    ru: 'Dokal Pro — медицинский CRM в Израиле',
    am: 'Dokal Pro — በእስራኤል የሕክምና CRM',
    es: 'Dokal Pro — CRM médico en Israel',
  };

  const descriptionByLocale: Record<Locale, string> = {
    he: 'ניהול תורים, מטופלים והיומן במקום אחד. CRM רפואי בישראל לרופאים ומטפלים, עם אפליקציה למטופלים.',
    en: 'Manage appointments, patients and schedule in one place. Medical CRM in Israel for doctors and practitioners, with a patient mobile app.',
    fr: 'Gérez rendez-vous, patients et planning au même endroit. CRM médical en Israël pour médecins et praticiens, avec application mobile patient.',
    ru: 'Управляйте приёмами, пациентами и расписанием в одном месте. Медицинский CRM в Израиле для врачей и практиков, с мобильным приложением для пациентов.',
    am: 'ቀጠሮዎችን፣ ታካሚዎችን እና መርሃ ግብርን በአንድ ቦታ ያስተዳድሩ። በእስራኤል ለሐኪሞች እና ባለሙያዎች የሕክምና CRM እና የታካሚ ሞባይል መተግበሪያ።',
    es: 'Gestiona citas, pacientes y agenda en un solo lugar. CRM médico en Israel para médicos y profesionales, con app móvil para pacientes.',
  };

  const keywordsByLocale: Record<Locale, string[]> = {
    he: [
      'Dokal Pro',
      'CRM רפואי',
      'CRM רפואי ישראל',
      'ניהול תורים',
      'יומן רפואי',
      'תוכנה לניהול מרפאה',
    ],
    en: [
      'Dokal Pro',
      'medical CRM Israel',
      'clinic management software Israel',
      'appointment scheduling for doctors',
      'practice management CRM',
      'patient mobile app',
    ],
    fr: [
      'Dokal Pro',
      'CRM médical Israël',
      'CRM medical israel',
      'logiciel cabinet médical',
      'gestion rendez-vous médecins',
      'agenda médical',
      'application patient',
    ],
    ru: [
      'Dokal Pro',
      'медицинский CRM Израиль',
      'CRM клиника Израиль',
      'запись на приём',
      'управление расписанием врача',
    ],
    am: [
      'Dokal Pro',
      'የሕክምና CRM',
      'Israel',
      'appointment scheduling',
      'clinic management',
    ],
    es: [
      'Dokal Pro',
      'CRM médico Israel',
      'CRM medical israel',
      'gestión de citas médicas',
      'software para clínica',
      'agenda médica',
    ],
  };

  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: site.name,
    title: {
      default: titleByLocale[locale],
      template: `%s | ${site.name}`,
    },
    description: descriptionByLocale[locale],
    keywords: keywordsByLocale[locale],
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: localeToOgLocale(locale),
      url: absoluteUrl(`/${locale}/welcome`),
      images: [
        {
          url: absoluteUrl(site.ogImagePath),
          width: 1200,
          height: 800,
          alt: site.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [absoluteUrl(site.ogImagePath)],
    },
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export function normalizeLocale(input: string | undefined | null): Locale {
  if (!input) return defaultLocale;
  return (locales as readonly string[]).includes(input) ? (input as Locale) : defaultLocale;
}

