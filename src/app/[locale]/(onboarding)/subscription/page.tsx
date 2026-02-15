'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import {
  addCard,
  subscribe,
  startTrial,
  BASE_PRICES_ILS,
  SEAT_PRICES_ILS,
  TRIAL_DURATION_DAYS,
  type PlanType,
} from '@/lib/subscription';
import {
  CreditCard,
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
  Clock,
  Users,
  Crown,
  Building2,
  Globe,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Practitioner } from '@/types';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { ApiErrorCallout } from '@/components/ui/ApiErrorCallout';
import { getMyPractitionerOrNull, isPractitionerProfileComplete } from '@/lib/practitioner';

type CardForm = {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  cardHolder: string;
  buyerZipCode: string;
};

type View = 'plan-picker' | 'card-form';

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function getCardBrand(number: string): string | null {
  const digits = number.replace(/\D/g, '');
  if (digits.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  if (digits.startsWith('37') || digits.startsWith('34')) return 'amex';
  if (digits.startsWith('6')) return 'discover';
  return null;
}

function CardBrandIcon({ brand }: { brand: string | null }) {
  if (brand === 'visa') {
    return (
      <span className="text-xs font-bold text-blue-600 tracking-wide">VISA</span>
    );
  }
  if (brand === 'mastercard') {
    return (
      <div className="flex -space-x-1.5">
        <div className="w-4 h-4 rounded-full bg-red-500 opacity-80" />
        <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
      </div>
    );
  }
  if (brand === 'amex') {
    return (
      <span className="text-xs font-bold text-blue-800 tracking-wide">AMEX</span>
    );
  }
  return <CreditCard className="h-4 w-4 text-gray-400" />;
}

// ─── Plan Card ────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  onSelect,
  t,
  highlighted,
}: {
  plan: PlanType;
  selected: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useTranslations<'subscription'>>;
  highlighted?: boolean;
}) {
  const isClinic = plan === 'clinic';
  const isEnterprise = plan === 'enterprise';
  const isIndividual = plan === 'individual';

  const price = BASE_PRICES_ILS[plan];

  const getFeatures = () => {
    if (isIndividual) {
      return ['feature1', 'feature2', 'feature3', 'feature4'] as const;
    }
    if (isClinic) {
      return ['feature1', 'feature2', 'feature3', 'feature4', 'planFeatureTeam', 'planFeatureMultiPractitioner', 'planFeatureOrgStats'] as const;
    }
    // Enterprise
    return ['feature1', 'feature2', 'feature3', 'feature4', 'planFeatureTeam', 'planFeatureMultiPractitioner', 'planFeatureOrgStats', 'planFeatureMultiSite'] as const;
  };

  const features = getFeatures();

  const getIcon = () => {
    if (isEnterprise) return <Globe className="h-6 w-6 text-primary" />;
    if (isClinic) return <Building2 className="h-6 w-6 text-primary" />;
    return <Users className="h-6 w-6 text-gray-500" />;
  };

  const getPlanName = () => {
    if (isEnterprise) return t('planEnterprise');
    if (isClinic) return t('planClinic');
    return t('planIndividual');
  };

  const getPlanDesc = () => {
    if (isEnterprise) return t('planEnterpriseDesc');
    if (isClinic) return t('planClinicDesc');
    return t('planIndividualDesc');
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
        selected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
        highlighted && !selected && 'border-primary/40',
      )}
    >
      {/* Popular badge for clinic */}
      {isClinic && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-primary rounded-full px-3 py-1">
            <Crown className="h-3 w-3" />
            {t('popular')}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            isClinic || isEnterprise ? 'bg-primary/10' : 'bg-gray-100',
          )}>
            {getIcon()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{getPlanName()}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{getPlanDesc()}</p>
          </div>
        </div>
        <div className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1',
          selected ? 'border-primary' : 'border-gray-300',
        )}>
          {selected && <div className="w-3 h-3 rounded-full bg-primary" />}
        </div>
      </div>

      {/* Badge */}
      <div className="mb-3">
        {isEnterprise ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
            <Globe className="h-3 w-3" />
            {t('multiSite')}
          </span>
        ) : isClinic ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
            <Users className="h-3 w-3" />
            {t('unlimitedTeam')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-100 rounded-full px-2.5 py-0.5">
            {t('onePractitioner')}
          </span>
        )}
      </div>

      <div className="space-y-2 flex-1">
        {features.map((key) => (
          <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
            <CheckCircle2 className={cn(
              'h-3.5 w-3.5 shrink-0',
              isClinic || isEnterprise ? 'text-primary' : 'text-gray-400',
            )} />
            {t(key)}
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        {isEnterprise ? (
          <div>
            <span className="text-lg font-bold text-gray-900">{t('fromPrice', { price })}</span>
            <span className="text-[11px] text-gray-400 ml-1">/{t('perMonth')}</span>
          </div>
        ) : isClinic ? (
          <div>
            <span className="text-lg font-bold text-gray-900">{price} ₪</span>
            <span className="text-[11px] text-gray-400 ml-1">/{t('perMonth')}</span>
            <div className="mt-1 space-y-0.5">
              <p className="text-[10px] text-gray-500">
                + {SEAT_PRICES_ILS.practitioner} ₪/{t('perPractitioner')}
              </p>
              <p className="text-[10px] text-gray-500">
                + {SEAT_PRICES_ILS.secretary} ₪/{t('perSecretary')}
              </p>
            </div>
            <p className="text-[10px] text-primary/70 mt-1">{t('basePriceIncludes')}</p>
          </div>
        ) : (
          <div>
            <span className="text-lg font-bold text-gray-900">{price} ₪</span>
            <span className="text-[11px] text-gray-400 ml-1">/{t('perMonth')}</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function OnboardingSubscriptionPage() {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const { profile, refreshSubscription } = useAuth();
  const router = useRouter();
  const actionInFlightRef = useRef(false);

  const [view, setView] = useState<View>('plan-picker');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('individual');
  const [form, setForm] = useState<CardForm>({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    cardHolder: '',
    buyerZipCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<'subscribed' | 'trial' | null>(null);

  const cardBrand = getCardBrand(form.cardNumber);
  const rawCardNumber = form.cardNumber.replace(/\s/g, '');
  const selectedPrice = BASE_PRICES_ILS[selectedPlan];

  const userName = profile
    ? `Dr ${profile.last_name || ''}`
    : '';

  // Enforce profile completion before plan selection
  const {
    data: practitioner,
    isLoading: loadingPractitioner,
    isError: practitionerError,
    error: practitionerErrorObj,
    refetch: refetchPractitioner,
  } = useQuery({
    queryKey: ['practitioner', 'me', profile?.id],
    queryFn: async () => {
      return await getMyPractitionerOrNull();
    },
    enabled: !!profile?.id,
    retry: 5,
    retryDelay: (attempt) => Math.min(750 * 2 ** attempt, 4000),
  });

  const needsProfileCompletion = (() => {
    if (!profile) return false;
    if (loadingPractitioner) return false;
    // If we can't load the practitioner yet (temporary backend error or eventual consistency),
    // do not bounce back to the form. We'll show an error state with retry instead.
    if (practitionerError) return false;
    if (!practitioner) return true;
    return !isPractitionerProfileComplete(practitioner);
  })();

  useEffect(() => {
    if (needsProfileCompletion) {
      router.replace(`/${locale}/complete-profile`);
    }
  }, [needsProfileCompletion, router, locale]);

  if (loadingPractitioner) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (practitionerError) {
    return (
      <div className="space-y-4">
        <ApiErrorCallout
          error={practitionerErrorObj}
          action={(
            <Button
              type="button"
              variant="outline"
              onClick={() => refetchPractitioner()}
            >
              {t('retry')}
            </Button>
          )}
        />
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.replace(`/${locale}/complete-profile`)}>
            {t('backToProfile')}
          </Button>
        </div>
      </div>
    );
  }

  if (needsProfileCompletion) {
    return null;
  }

  const handleChange = useCallback(
    <K extends keyof CardForm>(key: K, value: CardForm[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setError('');
    },
    []
  );

  const handleCardNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange('cardNumber', formatCardNumber(e.target.value));
    },
    [handleChange]
  );

  const handleExpiryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange('expirationDate', formatExpiry(e.target.value));
    },
    [handleChange]
  );

  const handleCvvChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
      handleChange('cvv', digits);
    },
    [handleChange]
  );

  const isFormValid =
    rawCardNumber.length >= 13 &&
    form.expirationDate.length === 5 &&
    form.cvv.length >= 3;

  const hardRedirectToDashboard = () => {
    window.location.assign(`/${locale}`);
  };

  // ─── Start free trial (individual & clinic only) ───────────────────
  const handleStartTrial = async () => {
    // Enterprise has no trial – guard against accidental calls
    if (selectedPlan === 'enterprise') return;
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setError('');
    setTrialLoading(true);
    try {
      await startTrial(selectedPlan);
      await refreshSubscription();
      setSuccess('trial');
      setTimeout(hardRedirectToDashboard, 2000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosError?.response?.data?.error?.message || t('genericError'));
      actionInFlightRef.current = false;
    } finally {
      setTrialLoading(false);
    }
  };

  // ─── Subscribe with card ───────────────────────────────────────────
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;

    setError('');
    setLoading(true);
    try {
      const cardResponse = await addCard({
        cardNumber: rawCardNumber,
        expirationDate: form.expirationDate,
        cvv: form.cvv,
        cardHolder: form.cardHolder || undefined,
        buyerZipCode: form.buyerZipCode || undefined,
      });

      await subscribe({ cardId: cardResponse.card.id, plan: selectedPlan });
      await refreshSubscription();
      setSuccess('subscribed');
      setTimeout(hardRedirectToDashboard, 2000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosError?.response?.data?.error?.message || t('genericError'));
      actionInFlightRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // ─── Success Screen ────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-8 space-y-6 max-w-md mx-auto">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {success === 'trial' ? t('trialSuccessTitle') : t('successTitle')}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {success === 'trial' ? t('trialSuccessMessage') : t('successMessage')}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="h-3 w-3" />
          {t('redirecting')}
        </div>
      </div>
    );
  }

  // ─── Plan Picker View ──────────────────────────────────────────────
  if (view === 'plan-picker') {
    return (
      <div>
        {/* Header — Trial-first messaging */}
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('planPickerTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t('planPickerSubtitle')}</p>
        </div>

        {/* App preview — value proposition */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 flex items-center gap-4">
          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-md">
            <Image
              src="/images/app-pres.png"
              alt="Dokal Patient App"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('appPreviewTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('appPreviewDesc')}</p>
          </div>
        </div>

        {/* Choose plan label */}
        <p className="text-sm font-medium text-gray-700 mb-3">{t('planPickerChoose')}</p>

        {/* Plan cards — 3 plans side by side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-stretch">
          <PlanCard
            plan="individual"
            selected={selectedPlan === 'individual'}
            onSelect={() => setSelectedPlan('individual')}
            t={t}
          />
          <PlanCard
            plan="clinic"
            selected={selectedPlan === 'clinic'}
            onSelect={() => setSelectedPlan('clinic')}
            t={t}
            highlighted
          />
          <PlanCard
            plan="enterprise"
            selected={selectedPlan === 'enterprise'}
            onSelect={() => setSelectedPlan('enterprise')}
            t={t}
          />
        </div>

        {/* CTA section — centered below the plan grid */}
        <div className="max-w-md mx-auto">
          {/* Error */}
          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* Enterprise — no trial, subscribe directly */}
          {selectedPlan === 'enterprise' ? (
            <div className="space-y-4">
              <Button
                className="w-full rounded-full h-12 text-base"
                onClick={() => setView('card-form')}
              >
                <CreditCard className="h-4 w-4" />
                {t('subscribeNowTitle')} — {BASE_PRICES_ILS.enterprise} ₪/{t('perMonth')}
              </Button>

              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
                <Building2 className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{t('contactSalesDesc')}</p>
                <a
                  href="mailto:contact@dokal.co.il"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mt-2"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {t('contactSales')}
                </a>
              </div>
              <p className="text-[10px] text-gray-400 text-center">{t('enterpriseNote')}</p>
            </div>
          ) : (
            <>
              {/* Start free trial CTA (individual & clinic only) */}
              <Button
                className="w-full rounded-full h-12 text-base"
                onClick={handleStartTrial}
                loading={trialLoading}
              >
                <Clock className="h-4 w-4" />
                {t('startFreeTrial')}
              </Button>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Shield className="h-3 w-3 text-primary/60" />
                  {t('trialNoCreditCard')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                  <CheckCircle2 className="h-3 w-3 text-primary/60" />
                  {t('trialNoCommitment')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
                  <Clock className="h-3 w-3 text-primary/60" />
                  {t('trialDays', { days: TRIAL_DURATION_DAYS })}
                </span>
              </div>

              {/* Price footnote */}
              <p className="text-[10px] text-gray-400 text-center mt-5 leading-relaxed">
                {t('priceFootnote', {
                  individualPrice: BASE_PRICES_ILS.individual,
                  clinicPrice: BASE_PRICES_ILS.clinic,
                })}
              </p>

              {/* Secondary: subscribe directly */}
              <div className="flex items-center gap-4 mt-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium">{t('or')}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                type="button"
                onClick={() => setView('card-form')}
                className="w-full mt-3 text-center text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
              >
                {t('orSubscribeDirectly')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── Card Form View ────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back to plan picker */}
      <button
        type="button"
        onClick={() => { setView('plan-picker'); setError(''); }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <CreditCard className="h-4 w-4" />
        {t('backToPlanPicker')}
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Card form */}
      <form onSubmit={handleSubscribe} className="space-y-5">
        {/* Visual card preview */}
        <div
          className={cn(
            'rounded-2xl p-5 h-44 flex flex-col justify-between transition-all duration-500',
            'bg-gradient-to-br shadow-lg',
            cardBrand === 'visa'
              ? 'from-blue-600 to-blue-800'
              : cardBrand === 'mastercard'
                ? 'from-gray-800 to-gray-950'
                : cardBrand === 'amex'
                  ? 'from-indigo-600 to-indigo-900'
                  : 'from-gray-700 to-gray-900'
          )}
        >
          <div className="flex items-center justify-between">
            <div className="bg-white/20 rounded-lg px-2 py-1">
              <CardBrandIcon brand={cardBrand} />
            </div>
            <Lock className="h-4 w-4 text-white/40" />
          </div>
          <div>
            <div className="text-white/90 font-mono text-lg tracking-[0.2em]">
              {rawCardNumber
                ? rawCardNumber.replace(/(.{4})/g, '$1  ').trim()
                : '••••  ••••  ••••  ••••'}
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                {t('cardHolderLabel')}
              </div>
              <div className="text-white/80 text-sm font-medium truncate max-w-[180px]">
                {form.cardHolder || userName || t('cardHolderPlaceholder')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                {t('expiryLabel')}
              </div>
              <div className="text-white/80 text-sm font-mono">
                {form.expirationDate || 'MM/YY'}
              </div>
            </div>
          </div>
        </div>

        {/* Card number */}
        <Input
          id="cardNumber"
          label={t('cardNumber')}
          placeholder="4580 0000 0000 1234"
          value={form.cardNumber}
          onChange={handleCardNumberChange}
          required
          autoComplete="cc-number"
          inputMode="numeric"
        />

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="expirationDate"
            label={t('expiry')}
            placeholder="MM/YY"
            value={form.expirationDate}
            onChange={handleExpiryChange}
            required
            autoComplete="cc-exp"
            inputMode="numeric"
            maxLength={5}
          />
          <Input
            id="cvv"
            type="password"
            label={t('cvv')}
            placeholder="•••"
            value={form.cvv}
            onChange={handleCvvChange}
            required
            autoComplete="cc-csc"
            inputMode="numeric"
            maxLength={4}
          />
        </div>

        {/* Card holder */}
        <Input
          id="cardHolder"
          label={t('cardHolder')}
          placeholder={t('cardHolderPlaceholder')}
          value={form.cardHolder}
          onChange={(e) => handleChange('cardHolder', e.target.value)}
          autoComplete="cc-name"
        />

        {/* Zip code (optional) */}
        <Input
          id="buyerZipCode"
          label={t('zipCode')}
          placeholder="6100000"
          value={form.buyerZipCode}
          onChange={(e) => handleChange('buyerZipCode', e.target.value)}
          autoComplete="postal-code"
          inputMode="numeric"
        />

        {/* Security notice */}
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
          <Shield className="h-4 w-4 shrink-0 text-gray-400" />
          <span>{t('securityNotice')}</span>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full rounded-full h-12 text-base"
          loading={loading}
          disabled={!isFormValid}
        >
          <Lock className="h-4 w-4" />
          {t('subscribe')} — {selectedPrice} ₪/{t('perMonth')}
        </Button>
      </form>
    </div>
  );
}
