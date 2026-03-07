'use client';

import { useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { createPaymentSession, BASE_PRICES_ILS, type PlanType } from '@/lib/subscription';
import { Button } from '@/components/ui/Button';
import { Lock, AlertTriangle, CreditCard, CheckCircle2, Crown, Users, Building2, Globe, Clock, LogOut, EyeOff, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionStatus } from '@/lib/subscription';

interface SubscriptionBlockerProps {
  subscriptionStatus: SubscriptionStatus | null;
}

type BlockReason = 'trial_expired' | 'expired' | 'past_due' | 'no_subscription';

function getBlockReason(status: SubscriptionStatus | null): BlockReason {
  if (!status) return 'no_subscription';

  const sub = status.subscription;

  if (sub?.status === 'past_due') return 'past_due';
  if (sub?.status === 'expired') return 'expired';

  // Trial expired
  if (status.trial && !status.trial.isActive && sub?.status !== 'active') {
    return 'trial_expired';
  }

  if (!status.hasSubscription && (!status.trial || !status.trial.isActive)) {
    return 'trial_expired';
  }

  return 'no_subscription';
}

function PlanOption({
  plan,
  selected,
  onSelect,
  t,
}: {
  plan: PlanType;
  selected: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useTranslations<'subscription'>>;
}) {
  const price = BASE_PRICES_ILS[plan];
  const isClinic = plan === 'clinic';
  const isEnterprise = plan === 'enterprise';

  const getIcon = () => {
    if (isEnterprise) return <Globe className="h-5 w-5 text-primary" />;
    if (isClinic) return <Building2 className="h-5 w-5 text-primary" />;
    return <Users className="h-5 w-5 text-gray-500" />;
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-gray-200 hover:border-gray-300',
      )}
    >
      {isClinic && (
        <div className="absolute -top-2 right-3">
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-primary rounded-full px-2 py-0.5">
            <Crown className="h-2.5 w-2.5" />
            {t('popular')}
          </span>
        </div>
      )}
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', isClinic || isEnterprise ? 'bg-primary/10' : 'bg-gray-100')}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {plan === 'individual' ? t('planIndividual') : plan === 'clinic' ? t('planClinic') : t('planEnterprise')}
          </span>
          <span className="text-xs text-gray-500">
            {isEnterprise ? t('fromPrice', { price }) : `${price} ₪/${t('perMonth')}`}
          </span>
        </div>
      </div>
      <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0', selected ? 'border-primary' : 'border-gray-300')}>
        {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
      </div>
    </button>
  );
}

export default function SubscriptionBlocker({ subscriptionStatus }: SubscriptionBlockerProps) {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const { profile, refreshSubscription, signOut } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reason = getBlockReason(subscriptionStatus);
  const selectedPrice = BASE_PRICES_ILS[selectedPlan];

  const handlePayNow = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const session = await createPaymentSession({ plan: selectedPlan });
      window.location.href = session.sale_url;
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosError?.response?.data?.error?.message || t('genericError'));
      setLoading(false);
    }
  }, [selectedPlan, t]);

  const getTitle = () => {
    switch (reason) {
      case 'trial_expired': return t('trialExpiredTitle');
      case 'expired': return t('expiredTitle');
      case 'past_due': return t('pastDueTitle');
      default: return t('noSubscriptionTitle');
    }
  };

  const getSubtitle = () => {
    switch (reason) {
      case 'trial_expired': return t('trialExpiredSubtitle');
      case 'expired': return t('expiredSubtitle');
      case 'past_due': return t('pastDueSubtitle');
      default: return t('noSubscriptionSubtitle');
    }
  };

  const getIcon = () => {
    switch (reason) {
      case 'past_due': return <AlertTriangle className="h-8 w-8 text-red-500" />;
      case 'trial_expired': return <Clock className="h-8 w-8 text-amber-500" />;
      default: return <Lock className="h-8 w-8 text-primary" />;
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('successTitle')}</h2>
            <p className="text-sm text-gray-500 mt-2">{t('successMessage')}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
            {getIcon()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-sm text-muted-foreground mt-2">{getSubtitle()}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Visibility warning */}
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
            <EyeOff className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">{t('notVisibleTitle')}</p>
              <p className="text-xs text-red-600 mt-0.5">{t('notVisibleDescription')}</p>
            </div>
          </div>

          {/* Plan selector */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('planPickerChoose')}</p>
            <PlanOption plan="individual" selected={selectedPlan === 'individual'} onSelect={() => setSelectedPlan('individual')} t={t} />
            <PlanOption plan="clinic" selected={selectedPlan === 'clinic'} onSelect={() => setSelectedPlan('clinic')} t={t} />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Pay now button — redirects to PayMe hosted page */}
          <div className="pt-2">
            <Button
              type="button"
              className="w-full rounded-full h-12 text-base"
              onClick={handlePayNow}
              loading={loading}
            >
              <Lock className="h-4 w-4" />
              {t('payNow')} — {selectedPrice} ₪/{t('perMonth')}
              <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-60" />
            </Button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              {t('securityNotice')}
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {['feature1', 'feature2', 'feature3', 'feature4'].map((key) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 text-primary/60 shrink-0" />
                {t(key)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          <div className="text-center">
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
