'use client';

import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import GoogleCalendarSection from '@/components/settings/GoogleCalendarSection';

export default function GoogleCalendarPage() {
  const t = useTranslations('settings');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('googleCalendar')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('googleCalendarDescription')}</p>
        </div>
      </div>

      <GoogleCalendarSection />
    </div>
  );
}
