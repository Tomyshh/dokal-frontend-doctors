'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Lock, Shield, CreditCard, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    PayMe: {
      create: (apiKey: string, options: { testMode: boolean }) => Promise<PayMeInstance>;
      fields: {
        NUMBER: string;
        EXPIRATION: string;
        CVC: string;
        NAME_FIRST: string;
        NAME_LAST: string;
        EMAIL: string;
        PHONE: string;
        SOCIAL_ID: string;
        NONE: string;
      };
      validators: Record<string, { test: (value: string) => Record<string, boolean> | null }>;
    };
  }
}

interface PayMeInstance {
  hostedFields: () => PayMeHostedFieldsManager;
  tokenize: (sale: PayMeSaleData) => Promise<PayMeTokenResult>;
  teardown: () => void;
}

interface PayMeHostedFieldsManager {
  create: (type: string, settings: Record<string, unknown>) => PayMeField;
}

interface PayMeField {
  mount: (selector: string) => Promise<void>;
  on: (event: string, handler: (e: PayMeFieldEvent) => void) => void;
  focus: () => void;
}

interface PayMeFieldEvent {
  isValid: boolean;
  isEmpty?: boolean;
  field: string;
  message?: string;
  cardType?: string;
}

interface PayMeSaleData {
  payerFirstName: string;
  payerLastName: string;
  payerEmail: string;
  payerPhone?: string;
  payerSocialId?: string;
  total: {
    label: string;
    amount: {
      currency: string;
      value: string;
    };
  };
}

interface PayMeTokenResult {
  token: string;
  [key: string]: unknown;
}

interface PaymeHostedFieldsProps {
  onTokenized: (buyerKey: string) => void;
  onError?: (error: string) => void;
  loading?: boolean;
  submitLabel?: string;
  priceLabel?: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  amountILS?: number;
  className?: string;
}

const PAYME_JSAPI_URL = 'https://cdn.payme.io/jsapi/v1/payme.js';

export default function PaymeHostedFields({
  onTokenized,
  onError,
  loading = false,
  submitLabel,
  priceLabel,
  buyerFirstName = '',
  buyerLastName = '',
  buyerEmail = '',
  buyerPhone = '',
  amountILS,
  className,
}: PaymeHostedFieldsProps) {
  const t = useTranslations('subscription');
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [fieldsReady, setFieldsReady] = useState(false);
  const [error, setError] = useState('');
  const [cardType, setCardType] = useState<string>('unknown');
  const [tokenizing, setTokenizing] = useState(false);

  const instanceRef = useRef<PayMeInstance | null>(null);
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_PAYME_API_KEY ?? '';
  const isTestMode = process.env.NEXT_PUBLIC_PAYME_TEST_MODE === 'true';

  const initFields = useCallback(async () => {
    if (!sdkLoaded || !window.PayMe || mountedRef.current || !apiKey) return;
    mountedRef.current = true;

    try {
      const instance = await window.PayMe.create(apiKey, { testMode: isTestMode });
      instanceRef.current = instance;

      const fields = instance.hostedFields();

      const baseStyles = {
        styles: {
          base: {
            'font-size': '16px',
            'font-family': 'system-ui, -apple-system, sans-serif',
            'color': '#1f2937',
            'padding': '12px 16px',
            '::placeholder': { color: '#9ca3af' },
          },
          invalid: { color: '#ef4444' },
          valid: { color: '#1f2937' },
        },
      };

      const cardNumber = fields.create(window.PayMe.fields.NUMBER, {
        ...baseStyles,
        placeholder: '4580 0000 0000 1234',
        messages: {
          invalid: t('genericError'),
          required: t('cardNumber'),
        },
      });

      const expiration = fields.create(window.PayMe.fields.EXPIRATION, {
        ...baseStyles,
        messages: {
          invalid: t('genericError'),
          required: t('expiry'),
        },
      });

      const cvc = fields.create(window.PayMe.fields.CVC, {
        ...baseStyles,
        placeholder: 'CVV',
        messages: {
          invalid: t('genericError'),
          required: t('cvv'),
        },
      });

      const allReady: Promise<void>[] = [];

      allReady.push(cardNumber.mount('#payme-card-number'));
      allReady.push(expiration.mount('#payme-expiration'));
      allReady.push(cvc.mount('#payme-cvc'));

      cardNumber.on('card-type-changed', (ev: PayMeFieldEvent) => {
        if (ev.cardType) setCardType(ev.cardType);
      });

      cardNumber.on('validity-changed', (ev: PayMeFieldEvent) => {
        if (ev.isValid) setError('');
      });

      await Promise.all(allReady);
      setFieldsReady(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('genericError');
      setError(msg);
      onError?.(msg);
    }
  }, [sdkLoaded, apiKey, isTestMode, t, onError]);

  useEffect(() => {
    initFields();
    return () => {
      if (instanceRef.current) {
        try { instanceRef.current.teardown(); } catch { /* ignore */ }
      }
      mountedRef.current = false;
    };
  }, [initFields]);

  const handleSubmit = useCallback(async () => {
    if (!instanceRef.current || tokenizing) return;

    setTokenizing(true);
    setError('');

    try {
      const sale: PayMeSaleData = {
        payerFirstName: buyerFirstName,
        payerLastName: buyerLastName,
        payerEmail: buyerEmail,
        payerPhone: buyerPhone || undefined,
        total: {
          label: 'Dokal Subscription',
          amount: {
            currency: 'ILS',
            value: amountILS ? amountILS.toFixed(2) : '0.00',
          },
        },
      };

      const result = await instanceRef.current.tokenize(sale);
      onTokenized(result.token);
    } catch (err: unknown) {
      const errorObj = err as { type?: string; errors?: Record<string, string>; message?: string };
      let msg: string;
      if (errorObj.type === 'tokenize-error' && errorObj.errors) {
        const [firstError] = Object.values(errorObj.errors);
        msg = firstError ?? t('genericError');
      } else {
        msg = errorObj.message ?? t('genericError');
      }
      setError(msg);
      onError?.(msg);
    } finally {
      setTokenizing(false);
    }
  }, [buyerFirstName, buyerLastName, buyerEmail, buyerPhone, amountILS, onTokenized, onError, tokenizing, t]);

  const CardBrandIcon = () => {
    if (cardType === 'visa') return <span className="text-xs font-bold text-blue-600 tracking-wide">VISA</span>;
    if (cardType === 'mastercard') {
      return (
        <div className="flex -space-x-1.5">
          <div className="w-4 h-4 rounded-full bg-red-500 opacity-80" />
          <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
        </div>
      );
    }
    if (cardType === 'amex') return <span className="text-xs font-bold text-blue-800 tracking-wide">AMEX</span>;
    return <CreditCard className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className={cn('space-y-5', className)} ref={containerRef}>
      <Script
        src={PAYME_JSAPI_URL}
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
        onError={() => setError('Failed to load payment SDK')}
      />

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('cardNumber')}
        </label>
        <div className="relative">
          <div
            id="payme-card-number"
            className="h-12 rounded-xl border border-gray-200 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CardBrandIcon />
          </div>
        </div>
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('expiry')}
          </label>
          <div
            id="payme-expiration"
            className="h-12 rounded-xl border border-gray-200 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('cvv')}
          </label>
          <div
            id="payme-cvc"
            className="h-12 rounded-xl border border-gray-200 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
        <Shield className="h-4 w-4 shrink-0 text-gray-400" />
        <span>{t('securityNotice')}</span>
      </div>

      {/* Submit */}
      <Button
        type="button"
        className="w-full rounded-full h-12 text-base"
        onClick={handleSubmit}
        loading={loading || tokenizing}
        disabled={!fieldsReady || tokenizing || loading}
      >
        <Lock className="h-4 w-4" />
        {submitLabel ?? t('payNow')}
        {priceLabel && ` — ${priceLabel}`}
      </Button>
    </div>
  );
}
