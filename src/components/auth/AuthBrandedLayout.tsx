'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { company } from '@/config/company';

export function AuthBrandedLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('authLayout');

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 lg:py-16 min-h-screen flex items-center">
      <div className="grid lg:grid-cols-2 gap-10 items-stretch w-full">
        {/* Brand / Visual (hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-sm overflow-hidden relative">
          <div>
            <Image
              src="/branding/fulllogo_transparent_nobuffer.png"
              alt="Dokal"
              width={160}
              height={52}
              priority
              className="brightness-0 invert"
            />
            <p className="mt-6 text-primary-100/90 text-lg leading-relaxed">
              {t('subtitle')}
            </p>

            <ul className="mt-8 space-y-3 text-sm text-primary-100/90">
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                {t('bullet1')}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                {t('bullet2')}
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/60" />
                {t('bullet3')}
              </li>
            </ul>
          </div>

          <div className="mt-10 relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/25">
            <Image
              src="/images/presentation-crm.png"
              alt={t('dashboardAlt')}
              width={1200}
              height={800}
              className="w-full h-auto"
              priority
            />
          </div>

          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-primary-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary-300/10 blur-3xl" />
        </div>

        {/* Auth panel */}
        <div className="flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            <div className="flex justify-center mb-8 lg:hidden">
              <Image
                src="/branding/fulllogo_transparent_nobuffer.png"
                alt="Dokal"
                width={160}
                height={52}
                priority
                className="brightness-0 invert"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 border border-white/20 p-8 sm:p-10">
              {children}

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-900">{t('helpTitle')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('helpSubtitle')}</p>

                <div className="mt-3 flex flex-col gap-1 text-sm">
                  <a
                    href={`mailto:${company.email}`}
                    className="text-primary hover:underline w-fit"
                    dir="ltr"
                  >
                    {company.email}
                  </a>
                  <a
                    href={`tel:${company.phoneE164}`}
                    className="text-primary hover:underline w-fit"
                    dir="ltr"
                  >
                    {company.phoneE164}
                  </a>
                </div>

                <div className="mt-3">
                  <Link href="/contact" className="text-sm text-primary hover:underline">
                    {t('helpContactPage')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
