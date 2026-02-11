'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/api';
import type { RegisterPractitionerRequest } from '@/types/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SpecialtyCombobox } from '@/components/auth/SpecialtyCombobox';
import { CityCombobox } from '@/components/auth/CityCombobox';
import { PhoneInputIL, normalizeIsraelPhoneToE164 } from '@/components/auth/PhoneInputIL';
import { Spinner } from '@/components/ui/Spinner';

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  specialty: string;
  licenseNumber: string;
  specializationLicense: string;
  addressLine: string;
  zipCode: string;
};

export default function CompleteProfilePage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [form, setForm] = useState<FormState>({
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    phone: profile?.phone ? profile.phone.replace(/\D/g, '') : '',
    city: profile?.city || '',
    specialty: '',
    licenseNumber: '',
    specializationLicense: '',
    addressLine: '',
    zipCode: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If profile arrives after initial render, prefill basic fields once.
  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || profile.first_name || '',
      lastName: prev.lastName || profile.last_name || '',
      phone: prev.phone || (profile.phone ? profile.phone.replace(/\D/g, '') : ''),
      city: prev.city || profile.city || '',
    }));
  }, [profile]);

  const phoneInvalid = useMemo(() => {
    if (form.phone.length === 0) return false;
    return normalizeIsraelPhoneToE164(form.phone) === null;
  }, [form.phone]);

  const licenseNumberInvalid = useMemo(() => {
    if (form.licenseNumber.length === 0) return false;
    return !/^\d{1,6}$/.test(form.licenseNumber);
  }, [form.licenseNumber]);

  const specializationLicenseInvalid = useMemo(() => {
    if (form.specializationLicense.length === 0) return false;
    return !/^\d{1,6}$/.test(form.specializationLicense);
  }, [form.specializationLicense]);

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!profile?.email) {
      setError(t('registrationBackendError'));
      return;
    }

    if (phoneInvalid) {
      setError(t('phoneInvalid'));
      return;
    }
    if (licenseNumberInvalid) {
      setError(t('licenseNumberInvalid'));
      return;
    }
    if (specializationLicenseInvalid) {
      setError(t('specializationLicenseInvalid'));
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizeIsraelPhoneToE164(form.phone);
      const payload: RegisterPractitionerRequest = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: profile.email,
        phone: normalizedPhone ?? form.phone,
        city: form.city,
        specialty: form.specialty,
        license_number: form.licenseNumber,
        specialization_license: form.specializationLicense || undefined,
        address_line: form.addressLine,
        zip_code: form.zipCode,
        organization_name: `Cabinet Dr ${form.lastName}`.trim(),
        organization_type: 'individual',
      };

      await api.post('/practitioners/register', payload);
      router.push(`/${locale}/subscription`);
      router.refresh();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr?.response?.data?.error?.message || t('registrationBackendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {authLoading && !profile ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : null}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('completeProfileTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t('completeProfileSubtitle')}</p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="licenseNumber"
            label={t('licenseNumber')}
            value={form.licenseNumber}
            onChange={(e) => handleChange('licenseNumber', e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            inputMode="numeric"
            maxLength={6}
            error={licenseNumberInvalid ? t('licenseNumberInvalid') : undefined}
          />
          <Input
            id="specializationLicense"
            label={t('specializationLicense')}
            value={form.specializationLicense}
            onChange={(e) => handleChange('specializationLicense', e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            maxLength={6}
            error={specializationLicenseInvalid ? t('specializationLicenseInvalid') : undefined}
          />
        </div>

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

        <Button type="submit" className="w-full rounded-full h-12" loading={loading}>
          {t('saveAndContinue')}
        </Button>
      </form>
    </div>
  );
}

