'use client';

import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { getMyPractitionerOrNull } from '@/lib/practitioner';
import SocialLinksSection from '@/components/settings/SocialLinksSection';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BusinessCardPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { profile } = useAuth();

  const { data: practitioner, isLoading } = useQuery({
    queryKey: ['practitioner-profile'],
    queryFn: async () => await getMyPractitionerOrNull(),
    enabled: !!profile?.id,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('businessCardTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('businessCardSubtitle')}</p>
        </div>
      </div>

      {practitioner && (
        <SocialLinksSection practitioner={practitioner} t={t} tc={tc} />
      )}
    </div>
  );
}
