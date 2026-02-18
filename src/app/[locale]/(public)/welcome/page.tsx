import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { company } from '@/config/company';
import { JsonLd } from '@/components/seo/JsonLd';
import { absoluteUrl, buildAlternatesForPath, buildDefaultMetadata, getSiteUrl, normalizeLocale } from '@/lib/seo';
import WelcomePageClient from './WelcomePageClient';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  await getTranslations({ locale, namespace: 'landing' });

  const titleByLocale: Record<string, string> = {
    he: 'Dokal Pro — מערכת לניהול מרפאה בישראל',
    en: 'Dokal Pro — Medical CRM in Israel for doctors & practitioners',
    fr: 'Dokal Pro — CRM médical en Israël pour médecins & praticiens',
    ru: 'Dokal Pro — медицинский CRM в Израиле для врачей и практиков',
    am: 'Dokal Pro — በእስራኤል የሕክምና CRM ለሐኪሞች እና ባለሙያዎች',
    es: 'Dokal Pro — CRM médico en Israel para médicos y profesionales',
  };

  const descriptionByLocale: Record<string, string> = {
    he: 'CRM רפואי בישראל: ניהול תורים, יומן, מטופלים והודעות. כולל אפליקציה למטופלים.',
    en: 'Medical CRM in Israel: appointments, schedule, patients and messaging. Includes a patient mobile app.',
    fr: 'CRM médical en Israël : rendez-vous, planning, patients et messagerie. Avec application mobile patient.',
    ru: 'Медицинский CRM в Израиле: приёмы, расписание, пациенты и сообщения. С мобильным приложением для пациентов.',
    am: 'በእስራኤል የሕክምና CRM፡ ቀጠሮ፣ መርሃ ግብር፣ ታካሚዎች እና መልዕክት። የታካሚ ሞባይል መተግበሪያ አለው።',
    es: 'CRM médico en Israel: citas, agenda, pacientes y mensajería. Incluye app móvil para pacientes.',
  };

  const title = titleByLocale[locale] ?? titleByLocale.he;
  const description = descriptionByLocale[locale] ?? descriptionByLocale.he;

  return {
    ...buildDefaultMetadata(locale),
    title,
    description,
    alternates: buildAlternatesForPath('/welcome'),
    openGraph: {
      ...buildDefaultMetadata(locale).openGraph,
      title,
      description,
      url: `/${locale}/welcome`,
    },
  };
}

export default async function WelcomePage() {
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Dokal',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ILS',
      price: '0',
      description: 'Essai gratuit disponible (durée variable selon l’offre).',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Israel',
    },
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: getSiteUrl(),
    logo: absoluteUrl('/branding/fulllogo.png'),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: company.email,
        telephone: company.phoneE164,
        areaServed: 'IL',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.address,
      addressCountry: 'IL',
    },
  };

  return (
    <>
      <JsonLd data={orgJsonLd} />
      <JsonLd data={appJsonLd} />
      <WelcomePageClient />
    </>
  );
}
