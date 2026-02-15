'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/api';
import type { RegisterPractitionerRequest } from '@/types/api';
import type { Practitioner } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SpecialtyCombobox } from '@/components/auth/SpecialtyCombobox';
import { CityCombobox } from '@/components/auth/CityCombobox';
import { PhoneInputIL, normalizeIsraelPhoneToE164 } from '@/components/auth/PhoneInputIL';
import { Spinner } from '@/components/ui/Spinner';
import { getMyPractitionerOrNull, isPractitionerProfileComplete, unwrapPractitioner } from '@/lib/practitioner';

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  /** Specialty UUID from the backend */
  specialtyId: string;
  licenseNumber: string;
  specializationLicense: string;
  addressLine: string;
  zipCode: string;
};

export default function CompleteProfilePage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshUserData } = useAuth();

  // Google user_metadata may contain given_name, family_name, full_name, avatar_url
  const googleMeta = user?.user_metadata;

  const [form, setForm] = useState<FormState>({
    firstName: profile?.first_name || googleMeta?.given_name || '',
    lastName: profile?.last_name || googleMeta?.family_name || '',
    phone: profile?.phone ? profile.phone.replace(/\D/g, '') : '',
    city: profile?.city || '',
    specialtyId: '',
    licenseNumber: '',
    specializationLicense: '',
    addressLine: '',
    zipCode: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Resolve email and user ID: prefer backend profile, fall back to Supabase user (Google OAuth)
  const resolvedEmail = profile?.email || user?.email || null;

  // If profile or user arrives after initial render, prefill basic fields once.
  // For Google OAuth users, user_metadata may have given_name/family_name before the backend profile exists.
  useEffect(() => {
    if (!profile && !user) return;
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || profile?.first_name || googleMeta?.given_name || '',
      lastName: prev.lastName || profile?.last_name || googleMeta?.family_name || '',
      phone: prev.phone || (profile?.phone ? profile.phone.replace(/\D/g, '') : ''),
      city: prev.city || profile?.city || '',
    }));
  }, [profile, user, googleMeta]);

  // If a practitioner already exists (e.g. after a redirect back), prefill missing fields from it.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyPractitionerOrNull();
        if (!data) return;
        if (cancelled) return;
        setForm((prev) => ({
          ...prev,
          phone: prev.phone || (data.phone ? data.phone.replace(/\D/g, '') : ''),
          city: prev.city || data.city || '',
          specialtyId: prev.specialtyId || data.specialty_id || '',
          addressLine: prev.addressLine || data.address_line || '',
          zipCode: prev.zipCode || data.zip_code || '',
          licenseNumber: prev.licenseNumber || data.license_number || '',
          specializationLicense: prev.specializationLicense || data.specialization_license || '',
        }));
      } catch {
        // ignore (practitioner may not exist yet)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const waitForPractitionerReady = useCallback(
    async () => {
      const started = Date.now();
      let delay = 400;
      // Some backends use async jobs / eventual consistency — allow a bit more time.
      while (Date.now() - started < 25_000) {
        try {
          const data = await getMyPractitionerOrNull();
          if (isPractitionerProfileComplete(data)) return true;
        } catch {
          // not ready yet
        }
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(Math.round(delay * 1.7), 2000);
      }
      return false;
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!resolvedEmail) {
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

    if (!form.specialtyId) {
      setError(t('specialtyInvalid'));
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizeIsraelPhoneToE164(form.phone);
      const payload: RegisterPractitionerRequest = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: resolvedEmail,
        phone: normalizedPhone ?? form.phone,
        city: form.city,
        specialty_id: form.specialtyId,
        license_number: form.licenseNumber,
        specialization_license: form.specializationLicense || undefined,
        address_line: form.addressLine,
        zip_code: form.zipCode,
        organization_name: `Cabinet Dr ${form.lastName}`.trim(),
        organization_type: 'individual',
      };

      const { data: raw } = await api.post<unknown>('/practitioners/register', payload);
      const registered = unwrapPractitioner(raw) as Practitioner;

      // Refresh in-memory auth profile/subscription (role changes, etc.)
      await refreshUserData();

      // If the 201 response already has complete data, navigate immediately.
      if (isPractitionerProfileComplete(registered)) {
        window.location.assign(`/${locale}/subscription`);
        return;
      }

      // Otherwise poll /practitioners/me (with cache-busting) for up to 15s.
      const ready = await waitForPractitionerReady();
      if (ready) {
        window.location.assign(`/${locale}/subscription`);
        return;
      }

      // Timeout: go to subscription anyway — it will show "Finalisation..." and retry.
      // Never block the user with "registration failed" after a successful 201.
      window.location.assign(`/${locale}/subscription`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosErr?.response?.data?.error?.message || t('registrationBackendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {authLoading && !user ? (
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
            value={form.specialtyId}
            onChange={(v) => handleChange('specialtyId', v)}
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
