'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { localeNames, type Locale } from '@/i18n/config';
import {
  CalendarCheck,
  Clock,
  MessageSquare,
  Users,
  ArrowRight,
  Shield,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Globe,
  Lock,
  FileText,
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Building2,
  Crown,
  CheckCircle2,
} from 'lucide-react';
import { BASE_PRICES_ILS, SEAT_PRICES_ILS, TRIAL_DURATION_DAYS } from '@/lib/subscription';
import { company } from '@/config/company';
import axios from 'axios';

export default function WelcomePage() {
  const t = useTranslations('landing');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: CalendarCheck,
      title: t('features.appointments.title'),
      description: t('features.appointments.description'),
    },
    {
      icon: Clock,
      title: t('features.schedule.title'),
      description: t('features.schedule.description'),
    },
    {
      icon: MessageSquare,
      title: t('features.messaging.title'),
      description: t('features.messaging.description'),
    },
    {
      icon: Users,
      title: t('features.patients.title'),
      description: t('features.patients.description'),
    },
  ];

  const stats = [
    { value: t('stats.doctors.value'), label: t('stats.doctors.label') },
    { value: t('stats.appointments.value'), label: t('stats.appointments.label') },
    { value: t('stats.satisfaction.value'), label: t('stats.satisfaction.label') },
  ];

  const screenshots = [
    { src: '/images/presentation-crm-2.png', alt: t('screenshotAlt') },
    { src: '/images/presentation-crm-3.png', alt: t('screenshotAlt') },
    { src: '/images/presentation-crm-4.png', alt: t('screenshotAlt') },
  ];

  const galleryItems = useMemo(
    () => [{ src: '/images/presentation-crm.png', alt: t('screenshotAlt') }, ...screenshots],
    [screenshots, t]
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxOpen = lightboxIndex !== null;

  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + galleryItems.length) % galleryItems.length);
  };
  const next = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % galleryItems.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, lightboxIndex, galleryItems.length]);

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
    setShowLangMenu(false);
  };

  /* ── Lead contact form state ── */
  const [leadForm, setLeadForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitting(true);
    setLeadSuccess(false);
    setLeadError(false);

    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
      await axios.post(`${apiUrl}/api/v1/leads`, {
        full_name: leadForm.full_name.trim(),
        email: leadForm.email.trim(),
        phone: leadForm.phone.trim() || null,
        message: leadForm.message.trim() || null,
        source: 'welcome_page',
        locale,
      });
      setLeadSuccess(true);
      setLeadForm({ full_name: '', email: '', phone: '', message: '' });
    } catch {
      setLeadError(true);
    } finally {
      setLeadSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-900">
      {/* Header */}
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-primary-900/80 backdrop-blur-xl shadow-lg shadow-black/10'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Image
              src="/branding/icononly_transparent.png"
              alt="Dokal"
              width={120}
              height={120}
              priority
              className="shrink-0"
            />

            <span className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-widest text-white uppercase select-none">
              Dokal
            </span>
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-all duration-300"
                  aria-label={t('login')}
                >
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{localeNames[locale]}</span>
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-lg border border-border py-1 min-w-[160px] z-50">
                    {(Object.entries(localeNames) as [Locale, string][]).map(([loc, name]) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => switchLocale(loc)}
                        className={[
                          'w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors',
                          loc === locale ? 'text-primary font-medium bg-primary-50' : 'text-gray-700',
                        ].join(' ')}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 transition-all duration-300"
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-primary text-sm font-semibold hover:bg-primary-50 transition-all duration-300 shadow-sm"
              >
                {t('signup')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary to-primary-700 min-h-[100svh] flex items-stretch">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-300/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 w-full flex items-center pt-28 pb-20 lg:pt-32 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center w-full">
            {/* Text content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm text-primary-100 mb-8 backdrop-blur-sm">
                <Shield className="w-4 h-4" />
                {t('badge')}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                {t('headline')}
              </h1>

              <p className="mt-6 text-lg text-primary-100/90 leading-relaxed">
                {t('subtitle')}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-primary font-semibold text-sm hover:bg-primary-50 transition-all duration-300 shadow-lg shadow-black/10"
                >
                  {t('cta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() =>
                    document
                      .getElementById('features')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300"
                >
                  {t('learnMore')}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl sm:text-4xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-sm text-primary-200">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dashboard image */}
            <div className="relative lg:ml-8">
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10 hover:scale-[1.01] transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label={t('openImage')}
              >
                <Image
                  src="/images/presentation-crm.png"
                  alt={t('screenshotAlt')}
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </button>
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-white/5 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {t('featuresTitle')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('featuresSubtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Gallery */}
      <section className="relative overflow-hidden py-24 lg:py-32 bg-gradient-to-br from-primary-900 via-primary to-primary-700">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-300/10 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {t('screenshotsTitle')}
            </h2>
            <p className="mt-4 text-lg text-primary-100/90">
              {t('screenshotsSubtitle')}
            </p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-8">
            {screenshots.map((shot, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i + 1)}
                className="group rounded-2xl overflow-hidden border border-white/10 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                aria-label={t('openImage')}
              >
                <Image src={shot.src} alt={shot.alt} width={800} height={500} className="w-full h-auto" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {t('pricingTitle')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('pricingSubtitle')}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <Clock className="h-4 w-4" />
              {t('pricingTrialBadge', { days: TRIAL_DURATION_DAYS })}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Individual */}
            <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t('pricingIndividualTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('pricingIndividualDesc')}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{BASE_PRICES_ILS.individual}</span>
                <span className="text-lg text-gray-500 ml-1">₪/{t('pricingPerMonth')}</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {['pricingFeature1', 'pricingFeature2', 'pricingFeature3', 'pricingFeature4'].map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-gray-400 shrink-0" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-primary hover:text-primary transition-all duration-300"
              >
                {t('pricingStartTrial')}
              </Link>
            </div>

            {/* Clinic — highlighted */}
            <div className="relative rounded-2xl bg-white border-2 border-primary p-8 shadow-card-hover flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary rounded-full px-4 py-1.5">
                  <Crown className="h-3.5 w-3.5" />
                  {t('pricingPopular')}
                </span>
              </div>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t('pricingClinicTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('pricingClinicDesc')}</p>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">{BASE_PRICES_ILS.clinic}</span>
                <span className="text-lg text-gray-500 ml-1">₪/{t('pricingPerMonth')}</span>
              </div>
              <div className="mb-6 space-y-1">
                <p className="text-xs text-gray-500">+ {SEAT_PRICES_ILS.practitioner} ₪/{t('pricingPerPractitioner')}</p>
                <p className="text-xs text-gray-500">+ {SEAT_PRICES_ILS.secretary} ₪/{t('pricingPerSecretary')}</p>
                <p className="text-xs text-primary/70">{t('pricingClinicIncludes')}</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {['pricingFeature1', 'pricingFeature2', 'pricingFeature3', 'pricingFeature4', 'pricingFeatureTeam', 'pricingFeatureMultiPractitioner', 'pricingFeatureOrgStats'].map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all duration-300 shadow-sm"
              >
                {t('pricingStartTrial')}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl bg-white border border-gray-200 p-8 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t('pricingEnterpriseTitle')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('pricingEnterpriseDesc')}</p>
              </div>
              <div className="mb-6">
                <span className="text-lg font-semibold text-gray-700">{t('pricingFrom')}</span>
                <span className="text-4xl font-bold text-gray-900 ml-1">{BASE_PRICES_ILS.enterprise}</span>
                <span className="text-lg text-gray-500 ml-1">₪/{t('pricingPerMonth')}</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {['pricingFeature1', 'pricingFeature2', 'pricingFeature3', 'pricingFeature4', 'pricingFeatureTeam', 'pricingFeatureMultiPractitioner', 'pricingFeatureOrgStats', 'pricingFeatureMultiSite'].map((key) => (
                  <li key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {t(key)}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:contact@dokal.co.il"
                className="block w-full text-center px-6 py-3 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-all duration-300"
              >
                {t('pricingContactSales')}
              </a>
            </div>
          </div>

          {/* App preview */}
          <div className="mt-16 max-w-3xl mx-auto text-center">
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/images/app-pres.png"
                  alt="Dokal Patient App"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-lg font-semibold text-gray-900">{t('pricingAppTitle')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('pricingAppDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary-900 via-primary to-primary-700 px-8 py-16 sm:px-16 sm:py-20 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-primary-400/10 blur-3xl" />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {t('ctaTitle')}
              </h2>
              <p className="mt-4 text-lg text-primary-100/90">
                {t('ctaSubtitle')}
              </p>
              <div className="mt-10">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-primary font-semibold hover:bg-primary-50 transition-all duration-300 shadow-lg shadow-black/10"
                >
                  {t('ctaButton')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Contact Form */}
      <section id="contact-form" className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {t('contactFormTitle')}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {t('contactFormSubtitle')}
              </p>
            </div>

            {leadSuccess ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <p className="text-lg font-medium text-gray-900">
                  {t('contactFormSuccess')}
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <Input
                    id="lead-name"
                    label={t('contactFormName')}
                    value={leadForm.full_name}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder={t('contactFormNamePlaceholder')}
                    required
                  />
                  <Input
                    id="lead-email"
                    type="email"
                    label={t('contactFormEmail')}
                    value={leadForm.email}
                    onChange={(e) =>
                      setLeadForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder={t('contactFormEmailPlaceholder')}
                    required
                  />
                </div>

                <Input
                  id="lead-phone"
                  type="tel"
                  label={t('contactFormPhone')}
                  value={leadForm.phone}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder={t('contactFormPhonePlaceholder')}
                />

                <Textarea
                  id="lead-message"
                  label={t('contactFormMessage')}
                  value={leadForm.message}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder={t('contactFormMessagePlaceholder')}
                  rows={4}
                />

                {leadError && (
                  <div className="text-center p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
                    {t('contactFormError')}
                  </div>
                )}

                <div className="text-center pt-2">
                  <Button type="submit" size="lg" loading={leadSubmitting}>
                    {t('contactFormSubmit')}
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <Image
                src="/branding/fulllogo.png"
                alt="Dokal"
                width={120}
                height={40}
              />
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                {t('footerDescription')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                {t('footerProduct')}
              </h4>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() =>
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {t('featuresTitle')}
                  </button>
                </li>
                <li>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('login')}
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('signup')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                {t('footerLegal')}
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/legal" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('legalNotice')}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('privacyPolicy')}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('termsOfService')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                {t('footerContact')}
              </h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${company.email}`} className="hover:text-primary transition-colors" dir="ltr">
                    {company.email}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${company.phoneE164}`} className="hover:text-primary transition-colors" dir="ltr">
                    {company.phoneE164}
                  </a>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span dir="ltr">{company.address}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  {t('secureData')}
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {t('gdprCompliant')}
                </li>
                <li>
                  <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('contactPage')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t('footer')}
            </p>
            <div className="flex items-center gap-6">
              <Link href="/contact" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {t('contactPage')}
              </Link>
              <Link href="/legal" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {t('legalNotice')}
              </Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {t('privacyPolicy')}
              </Link>
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                {t('termsOfService')}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox */} 
      <Dialog
        open={lightboxOpen}
        onClose={closeLightbox}
        className="max-w-6xl bg-black text-white overflow-hidden"
      >
        {lightboxIndex !== null ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/80">
                {lightboxIndex + 1} / {galleryItems.length}
              </div>
              <button
                type="button"
                onClick={closeLightbox}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl hover:bg-white/10 transition-colors"
                aria-label={tc('close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative h-[70vh] w-full rounded-xl overflow-hidden bg-black">
              <Image
                src={galleryItems[lightboxIndex].src}
                alt={galleryItems[lightboxIndex].alt}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                className="object-contain"
                priority
              />

              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
                aria-label={tc('previous')}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors"
                aria-label={tc('next')}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
