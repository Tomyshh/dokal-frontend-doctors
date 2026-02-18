import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';
import { getSiteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  const authAndPrivate = [
    '/login',
    '/signup',
    '/forgot-password',
    '/verify-email',
    '/subscription',
    '/complete-profile',
    '/appointments',
    '/patients',
    '/messages',
    '/calendar',
    '/schedule',
    '/notifications',
    '/settings',
    '/team',
    '/billing',
    '/reviews',
  ] as const;

  const disallow = [
    '/api/',
    '/_next/',
    ...locales.flatMap((l) => authAndPrivate.map((p) => `/${l}${p}`)),
  ];

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

