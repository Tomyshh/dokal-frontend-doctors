import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { company } from '@/config/company';

const LEGAL_SECTIONS_COUNT = 6;

export default async function LegalPage() {
  const t = await getTranslations('legal');
  const tl = await getTranslations('landing');
  const ta = await getTranslations('auth');

  const rows: Array<{ label: string; value: string; ltr?: boolean }> = [
    { label: t('companyName'), value: company.legalName },
    { label: t('registrationNumber'), value: company.registrationNumber, ltr: true },
    { label: t('director'), value: company.director },
    { label: t('host'), value: company.host },
    { label: t('address'), value: company.address, ltr: true },
    { label: t('email'), value: company.email, ltr: true },
    { label: t('phone'), value: company.phoneE164, ltr: true },
  ];

  const sections = Array.from({ length: LEGAL_SECTIONS_COUNT }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2">
            <Image src="/branding/fulllogo.png" alt="Dokal" width={100} height={33} />
          </Link>
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl-flip-arrow" />
            {ta('backToLanding')}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          {t('title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('lastUpdated')}</p>

        <p className="mt-8 text-base text-gray-700 leading-relaxed">{t('intro')}</p>

        <div className="mt-12 space-y-10">
          {sections.map((n) => (
            <section key={n}>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {t(`section${n}Title`)}
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {t(`section${n}Content`)}
              </p>
              {n === 1 && (
                <div className="mt-6 rounded-2xl border border-gray-100 overflow-hidden">
                  <dl className="divide-y divide-gray-100">
                    {rows.map((row) => (
                      <div
                        key={row.label}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <dt className="text-sm font-medium text-gray-900">{row.label}</dt>
                        <dd
                          className="text-sm text-gray-700 sm:text-right"
                          dir={row.ltr ? 'ltr' : undefined}
                        >
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </section>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{tl('footer')}</p>
          <div className="flex items-center gap-6">
            <Link
              href="/contact"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {tl('contactPage')}
            </Link>
            <Link href="/legal" className="text-xs font-medium text-primary">
              {tl('legalNotice')}
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {tl('privacyPolicy')}
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {tl('termsOfService')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

