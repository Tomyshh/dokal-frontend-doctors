import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { company } from '@/config/company';
import { buildAlternatesForPath, buildDefaultMetadata, normalizeLocale } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = normalizeLocale(params.locale);
  const t = await getTranslations({ locale, namespace: 'contact' });

  const title = t('title');
  const description = t('intro');

  return {
    ...buildDefaultMetadata(locale),
    title,
    description,
    alternates: buildAlternatesForPath('/contact'),
    openGraph: {
      ...buildDefaultMetadata(locale).openGraph,
      title,
      description,
      url: `/${locale}/contact`,
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations('contact');
  const tl = await getTranslations('landing');
  const ta = await getTranslations('auth');

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
        <p className="mt-6 text-base text-gray-700 leading-relaxed">{t('intro')}</p>

        <div className="mt-10 grid gap-6">
          <div className="rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">{t('emailLabel')}</div>
                <a
                  href={`mailto:${company.email}`}
                  className="text-sm text-primary hover:underline"
                  dir="ltr"
                >
                  {company.email}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">{t('phoneLabel')}</div>
                <a
                  href={`tel:${company.phoneE164}`}
                  className="text-sm text-primary hover:underline"
                  dir="ltr"
                >
                  {company.phoneE164}
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900">{t('addressLabel')}</div>
                <div className="text-sm text-gray-700" dir="ltr">
                  {company.address}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{tl('footer')}</p>
          <div className="flex items-center gap-6">
            <Link
              href="/contact"
              className="text-xs font-medium text-primary"
            >
              {tl('contactPage')}
            </Link>
            <Link
              href="/legal"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
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

