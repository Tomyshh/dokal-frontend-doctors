'use client';

import { useEffect, useState, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { getSubscriptionStatus } from '@/lib/subscription';
import { CheckCircle2, Lock, AlertTriangle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PaymentReturnPage() {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { refreshSubscription } = useAuth();

  const isTokenize = searchParams.get('type') === 'tokenize';
  const [status, setStatus] = useState<'loading' | 'success' | 'pending'>('loading');
  const polled = useRef(false);

  useEffect(() => {
    if (polled.current) return;
    polled.current = true;

    if (isTokenize) {
      setStatus('success');
      setTimeout(() => {
        window.location.assign(`/${locale}/billing`);
      }, 2000);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      attempts++;
      try {
        const result = await getSubscriptionStatus();
        if (result.hasSubscription) {
          await refreshSubscription();
          setStatus('success');
          setTimeout(() => {
            window.location.assign(`/${locale}`);
          }, 2500);
          return;
        }
      } catch {
        // ignore, retry
      }

      if (attempts >= maxAttempts) {
        setStatus('pending');
        return;
      }

      setTimeout(poll, 2000);
    };

    setTimeout(poll, 1500);
  }, [refreshSubscription, locale, isTokenize]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">{t('paymentProcessing')}</h2>
          <p className="text-sm text-gray-500">{t('paymentProcessingDesc')}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            {isTokenize ? <CreditCard className="h-10 w-10 text-green-500" /> : <CheckCircle2 className="h-10 w-10 text-green-500" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isTokenize ? t('cardAddedSuccess') : t('successTitle')}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {isTokenize ? t('cardAddedSuccessDesc') : t('successMessage')}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" />
            {t('redirecting')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t('paymentPendingTitle')}</h2>
          <p className="text-sm text-gray-500 mt-2">{t('paymentPendingDesc')}</p>
        </div>
        <Button onClick={() => window.location.assign(`/${locale}`)} className="rounded-full">
          {t('goToDashboard')}
        </Button>
      </div>
    </div>
  );
}
