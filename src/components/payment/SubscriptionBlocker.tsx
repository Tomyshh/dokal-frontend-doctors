'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import {
  createPaymentSession,
  subscribe,
  listCards,
  getPlanBasePriceILS,
  type PlanType,
  type SubscriptionCard,
} from '@/lib/subscription';
import { Button } from '@/components/ui/Button';
import { Lock, AlertTriangle, CreditCard, CheckCircle2, Crown, Users, Building2, Globe, Clock, LogOut, EyeOff, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionStatus } from '@/lib/subscription';
import { usePlanPricing } from '@/hooks/usePlanPricing';

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
  pricingMap,
  selected,
  onSelect,
  t,
}: {
  plan: PlanType;
  pricingMap?: import('@/lib/subscription').PlanPricingMap;
  selected: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useTranslations<'subscription'>>;
}) {
  const price = getPlanBasePriceILS(plan, pricingMap);
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

function maskCard(card: SubscriptionCard) {
  const brand = card.brand ? card.brand.toUpperCase() : 'CARD';
  const last4 = card.last4 ? `•••• ${card.last4}` : card.buyer_card_mask || '';
  return `${brand} ${last4}`.trim();
}

export default function SubscriptionBlocker({ subscriptionStatus }: SubscriptionBlockerProps) {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const { profile, refreshSubscription, signOut } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cards, setCards] = useState<SubscriptionCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const { pricingMap } = usePlanPricing();

  useEffect(() => {
    listCards()
      .then((result) => {
        setCards(result);
        if (result.length > 0) setSelectedCardId(result[0].id);
      })
      .catch(() => {})
      .finally(() => setCardsLoaded(true));
  }, []);

  const reason = getBlockReason(subscriptionStatus);
  const selectedPrice = getPlanBasePriceILS(selectedPlan, pricingMap);

  const handlePayNow = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      if (selectedCardId && cards.some((c) => c.id === selectedCardId)) {
        await subscribe({ cardId: selectedCardId, plan: selectedPlan });
        await refreshSubscription();
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const session = await createPaymentSession({ plan: selectedPlan });
        window.location.href = session.sale_url;
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosError?.response?.data?.error?.message || t('genericError'));
      setLoading(false);
    }
  }, [selectedPlan, selectedCardId, cards, t, refreshSubscription]);

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
            <PlanOption plan="individual" pricingMap={pricingMap} selected={selectedPlan === 'individual'} onSelect={() => setSelectedPlan('individual')} t={t} />
            <PlanOption plan="clinic" pricingMap={pricingMap} selected={selectedPlan === 'clinic'} onSelect={() => setSelectedPlan('clinic')} t={t} />
          </div>

          {/* Saved cards */}
          {cardsLoaded && cards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('chooseCard')}</p>
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCardId(card.id)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all w-full',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
                    selectedCardId === card.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm font-semibold text-gray-900">{maskCard(card)}</span>
                  <div className={cn('ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0', selectedCardId === card.id ? 'border-primary' : 'border-gray-300')}>
                    {selectedCardId === card.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Pay now button */}
          <div className="pt-2">
            <Button
              type="button"
              className="w-full rounded-full h-12 text-base"
              onClick={handlePayNow}
              loading={loading}
            >
              {cards.length > 0 && selectedCardId ? (
                <>
                  <CreditCard className="h-4 w-4" />
                  {t('subscribeWithCard')} — {selectedPrice} ₪/{t('perMonth')}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {t('payNow')} — {selectedPrice} ₪/{t('perMonth')}
                  <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-60" />
                </>
              )}
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
