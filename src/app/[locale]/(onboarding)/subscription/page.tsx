'use client';

import { useState, useCallback, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { addCard, subscribe, startTrial } from '@/lib/subscription';
import {
  CreditCard,
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
  Clock,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CardForm = {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  cardHolder: string;
  buyerZipCode: string;
};

type View = 'choice' | 'card-form';

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

export default function OnboardingSubscriptionPage() {
  const t = useTranslations('subscription');
  const locale = useLocale();
  const { profile, refreshSubscription } = useAuth();
  const actionInFlightRef = useRef(false);

  const [view, setView] = useState<View>('choice');
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

  const userName = profile
    ? `Dr ${profile.last_name || ''}`
    : '';

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
    // Hard redirect so that AuthProvider re-fetches everything fresh
    window.location.assign(`/${locale}`);
  };

  // ─── Start free trial ──────────────────────────────────────────────
  const handleStartTrial = async () => {
    if (actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setError('');
    setTrialLoading(true);
    try {
      await startTrial();
      // Refresh subscription status in the auth context so dashboard won't bounce back
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

      await subscribe({ cardId: cardResponse.card.id });
      // Refresh subscription status in the auth context so dashboard won't bounce back
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
      <div className="text-center py-8 space-y-6">
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

  // ─── Choice View: Trial or Subscribe ───────────────────────────────
  if (view === 'choice') {
    return (
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('onboardingTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t('onboardingSubtitle')}</p>
        </div>

        {/* Plan card */}
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-2">
                <Shield className="h-3 w-3" />
                {t('planBadge')}
              </span>
              <h3 className="text-lg font-bold text-gray-900">{t('planName')}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{t('planDescription')}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-gray-900">
                290 <span className="text-lg font-medium text-gray-500">₪</span>
              </div>
              <span className="text-xs text-gray-400">/ {t('perMonth')}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(['feature1', 'feature2', 'feature3', 'feature4'] as const).map((key) => (
              <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                {t(key)}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
            {error}
          </div>
        )}

        {/* Two options */}
        <div className="space-y-4">
          {/* Option 1: Free trial */}
          <button
            type="button"
            onClick={handleStartTrial}
            disabled={trialLoading}
            className={cn(
              'w-full rounded-2xl border-2 p-5 text-left transition-all',
              'border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">{t('trialTitle')}</h3>
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    {t('trialBadge')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{t('trialDescription')}</p>
                <ul className="mt-3 space-y-1.5">
                  {(['trialBenefit1', 'trialBenefit2', 'trialBenefit3'] as const).map((key) => (
                    <li key={key} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {trialLoading && (
              <div className="mt-3 flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">{t('or')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Option 2: Subscribe now */}
          <button
            type="button"
            onClick={() => setView('card-form')}
            className={cn(
              'w-full rounded-2xl border-2 p-5 text-left transition-all',
              'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">{t('subscribeNowTitle')}</h3>
                <p className="text-sm text-gray-500 mt-1">{t('subscribeNowDescription')}</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ─── Card Form View ────────────────────────────────────────────────
  return (
    <div>
      {/* Back to choice */}
      <button
        type="button"
        onClick={() => { setView('choice'); setError(''); }}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <CreditCard className="h-4 w-4" />
        {t('backToOptions')}
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
          {t('subscribe')} — 290 ₪/{t('perMonth')}
        </Button>
      </form>
    </div>
  );
}
