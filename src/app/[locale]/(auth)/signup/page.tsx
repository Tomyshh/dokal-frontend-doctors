'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import api from '@/lib/api';
import type { RegisterPractitionerRequest } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SpecialtyCombobox } from '@/components/auth/SpecialtyCombobox';
import { CityCombobox } from '@/components/auth/CityCombobox';
import { PhoneInputIL, normalizeIsraelPhoneToE164 } from '@/components/auth/PhoneInputIL';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/providers/ToastProvider';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  specialty: string;
  licenseNumber: string;
  specializationLicense: string;
  addressLine: string;
  zipCode: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

type Step = 'form' | 'otp';

export default function SignupPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<Step>('form');

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    specialty: '',
    licenseNumber: '',
    specializationLicense: '',
    addressLine: '',
    zipCode: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpRedirecting, setOtpRedirecting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpSubmitInFlightRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // ─── Detect browser autofill and sync React state ────────────────
  // Browsers sometimes fire native `change` events (not `input`) on autofill,
  // which React's synthetic onChange doesn't capture.
  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl) return;

    const autofillFields: (keyof FormState)[] = [
      'firstName', 'lastName', 'email', 'phone',
      'licenseNumber', 'specializationLicense', 'addressLine', 'zipCode',
      'password', 'confirmPassword',
    ];

    const handleNativeChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (!input?.id || !autofillFields.includes(input.id as keyof FormState)) return;

      const key = input.id as keyof FormState;
      let val: string = input.value;

      // Normalise phone digits the same way PhoneInputIL does
      if (key === 'phone') val = val.replace(/\D/g, '');
      // Normalise license numbers
      if (key === 'licenseNumber') val = val.replace(/\D/g, '').slice(0, 6);
      if (key === 'specializationLicense') val = val.replace(/\D/g, '').slice(0, 6);

      setForm((prev) => {
        if (prev[key] === val) return prev;
        return { ...prev, [key]: val };
      });
    };

    // Use capture phase so we intercept before React's own listeners
    formEl.addEventListener('change', handleNativeChange, true);
    return () => formEl.removeEventListener('change', handleNativeChange, true);
  }, []);

  const passwordMismatch = useMemo(() => {
    return (
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      form.password !== form.confirmPassword
    );
  }, [form.password, form.confirmPassword]);

  const licenseNumberInvalid = useMemo(() => {
    if (form.licenseNumber.length === 0) return false;
    return !/^\d{1,6}$/.test(form.licenseNumber);
  }, [form.licenseNumber]);

  const specializationLicenseInvalid = useMemo(() => {
    if (form.specializationLicense.length === 0) return false;
    return !/^\d{1,6}$/.test(form.specializationLicense);
  }, [form.specializationLicense]);

  const phoneInvalid = useMemo(() => {
    if (form.phone.length === 0) return false;
    return normalizeIsraelPhoneToE164(form.phone) === null;
  }, [form.phone]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** Call backend to create profiles + practitioners + organization rows (after auth is confirmed) */
  const registerPractitionerOnBackend = async (overrideForm?: FormState) => {
    const f = overrideForm ?? form;
    const normalizedPhone = normalizeIsraelPhoneToE164(f.phone);
    const payload: RegisterPractitionerRequest = {
      first_name: f.firstName,
      last_name: f.lastName,
      email: f.email,
      phone: normalizedPhone ?? f.phone,
      city: f.city,
      specialty: f.specialty,
      license_number: f.licenseNumber,
      specialization_license: f.specializationLicense || undefined,
      address_line: f.addressLine,
      zip_code: f.zipCode,
      // Le backend crée automatiquement une organization de type 'individual'
      // Pour rejoindre une clinique existante, passer organization_id
      // Pour créer une clinique, passer organization_name + organization_type: 'clinic'
    };
    console.log('[Signup] Sending practitioner registration payload:', JSON.stringify(payload, null, 2));
    const response = await api.post('/practitioners/register', payload);
    console.log('[Signup] Backend response:', response.status, response.data);
    return response;
  };

  // ─── Resend cooldown timer ─────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ─── Step 1: Create account ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Read actual DOM values as a safety net for browser autofill ──
    // Browser autofill can set DOM values without triggering React onChange,
    // leaving React state empty while the UI shows filled-in fields.
    const domVal = (id: string): string =>
      (document.getElementById(id) as HTMLInputElement)?.value ?? '';

    const synced: FormState = {
      firstName: form.firstName || domVal('firstName'),
      lastName: form.lastName || domVal('lastName'),
      email: form.email || domVal('email'),
      phone: form.phone || domVal('phone').replace(/\D/g, ''),
      city: form.city || domVal('city'),
      specialty: form.specialty, // custom combobox, not subject to autofill
      licenseNumber: form.licenseNumber || domVal('licenseNumber').replace(/\D/g, '').slice(0, 6),
      specializationLicense: form.specializationLicense || domVal('specializationLicense').replace(/\D/g, '').slice(0, 6),
      addressLine: form.addressLine || domVal('addressLine'),
      zipCode: form.zipCode || domVal('zipCode'),
      password: form.password || domVal('password'),
      confirmPassword: form.confirmPassword || domVal('confirmPassword'),
      acceptTerms: form.acceptTerms,
    };

    // Persist the merged values back into React state
    setForm(synced);

    // Validate using synced values (not the possibly-stale React state)
    const syncedPwMismatch =
      synced.password.length > 0 &&
      synced.confirmPassword.length > 0 &&
      synced.password !== synced.confirmPassword;
    if (syncedPwMismatch) {
      setError(t('passwordMismatch'));
      return;
    }

    const syncedLicenseInvalid =
      synced.licenseNumber.length > 0 && !/^\d{1,6}$/.test(synced.licenseNumber);
    if (syncedLicenseInvalid) {
      setError(t('licenseNumberInvalid'));
      return;
    }

    const syncedSpecLicenseInvalid =
      synced.specializationLicense.length > 0 && !/^\d{1,6}$/.test(synced.specializationLicense);
    if (syncedSpecLicenseInvalid) {
      setError(t('specializationLicenseInvalid'));
      return;
    }

    const syncedPhoneInvalid =
      synced.phone.length > 0 && normalizeIsraelPhoneToE164(synced.phone) === null;
    if (syncedPhoneInvalid) {
      setError(t('phoneInvalid'));
      return;
    }

    if (!synced.acceptTerms) {
      setError(t('termsError'));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: synced.email,
        password: synced.password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/login`,
          data: {
            role: 'practitioner',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If session already exists (email confirmation disabled),
      // register practitioner on backend then go to subscription
      if (data.session) {
        try {
          await registerPractitionerOnBackend(synced);
        } catch (err: unknown) {
          console.error('Practitioner registration failed:', err);
          const axiosErr = err as { response?: { status?: number; data?: unknown } };
          if (axiosErr?.response) {
            console.error('[Signup] Backend error status:', axiosErr.response.status);
            console.error('[Signup] Backend error data:', JSON.stringify(axiosErr.response.data, null, 2));
          }
          setError(t('registrationBackendError'));
          setLoading(false);
          return;
        }
        router.push(`/${locale}/subscription`);
        router.refresh();
        return;
      }

      // Email confirmation required → show OTP step
      setStep('otp');
      setResendCooldown(60);
    } catch {
      setError(t('signupError'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────────────────────
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, '').slice(-1);
      const newDigits = [...otpDigits];
      newDigits[index] = digit;
      setOtpDigits(newDigits);
      setOtpError('');

      // Auto-focus next input
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
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      // Focus the next empty or the last filled
      const nextEmpty = newDigits.findIndex((d) => !d);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();
    },
    [otpDigits]
  );

  const otpCode = otpDigits.join('');
  const isOtpComplete = otpCode.length === 6;

  const handleVerifyOtp = async () => {
    if (!isOtpComplete) return;
    if (otpSubmitInFlightRef.current) return;

    setOtpError('');
    setOtpLoading(true);
    otpSubmitInFlightRef.current = true;
    try {
      const supabase = createClient();
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: form.email,
        token: otpCode,
        type: 'signup',
      });

      if (verifyError) {
        setOtpError(t('otpInvalid'));
        // Clear the digits for retry
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // OTP verified → make sure we really have a session before redirecting.
      // Sometimes the user is confirmed but the session cookie/storage is not ready yet.
      let hasSession = !!verifyData?.session;
      if (!hasSession) {
        // Try a few times quickly to give Supabase time to persist the session.
        for (let i = 0; i < 5 && !hasSession; i++) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 120));
          // eslint-disable-next-line no-await-in-loop
          const { data } = await supabase.auth.getSession();
          hasSession = !!data.session;
        }
      }

      // Register practitioner profile on backend
      try {
        await registerPractitionerOnBackend();
      } catch (err: unknown) {
        console.error('Practitioner registration failed:', err);
        const axiosErr = err as { response?: { status?: number; data?: unknown } };
        if (axiosErr?.response) {
          console.error('[Signup] Backend error status:', axiosErr.response.status);
          console.error('[Signup] Backend error data:', JSON.stringify(axiosErr.response.data, null, 2));
        }
        setOtpError(t('registrationBackendError'));
        return;
      }

      setOtpRedirecting(true);
      // Use a hard redirect to avoid edge cases where router navigation does not happen
      // even though Supabase has confirmed the user.
      window.location.assign(`/${locale}/subscription`);
    } catch {
      setOtpError(t('otpError'));
    } finally {
      setOtpLoading(false);
      otpSubmitInFlightRef.current = false;
    }
  };

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (isOtpComplete && !otpLoading && !otpRedirecting) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    try {
      const supabase = createClient();
      console.log('[Resend OTP] Calling supabase.auth.resend for:', form.email);
      const { data: resendData, error: resendError } = await supabase.auth.resend({
        email: form.email,
        type: 'signup',
      });
      console.log('[Resend OTP] Response data:', JSON.stringify(resendData));
      console.log('[Resend OTP] Response error:', resendError);
      if (resendError) {
        console.error('[Resend OTP] Error:', resendError.message, resendError);
        toast.error(t('otpResendError'), resendError.message);
        return;
      }
      setResendCooldown(60);
      toast.success(t('otpResendSuccess'));
    } catch (err) {
      console.error('[Resend OTP] Unexpected error:', err);
      toast.error(t('otpResendError'));
    }
  };

  // ─── OTP Verification Screen ──────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 border border-white/20 px-8 py-10 sm:px-10">
            {/* Header */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-900">{t('otpTitle')}</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('otpSubtitle')}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">{form.email}</p>
              </div>
            </div>

            {/* OTP Error */}
            {otpError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-6">
                {otpError}
              </div>
            )}

            {/* OTP Input */}
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
                    digit
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200',
                    otpError && 'border-red-300 focus:border-red-400 focus:ring-red-200'
                  )}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Verify button */}
            <Button
              type="button"
              onClick={handleVerifyOtp}
              className="w-full rounded-full h-11 mb-4"
              loading={otpLoading}
              disabled={!isOtpComplete}
            >
              <ShieldCheck className="h-4 w-4" />
              {t('otpVerify')}
            </Button>

            {/* Resend */}
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

            {/* Back to form */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setStep('form'); setOtpDigits(['', '', '', '', '', '']); setOtpError(''); }}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('otpBackToForm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Registration Form ─────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 border border-white/20 px-8 py-7 sm:px-10 sm:py-8">
          {/* Header: logo (vert Dokal) + title */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <span
              className="inline-block [filter:brightness(0)_saturate(100%)_invert(18%)_sepia(89%)_saturate(1200%)_hue-rotate(152deg)_brightness(94%)_contrast(91%)]"
              aria-hidden
            >
              <Image
                src="/branding/icononly_transparent.png"
                alt="Dokal"
                width={100}
                height={100}
                priority
              />
            </span>
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">{t('signupTitle')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('signupSubtitle')}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Name + Email */}
            <div className="grid grid-cols-4 gap-3">
              <Input
                id="firstName"
                label={t('firstName')}
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                required
                autoComplete="given-name"
              />
              <Input
                id="lastName"
                label={t('lastName')}
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                required
                autoComplete="family-name"
              />
              <div className="col-span-2">
                <Input
                  id="email"
                  type="email"
                  label={t('email')}
                  placeholder="docteur@example.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Row 2: Phone + City + Specialty */}
            <div className="grid grid-cols-3 gap-3">
              <PhoneInputIL
                id="phone"
                label={t('phone')}
                value={form.phone}
                onChange={(v) => handleChange('phone', v)}
                required
                error={phoneInvalid ? t('phoneInvalid') : undefined}
              />
              <CityCombobox
                id="city"
                label={t('city')}
                value={form.city}
                onChange={(v) => handleChange('city', v)}
                required
                placeholder={t('city')}
              />
              <SpecialtyCombobox
                id="specialty"
                label={t('specialty')}
                value={form.specialty}
                onChange={(v) => handleChange('specialty', v)}
                required
                placeholder={t('specialty')}
              />
            </div>

            {/* Row 3: Licenses */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="licenseNumber"
                label={t('licenseNumber')}
                value={form.licenseNumber}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                  handleChange('licenseNumber', digitsOnly);
                }}
                required
                inputMode="numeric"
                pattern="[0-9]{1,6}"
                maxLength={6}
                placeholder="123456"
                error={licenseNumberInvalid ? t('licenseNumberInvalid') : undefined}
              />
              <Input
                id="specializationLicense"
                label={t('specializationLicense')}
                value={form.specializationLicense}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                  handleChange('specializationLicense', digitsOnly);
                }}
                inputMode="numeric"
                pattern="[0-9]{0,6}"
                maxLength={6}
                placeholder="123456"
                error={specializationLicenseInvalid ? t('specializationLicenseInvalid') : undefined}
              />
            </div>

            {/* Row 4: Address + Zip */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <Input
                  id="addressLine"
                  label={t('addressLine')}
                  value={form.addressLine}
                  onChange={(e) => handleChange('addressLine', e.target.value)}
                  required
                  autoComplete="street-address"
                />
              </div>
              <Input
                id="zipCode"
                label={t('zipCode')}
                value={form.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                required
                autoComplete="postal-code"
              />
            </div>

            {/* Subtle separator */}
            <div className="border-t border-gray-100" />

            {/* Row 4: Passwords */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="password"
                type="password"
                label={t('password')}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                autoComplete="new-password"
              />
              <Input
                id="confirmPassword"
                type="password"
                label={t('confirmPassword')}
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                autoComplete="new-password"
                error={passwordMismatch ? t('passwordMismatch') : undefined}
              />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                checked={form.acceptTerms}
                onChange={(e) => handleChange('acceptTerms', e.target.checked)}
              />
              <span className="leading-snug group-hover:text-gray-900 transition-colors">
                {t('termsLabel')}
              </span>
            </label>

            {/* Submit */}
            <Button type="submit" className="w-full rounded-full h-11" loading={loading}>
              {t('createAccount')}
            </Button>

            {/* Footer links */}
            <div className="flex items-center justify-between text-sm pt-1">
              <Link
                href="/welcome"
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('backToLanding')}
              </Link>
              <span className="text-muted-foreground">
                {t('alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {t('signIn')}
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
