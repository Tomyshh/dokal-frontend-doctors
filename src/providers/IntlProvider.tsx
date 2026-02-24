'use client';

import type { ReactNode } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';

type Props = {
  locale: string;
  messages: AbstractIntlMessages;
  children: ReactNode;
};

export default function IntlProvider({ locale, messages, children }: Props) {
  return (
    <NextIntlClientProvider
      locale={locale}
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
        // In production, never leak raw i18n keys in the UI.
        // In dev, keep a stable placeholder for fast debugging.
        if (process.env.NODE_ENV === 'production') return '';
        return namespace ? `${namespace}.${key}` : key;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}

