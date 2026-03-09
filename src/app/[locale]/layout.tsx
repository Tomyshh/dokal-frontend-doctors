import { getMessages } from 'next-intl/server';
import { isRtl } from '@/i18n/config';
import AuthProvider from '@/providers/AuthProvider';
import OneSignalProvider from '@/providers/OneSignalProvider';
import QueryProvider from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import IntlProvider from '@/providers/IntlProvider';
import RtlSync from '@/components/RtlSync';
import ThemePaletteProvider from '@/providers/ThemePaletteProvider';
import type { Metadata } from 'next';
import { buildDefaultMetadata, normalizeLocale } from '@/lib/seo';
import Script from 'next/script';
import '../globals.css';

const ONESIGNAL_APP_ID =
  process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? 'c109050b-74e4-44e6-baa8-ebafa66216ba';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  return buildDefaultMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const rtl = isRtl(locale);

  return (
    <html lang={locale} dir={rtl ? 'rtl' : 'ltr'}>
      <body>
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="beforeInteractive"
        />
        <Script id="onesignal-init" strategy="beforeInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({ appId: "${ONESIGNAL_APP_ID}" });
            });
          `}
        </Script>
        <Script id="theme-palette-init" strategy="beforeInteractive">
          {`
            (function() {
              try {
                var palette = window.localStorage.getItem('dokal-theme-palette');
                if (palette) {
                  document.documentElement.setAttribute('data-theme-palette', palette);
                }
                var mode = window.localStorage.getItem('dokal-theme-mode');
                if (mode === 'dark' || mode === 'light') {
                  document.documentElement.setAttribute('data-theme-mode', mode);
                  if (mode === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch (e) {}
            })();
          `}
        </Script>
        <Script id="rtl-sync-init" strategy="beforeInteractive">
          {`
            (function() {
              var segs = (typeof window !== 'undefined' && window.location.pathname) ? window.location.pathname.split('/').filter(Boolean) : [];
              var locale = segs[0] || 'he';
              var rtlLocales = ['he'];
              document.documentElement.setAttribute('dir', rtlLocales.includes(locale) ? 'rtl' : 'ltr');
            })();
          `}
        </Script>
        <IntlProvider locale={locale} messages={messages}>
          <RtlSync />
          <QueryProvider>
            <AuthProvider>
              <OneSignalProvider>
                <ThemePaletteProvider>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </ThemePaletteProvider>
              </OneSignalProvider>
            </AuthProvider>
          </QueryProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
