'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  specialty: string;
  licenseNumber: string;
  addressLine: string;
  zipCode: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

export default function SignupPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    specialty: '',
    licenseNumber: '',
    addressLine: '',
    zipCode: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const passwordMismatch = useMemo(() => {
    return (
      form.password.length > 0 &&
      form.confirmPassword.length > 0 &&
      form.password !== form.confirmPassword
    );
  }, [form.password, form.confirmPassword]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (passwordMismatch) {
      setError(t('passwordMismatch'));
      return;
    }

    if (!form.acceptTerms) {
      setError(t('termsError'));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/login`,
          data: {
            role: 'practitioner',
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            city: form.city,
            specialty: form.specialty,
            license_number: form.licenseNumber,
            address_line: form.addressLine,
            zip_code: form.zipCode,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If email confirmation is enabled, session can be null.
      if (!data.session) {
        setSuccess(true);
        router.push(`/${locale}/login?checkEmail=1`);
        return;
      }

      // Session exists — redirect to dashboard (onboarding will catch them)
      router.push(`/${locale}`);
      router.refresh();
    } catch {
      setError(t('signupError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/welcome"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToLanding')}
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('signupTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t('signupSubtitle')}</p>
      </div>

      {success && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 mb-6">
          {t('checkEmail')}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="phone"
            label={t('phone')}
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
            autoComplete="tel"
          />
          <Input
            id="city"
            label={t('city')}
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            required
            autoComplete="address-level2"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="specialty"
            label={t('specialty')}
            value={form.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
            required
          />
          <Input
            id="licenseNumber"
            label={t('licenseNumber')}
            value={form.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value)}
            required
          />
        </div>

        <Input
          id="addressLine"
          label={t('addressLine')}
          value={form.addressLine}
          onChange={(e) => handleChange('addressLine', e.target.value)}
          required
          autoComplete="street-address"
        />

        <Input
          id="zipCode"
          label={t('zipCode')}
          value={form.zipCode}
          onChange={(e) => handleChange('zipCode', e.target.value)}
          required
          autoComplete="postal-code"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            checked={form.acceptTerms}
            onChange={(e) => handleChange('acceptTerms', e.target.checked)}
          />
          <span>{t('termsLabel')}</span>
        </label>

        <Button type="submit" className="w-full rounded-full h-12" loading={loading}>
          {t('createAccount')}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t('signIn')}
          </Link>
        </div>
      </form>
    </div>
  );
}
