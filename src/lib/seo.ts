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
    he: 'Dokal — מערכת לניהול מרפאה',
    en: 'Dokal — Practice management CRM',
    fr: 'Dokal — CRM médical pour praticiens',
    ru: 'Dokal — CRM для медицинской практики',
    am: 'Dokal — የሕክምና ስራ አስተዳደር CRM',
    es: 'Dokal — CRM para profesionales de salud',
  };

  const descriptionByLocale: Record<Locale, string> = {
    he: 'ניהול תורים, מטופלים והיומן במקום אחד. חוויית SaaS מודרנית לרופאים ומטפלים בישראל.',
    en: 'Manage appointments, patients and schedule in one place. A modern SaaS experience for doctors and practitioners in Israel.',
    fr: 'Gérez rendez-vous, patients et planning au même endroit. Une expérience SaaS moderne pour médecins et praticiens en Israël.',
    ru: 'Управляйте приёмами, пациентами и расписанием в одном месте. Современный SaaS для врачей и практиков в Израиле.',
    am: 'ቀጠሮዎችን፣ ታካሚዎችን እና መርሃ ግብርን በአንድ ቦታ ያስተዳድሩ። ለእስራኤል ሐኪሞች እና ባለሙያዎች ዘመናዊ SaaS ልምድ።',
    es: 'Gestiona citas, pacientes y agenda en un solo lugar. Una experiencia SaaS moderna para médicos y profesionales en Israel.',
  };

  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: site.name,
    title: {
      default: titleByLocale[locale],
      template: `%s | ${site.name}`,
    },
    description: descriptionByLocale[locale],
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

