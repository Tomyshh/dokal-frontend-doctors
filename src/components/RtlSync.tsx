'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { isRtl } from '@/i18n/config';

/**
 * Synchronise l'attribut dir du document avec la locale courante.
 * Corrige les cas où le RTL ne s'applique pas après navigation client-side
 * (ex: après inscription, redirection OAuth, etc.).
 */
export default function RtlSync() {
  const locale = useLocale();

  useEffect(() => {
    const dir = isRtl(locale) ? 'rtl' : 'ltr';
    if (document.documentElement.getAttribute('dir') !== dir) {
      document.documentElement.setAttribute('dir', dir);
    }
  }, [locale]);

  return null;
}
