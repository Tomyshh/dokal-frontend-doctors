'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  CalendarCheck,
  Clock,
  MessageSquare,
  Users,
  ArrowRight,
  Shield,
  ChevronDown,
} from 'lucide-react';

export default function WelcomePage() {
  const t = useTranslations('landing');

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Image
              src="/branding/fulllogo_transparent_nobuffer.png"
              alt="Dokal"
              width={140}
              height={46}
              priority
              className="brightness-0 invert"
            />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/30 text-sm font-medium text-white hover:bg-white hover:text-primary transition-all duration-300"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary to-primary-700 pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-300/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
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
                  href="/login"
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
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10">
                <Image
                  src="/images/presentation-crm.png"
                  alt="Dokal CRM Dashboard"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Glow effect behind image */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-white/5 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 lg:py-32 bg-gray-50/50">
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

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-primary-900 via-primary to-primary-700 px-8 py-16 sm:px-16 sm:py-20 overflow-hidden">
            {/* Background decoration */}
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
                  href="/login"
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Image
              src="/branding/fulllogo_transparent_nobuffer.png"
              alt="Dokal"
              width={100}
              height={33}
              className="opacity-60"
            />
            <p className="text-sm text-muted-foreground">
              {t('footer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
