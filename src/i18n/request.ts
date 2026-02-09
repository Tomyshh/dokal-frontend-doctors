import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  // With Turbopack, `.arb` files are imported as raw strings (via raw-loader).
  // ARB is JSON, so we parse it to get the messages object expected by next-intl.
  const raw = (await import(`./messages/${locale}.arb`)).default as string;

  return {
    locale,
    messages: JSON.parse(raw) as Record<string, unknown>,
  };
});
