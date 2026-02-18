import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { locales } from '@/i18n/config';
import { getSiteUrl } from '@/lib/seo';

const PUBLIC_PAGES: Array<{
  path: `/${string}`;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '/welcome', changeFrequency: 'weekly', priority: 1 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/legal', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
];

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getBaseUrlFromRequest();
  const lastModified = new Date();

  return locales.flatMap((locale) =>
    PUBLIC_PAGES.map((p) => ({
      url: `${base}/${locale}${p.path}`,
      lastModified,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    }))
  );
}

