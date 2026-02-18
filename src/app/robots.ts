import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { locales } from '@/i18n/config';
import { getSiteUrl } from '@/lib/seo';

async function getBaseUrlFromRequest(): Promise<string> {
  try {
    const h = await headers();
    const protoRaw = h.get('x-forwarded-proto') ?? 'https';
    const hostRaw = h.get('x-forwarded-host') ?? h.get('host');
    const proto = protoRaw.split(',')[0]?.trim() || 'https';
    const host = hostRaw?.split(',')[0]?.trim();
    if (host) return `${proto}://${host}`.replace(/\/+$/, '');
  } catch {
    // noop
  }

  return getSiteUrl();
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getBaseUrlFromRequest();

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

