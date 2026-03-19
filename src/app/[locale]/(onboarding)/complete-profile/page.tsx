'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/lib/api';
import type { RegisterPractitionerRequest } from '@/types/api';
import type { Practitioner } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { SpecialtyCombobox } from '@/components/auth/SpecialtyCombobox';
import { CityCombobox } from '@/components/auth/CityCombobox';
import { AddressAutocomplete, type AddressResult } from '@/components/auth/AddressAutocomplete';
import { PhoneInputIL, normalizeIsraelPhoneToE164 } from '@/components/auth/PhoneInputIL';
import { Spinner } from '@/components/ui/Spinner';
import { filterOnboardingOptionalMissingFields, getMyPractitionerOrNull, isPractitionerCompleteFromBackend, unwrapPractitioner } from '@/lib/practitioner';
import { isRtl } from '@/i18n/config';
import { LogOut, ArrowLeft, ArrowRight, User, Stethoscope, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractStreetNumberFromLine } from '@/lib/addressStreet';

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  specialtyId: string;
  licenseNumber: string;
  specializationLicense: string;
  addressLine: string;
  streetNumber: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
};

const TOTAL_STEPS = 3;

function StepIndicator({
  currentStep,
  steps,
  rtl,
}: {
  currentStep: number;
  steps: { label: string; icon: React.ReactNode }[];
  rtl: boolean;
}) {
  const orderedSteps = rtl ? [...steps].reverse() : steps;
  const getOriginalIndex = (displayIdx: number) =>
    rtl ? steps.length - 1 - displayIdx : displayIdx;

  return (
    <div className="flex items-center justify-center w-full mb-8">
      {orderedSteps.map((step, displayIdx) => {
        const stepIdx = getOriginalIndex(displayIdx);
        const isActive = stepIdx === currentStep;
        const isCompleted = stepIdx < currentStep;
        const isLast = displayIdx === orderedSteps.length - 1;

        return (
          <div key={stepIdx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                  isCompleted && 'bg-primary text-white shadow-md shadow-primary/30',
                  isActive && 'bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-primary/20 scale-110',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.icon}
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium transition-colors duration-300 whitespace-nowrap',
                  isActive && 'text-primary',
                  isCompleted && 'text-primary/70',
                  !isActive && !isCompleted && 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="flex items-center mx-3 mb-6">
                <div
                  className={cn(
                    'h-0.5 w-12 sm:w-20 transition-all duration-500',
                    (rtl ? getOriginalIndex(displayIdx + 1) < currentStep : stepIdx < currentStep)
                      ? 'bg-primary'
                      : 'bg-border',
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CompleteProfilePage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const rtl = isRtl(locale);
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading, refreshUserData, signOut, loggingOut } = useAuth();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      try { sessionStorage.setItem('referral_code', ref); } catch { /* ignore */ }
    }
  }, [searchParams]);

  const googleMeta = user?.user_metadata;

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    firstName: profile?.first_name || googleMeta?.given_name || '',
    lastName: profile?.last_name || googleMeta?.family_name || '',
    phone: profile?.phone ? profile.phone.replace(/\D/g, '') : '',
    city: profile?.city || '',
    specialtyId: '',
    licenseNumber: '',
    specializationLicense: '',
    addressLine: '',
    streetNumber: '',
    zipCode: '',
    latitude: null,
    longitude: null,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [addressFieldError, setAddressFieldError] = useState<string | undefined>(undefined);
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});

  const resolvedEmail = profile?.email || user?.email || null;

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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyPractitionerOrNull();
        if (!data) return;
        if (cancelled) return;
        setMissingFields(filterOnboardingOptionalMissingFields(data.missing_fields));
        const dataObj = data as unknown as Record<string, unknown>;
        const specialtyId =
          (dataObj.specialty_id as string) ||
          (dataObj.specialtyId as string) ||
          ((dataObj.specialty as Record<string, unknown>)?.id as string) ||
          ((dataObj.specialties as Record<string, unknown>)?.id as string) ||
          (Array.isArray(dataObj.specialties) && (dataObj.specialties[0] as Record<string, unknown>)?.id as string) ||
          '';
        setForm((prev) => {
          let addr = prev.addressLine || data.address_line || '';
          let sn =
            (typeof data.street_number === 'string' ? data.street_number : '') || prev.streetNumber || '';
          if (!sn.trim() && addr) {
            const parsed = extractStreetNumberFromLine(addr);
            if (parsed.streetNumber) {
              addr = parsed.streetLine;
              sn = parsed.streetNumber;
            }
          }
          return {
            ...prev,
            phone: prev.phone || (data.phone ? data.phone.replace(/\D/g, '') : ''),
            city: prev.city || data.city || '',
            specialtyId: prev.specialtyId || specialtyId || '',
            addressLine: addr,
            streetNumber: sn.trim(),
            zipCode: prev.zipCode || data.zip_code || '',
            latitude: prev.latitude ?? data.latitude ?? null,
            longitude: prev.longitude ?? data.longitude ?? null,
            licenseNumber: prev.licenseNumber || data.license_number || '',
            specializationLicense: prev.specializationLicense || data.specialization_license || '',
          };
        });
      } catch {
        // practitioner may not exist yet
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const missingFieldLabels: Record<string, string> = {
    first_name: t('firstName'),
    last_name: t('lastName'),
    email: t('email'),
    phone: t('phone'),
    city: t('city'),
    address_line: t('addressLine'),
    street_number: t('streetNumber'),
    zip_code: t('zipCode'),
    specialty_id: t('specialty'),
    license_number: t('licenseNumber'),
  };

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
    setStepErrors((prev) => ({ ...prev, [step]: '' }));
  };

  const wizardSteps = useMemo(
    () => [
      { label: t('wizardStepPersonal'), icon: <User className="h-4 w-4" /> },
      { label: t('wizardStepProfessional'), icon: <Stethoscope className="h-4 w-4" /> },
      { label: t('wizardStepLocation'), icon: <MapPin className="h-4 w-4" /> },
    ],
    [t],
  );

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 0: {
        if (!form.firstName.trim() || !form.lastName.trim()) {
          setStepErrors((prev) => ({ ...prev, [s]: t('completeProfileMissingFields') }));
          return false;
        }
        if (!form.phone.trim()) {
          setStepErrors((prev) => ({ ...prev, [s]: t('phoneInvalid') }));
          return false;
        }
        if (phoneInvalid) {
          setStepErrors((prev) => ({ ...prev, [s]: t('phoneInvalid') }));
          return false;
        }
        return true;
      }
      case 1: {
        if (!form.specialtyId) {
          setStepErrors((prev) => ({ ...prev, [s]: t('specialtyInvalid') }));
          return false;
        }
        if (!form.licenseNumber.trim()) {
          setStepErrors((prev) => ({ ...prev, [s]: t('licenseNumberInvalid') }));
          return false;
        }
        if (licenseNumberInvalid) {
          setStepErrors((prev) => ({ ...prev, [s]: t('licenseNumberInvalid') }));
          return false;
        }
        if (specializationLicenseInvalid) {
          setStepErrors((prev) => ({ ...prev, [s]: t('specializationLicenseInvalid') }));
          return false;
        }
        return true;
      }
      case 2: {
        if (!form.addressLine.trim() || form.latitude == null || form.longitude == null) {
          setStepErrors((prev) => ({ ...prev, [s]: t('addressSelectHint') }));
          return false;
        }
        if (!form.streetNumber.trim()) {
          setStepErrors((prev) => ({ ...prev, [s]: t('addressMustIncludeStreetNumber') }));
          return false;
        }
        if (!form.city.trim()) {
          setStepErrors((prev) => ({ ...prev, [s]: t('cityInvalid') }));
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    setStepErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const waitForPractitionerReady = useCallback(async () => {
    const started = Date.now();
    let delay = 400;
    while (Date.now() - started < 25_000) {
      try {
        const data = await getMyPractitionerOrNull();
        if (isPractitionerCompleteFromBackend(data)) return true;
      } catch {
        // not ready yet
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(Math.round(delay * 1.7), 2000);
    }
    return false;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAddressFieldError(undefined);

    if (!validateStep(step)) return;

    if (!resolvedEmail) {
      setError(t('registrationBackendError'));
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = normalizeIsraelPhoneToE164(form.phone);
      let storedRef: string | undefined;
      try { storedRef = sessionStorage.getItem('referral_code') ?? undefined; } catch { /* ignore */ }

      const parsedAddr = extractStreetNumberFromLine(form.addressLine.trim());
      const address_line = parsedAddr.streetLine || form.addressLine.trim();
      const street_number = (form.streetNumber.trim() || parsedAddr.streetNumber).trim();

      const payload: RegisterPractitionerRequest = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: resolvedEmail,
        phone: normalizedPhone ?? form.phone,
        city: form.city,
        specialty_id: form.specialtyId,
        license_number: form.licenseNumber,
        specialization_license: form.specializationLicense || undefined,
        address_line,
        street_number,
        zip_code: form.zipCode || undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        organization_name: `Cabinet Dr ${form.lastName}`.trim(),
        organization_type: 'individual',
        referral_code: storedRef,
      };

      const { data: raw } = await api.post<unknown>('/practitioners/register', payload);
      const registered = unwrapPractitioner(raw) as Practitioner;

      await refreshUserData();

      if (registered?.is_complete === true) {
        window.location.assign(`/${locale}/subscription`);
        return;
      }

      const ready = await waitForPractitionerReady();
      if (ready) {
        window.location.assign(`/${locale}/subscription`);
        return;
      }

      window.location.assign(`/${locale}/subscription`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { code?: string; message?: string; details?: { fieldErrors?: Record<string, string[]> } } } } };
      const errBody = axiosErr?.response?.data?.error;
      if (errBody?.code === 'validation_error' && errBody.details?.fieldErrors) {
        const fields = errBody.details.fieldErrors;
        const msgs = Object.entries(fields)
          .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
          .join(' | ');
        setError(msgs || t('registrationBackendError'));
      } else {
        setError(errBody?.message || t('registrationBackendError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStepError = stepErrors[step] || '';

  const ArrowNext = rtl ? ArrowLeft : ArrowRight;
  const ArrowPrev = rtl ? ArrowRight : ArrowLeft;

  return (
    <div>
      {authLoading && !user ? (
        <div className="flex items-center justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : null}

      <div className={rtl ? 'flex items-center justify-end mb-2' : 'flex items-center justify-start mb-2'}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          onClick={signOut}
          loading={loggingOut}
          aria-label={`${t('backToLanding')} (${t('logout')})`}
        >
          {rtl ? (
            <>
              <span>{t('backToLanding')}</span>
              <LogOut className="h-4 w-4" />
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              <span>{t('backToLanding')}</span>
            </>
          )}
        </Button>
      </div>

      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">{t('completeProfileTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('completeProfileSubtitle')}</p>
      </div>

      <StepIndicator currentStep={step} steps={wizardSteps} rtl={rtl} />

      {missingFields.length > 0 && step === 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 mb-4">
          <p className="font-medium mb-1">{t('completeProfileMissingFields')}</p>
          <p className="text-amber-700">
            {missingFields.map((f) => missingFieldLabels[f] ?? f).join(', ')}
          </p>
        </div>
      )}

      {(error || currentStepError) && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {error || currentStepError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 0: Personal Information */}
        <div
          className={cn(
            'transition-all duration-300',
            step === 0 ? `block animate-in fade-in ${rtl ? 'slide-in-from-left-4' : 'slide-in-from-right-4'} duration-300` : 'hidden',
          )}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('wizardStepPersonal')}</h2>
                <p className="text-xs text-muted-foreground">{t('wizardStepPersonalDesc')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <PhoneInputIL
              id="phone"
              label={t('phone')}
              value={form.phone}
              onChange={(v) => handleChange('phone', v)}
              required
              error={phoneInvalid ? t('phoneInvalid') : undefined}
            />
          </div>
        </div>

        {/* Step 1: Professional Information */}
        <div
          className={cn(
            'transition-all duration-300',
            step === 1 ? `block animate-in fade-in ${rtl ? 'slide-in-from-left-4' : 'slide-in-from-right-4'} duration-300` : 'hidden',
          )}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('wizardStepProfessional')}</h2>
                <p className="text-xs text-muted-foreground">{t('wizardStepProfessionalDesc')}</p>
              </div>
            </div>

            <SpecialtyCombobox
              id="specialty"
              label={t('specialty')}
              value={form.specialtyId}
              onChange={(v) => handleChange('specialtyId', v)}
              required
              placeholder={t('specialty')}
            />

            <div className="grid grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Step 2: Office Location */}
        <div
          className={cn(
            'transition-all duration-300',
            step === 2 ? `block animate-in fade-in ${rtl ? 'slide-in-from-left-4' : 'slide-in-from-right-4'} duration-300` : 'hidden',
          )}
        >
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('wizardStepLocation')}</h2>
                <p className="text-xs text-muted-foreground">{t('wizardStepLocationDesc')}</p>
              </div>
            </div>

            <AddressAutocomplete
              id="addressLine"
              label={t('addressLine')}
              value={form.addressLine}
              placeholder={t('addressSelectHint')}
              required
              error={addressFieldError}
              onChange={(data: AddressResult) => {
                if (!data.city?.trim()) {
                  setAddressFieldError(t('addressMustIncludeCity'));
                  return;
                }

                setAddressFieldError(undefined);
                handleChange('addressLine', (data.address_line || '').trim());
                const sn = (data.street_number || '').trim();
                if (sn) handleChange('streetNumber', sn);
                handleChange('zipCode', data.zip_code);
                handleChange('city', data.city);
                setForm((prev) => ({
                  ...prev,
                  latitude: data.latitude,
                  longitude: data.longitude,
                }));
              }}
              onStreetPartsChange={(line, extractedNum) => {
                handleChange('addressLine', line);
                if (extractedNum) handleChange('streetNumber', extractedNum);
              }}
              onClear={() => {
                setAddressFieldError(undefined);
                handleChange('addressLine', '');
                handleChange('streetNumber', '');
                handleChange('zipCode', '');
                handleChange('city', '');
                setForm((prev) => ({ ...prev, latitude: null, longitude: null }));
              }}
            />

            <Input
              id="streetNumber"
              label={t('streetNumber')}
              value={form.streetNumber}
              onChange={(e) => handleChange('streetNumber', e.target.value)}
              required
              autoComplete="off"
              placeholder={t('streetNumberPlaceholder')}
            />

            <div className="grid grid-cols-2 gap-4">
              <CityCombobox
                id="city"
                label={t('city')}
                value={form.city}
                onChange={(v) => handleChange('city', v)}
                required
                placeholder={t('city')}
              />
              <Input
                id="zipCode"
                label={t('zipCode')}
                value={form.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                autoComplete="postal-code"
                placeholder={t('zipCode')}
              />
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="pt-6">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                className="rounded-full h-11 px-6"
                onClick={goBack}
              >
                <ArrowPrev className="h-4 w-4" />
                <span>{t('wizardBack')}</span>
              </Button>
            )}

            <div className="flex-1" />

            {step < TOTAL_STEPS - 1 ? (
              <Button
                type="button"
                className="rounded-full h-11 px-8"
                onClick={goNext}
              >
                <span>{t('wizardNext')}</span>
                <ArrowNext className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                className="rounded-full h-11 px-8"
                loading={loading}
              >
                <span>{t('saveAndContinue')}</span>
                <ArrowNext className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-muted-foreground mt-3">
            {t('wizardStepOf', { current: step + 1, total: TOTAL_STEPS })}
          </p>
        </div>
      </form>
    </div>
  );
}
