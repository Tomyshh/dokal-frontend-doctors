import type { MetadataRoute } from 'next';
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

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
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

