import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { company } from '@/config/company';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildAlternatesForPath, buildDefaultMetadata, normalizeLocale } from '@/lib/seo';
import WelcomePageClient from './WelcomePageClient';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const t = await getTranslations({ locale, namespace: 'landing' });

  const title = t('headline');
  const description = t('subtitle');

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
    url: 'https://dokal.co.il',
    logo: 'https://dokal.co.il/branding/fulllogo.png',
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
