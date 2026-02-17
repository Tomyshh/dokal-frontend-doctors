import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { isRtl } from '@/i18n/config';
import AuthProvider from '@/providers/AuthProvider';
import QueryProvider from '@/providers/QueryProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Dokal CRM - Espace Praticien',
  description: 'CRM medical pour praticiens - Gerez vos rendez-vous, patients et planning',
  icons: {
    icon: '/favicon.ico',
  },
};

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
        <NextIntlClientProvider
          messages={messages}
          onError={(error) => {
            // Prevent missing messages from crashing the app.
            // Keep logs in dev for visibility.
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.warn(error);
            }
          }}
          getMessageFallback={({ namespace, key }) => {
            // Show a stable placeholder instead of throwing on missing translations.
            // Example: calendar.googleEvent
            return namespace ? `${namespace}.${key}` : key;
          }}
        >
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
