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
        // Show a stable placeholder instead of throwing on missing translations.
        // Example: calendar.googleEvent
        return namespace ? `${namespace}.${key}` : key;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}

