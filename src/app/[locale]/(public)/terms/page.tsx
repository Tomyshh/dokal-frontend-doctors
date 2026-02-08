import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default async function TermsPage() {
  const t = await getTranslations('terms');
  const tl = await getTranslations('landing');
  const ta = await getTranslations('auth');

  const sections = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2">
            <Image
              src="/branding/fulllogo.png"
              alt="Dokal"
              width={100}
              height={33}
            />
          </Link>
          <Link
            href="/welcome"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
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
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {tl('privacyPolicy')}
            </Link>
            <Link
              href="/terms"
              className="text-xs font-medium text-primary"
            >
              {tl('termsOfService')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
