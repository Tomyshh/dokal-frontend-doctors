'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useToast } from '@/providers/ToastProvider';

export default function VerifyEmailPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const submitInFlightRef = useRef(false);

  // Load from sessionStorage on refresh if needed
  useEffect(() => {
    if (email) return;
    try {
      const stored = sessionStorage.getItem('signup_email') || '';
      if (stored) setEmail(stored);
    } catch {
      // ignore
    }
  }, [email]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const otpCode = otpDigits.join('');
  const isOtpComplete = useMemo(() => otpCode.length === 6, [otpCode]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '').slice(-1);
      const newDigits = [...otpDigits];
      newDigits[index] = digit;
      setOtpDigits(newDigits);
      setOtpError('');

      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [otpDigits]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits]
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
      if (pasted.length === 0) return;
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length && i < 6; i++) newDigits[i] = pasted[i];
      setOtpDigits(newDigits);
      const nextEmpty = newDigits.findIndex((d) => !d);
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    },
    [otpDigits]
  );

  const handleVerifyOtp = useCallback(async () => {
    if (!email) {
      setOtpError(t('otpError'));
      return;
    }
    if (!isOtpComplete) return;
    if (submitInFlightRef.current) return;

    setOtpError('');
    setOtpLoading(true);
    submitInFlightRef.current = true;
    try {
      const supabase = createClient();
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });

      if (verifyError) {
        setOtpError(t('otpInvalid'));
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // Ensure session is persisted
      let hasSession = !!verifyData?.session;
      if (!hasSession) {
        for (let i = 0; i < 6 && !hasSession; i++) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 120));
          // eslint-disable-next-line no-await-in-loop
          const { data } = await supabase.auth.getSession();
          hasSession = !!data.session;
        }
      }

      setRedirecting(true);
      router.replace(`/${locale}/complete-profile`);
      router.refresh();
    } catch {
      setOtpError(t('otpError'));
    } finally {
      setOtpLoading(false);
      submitInFlightRef.current = false;
    }
  }, [email, isOtpComplete, locale, otpCode, router, t]);

  // Auto-submit when complete
  useEffect(() => {
    if (isOtpComplete && !otpLoading && !redirecting) {
      handleVerifyOtp();
    }
  }, [handleVerifyOtp, isOtpComplete, otpLoading, redirecting]);

  const handleResendOtp = async () => {
    if (!email) return;
    if (resendCooldown > 0) return;

    setOtpError('');
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        email,
        type: 'signup',
      });
      if (resendError) {
        toast.error(t('otpResendError'), resendError.message);
        return;
      }
      setResendCooldown(60);
      toast.success(t('otpResendSuccess'));
    } catch {
      toast.error(t('otpResendError'));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 rtl-flip-arrow" />
          {t('otpBackToForm')}
        </Link>
      </div>

      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">{t('otpTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t('otpSubtitle')}</p>
          <p className="text-sm font-medium text-gray-900 mt-1" dir="ltr">
            {email || '—'}
          </p>
        </div>
      </div>

      {otpError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {otpError}
        </div>
      )}

      <div className="flex justify-center gap-3 mb-8" dir="ltr">
        {otpDigits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={index === 0 ? handleOtpPaste : undefined}
            maxLength={1}
            className={cn(
              'w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-white transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              digit ? 'border-primary bg-primary/5' : 'border-gray-200',
              otpError && 'border-red-300 focus:border-red-400 focus:ring-red-200'
            )}
            autoFocus={index === 0}
          />
        ))}
      </div>

      <Button
        type="button"
        onClick={handleVerifyOtp}
        className="w-full rounded-full h-12 mb-4"
        loading={otpLoading}
        disabled={!isOtpComplete}
      >
        <ShieldCheck className="h-4 w-4" />
        {t('otpVerify')}
      </Button>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t('otpNoCode')}{' '}
          {resendCooldown > 0 ? (
            <span className="text-gray-400">
              {t('otpResendIn', { seconds: resendCooldown })}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-primary hover:underline font-medium"
            >
              {t('otpResend')}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

