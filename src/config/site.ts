export const site = {
  name: 'Dokal',
  /**
   * Base URL used for canonical URLs, OpenGraph absolute URLs, sitemap, etc.
   * Set `NEXT_PUBLIC_SITE_URL` (or `SITE_URL`) in your deployment environment.
   */
  url: (() => {
    const raw =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      // Fallback: keep deterministic URLs in non-configured envs (local/dev)
      'https://dokal.co.il';
    return raw.replace(/\/+$/, '');
  })(),
  ogImagePath: '/images/presentation-crm.png',
} as const;

