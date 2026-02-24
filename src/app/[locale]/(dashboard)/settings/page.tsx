'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings, useUpdateSettings, useUpdatePractitionerProfile } from '@/hooks/useSettings';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import {
  CheckCircle2,
  Building2,
  Sparkles,
  Settings2,
  Globe,
  Bell,
  User,
  FileText,
  Phone,
  MapPin,
  Banknote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrmOrganization, useUpdateOrganization } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/Select';
import { localeNames, type Locale } from '@/i18n/config';
import { usePathname, useRouter } from '@/i18n/routing';
import { getMyPractitionerOrNull } from '@/lib/practitioner';
import { usePractitionerProfile } from '@/providers/PractitionerProfileProvider';
import ProfileCompletionCard from '@/components/settings/ProfileCompletionCard';
import GoogleCalendarSection from '@/components/settings/GoogleCalendarSection';
import AvatarUploadSection from '@/components/settings/AvatarUploadSection';
import { LanguagesCombobox } from '@/components/settings/LanguagesCombobox';
import { AddressAutocomplete, type AddressResult } from '@/components/auth/AddressAutocomplete';
import { SpecialtyCombobox } from '@/components/auth/SpecialtyCombobox';
import { useGenerateAboutWithAI, useGenerateEducationWithAI } from '@/hooks/useSettings';
import { useToast } from '@/providers/ToastProvider';

function SectionHeader({ icon: Icon, title, subtitle, badge }: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          {badge && (
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();
  const toast = useToast();
  const practitionerProfile = usePractitionerProfile();
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdatePractitionerProfile();
  const { data: organization, isLoading: loadingOrganization } = useCrmOrganization();
  const updateOrganization = useUpdateOrganization();
  const generateAbout = useGenerateAboutWithAI();
  const generateEducation = useGenerateEducationWithAI();
  const [saved, setSaved] = useState(false);

  // Organization form state
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgEmail, setOrgEmail] = useState('');

  // Fetch practitioner profile
  const { data: practitioner, isLoading: loadingPractitioner } = useQuery({
    queryKey: ['practitioner-profile'],
    queryFn: async () => {
      return await getMyPractitionerOrNull();
    },
    enabled: !!profile?.id,
  });

  // Form state
  const [about, setAbout] = useState('');
  const [education, setEducation] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [teudatZehut, setTeudatZehut] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [acceptingPatients, setAcceptingPatients] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [priceMinShekels, setPriceMinShekels] = useState('');
  const [priceMaxShekels, setPriceMaxShekels] = useState('');
  const [consultationDurationMinutes, setConsultationDurationMinutes] = useState(30);
  const pricingIncomplete = practitioner?.price_min_agorot == null || practitioner?.price_max_agorot == null;

  const isSectionComplete = (section: string) => {
    if (!practitionerProfile?.completionItems) return true;
    return practitionerProfile.completionItems
      .filter(item => item.section === section)
      .every(item => item.completed);
  };

  // Populate form
  useEffect(() => {
    if (practitioner) {
      setAbout(practitioner.about || '');
      setEducation(practitioner.education || '');
      setLanguages(practitioner.languages ?? []);
      setPhone(practitioner.phone || '');
      setEmail(practitioner.email || '');
      setSpecialtyId(practitioner.specialty_id || '');
      setAddressLine(practitioner.address_line || '');
      setZipCode(practitioner.zip_code || '');
      setCity(practitioner.city || '');
      setLatitude(practitioner.latitude ?? null);
      setLongitude(practitioner.longitude ?? null);
      setAcceptingPatients(practitioner.is_accepting_new_patients);
      setPriceMinShekels(
        practitioner.price_min_agorot != null ? String(Math.round(practitioner.price_min_agorot / 100)) : ''
      );
      setPriceMaxShekels(
        practitioner.price_max_agorot != null ? String(Math.round(practitioner.price_max_agorot / 100)) : ''
      );
      setConsultationDurationMinutes(practitioner.consultation_duration_minutes ?? 30);
    }
  }, [practitioner]);

  useEffect(() => {
    if (settings) {
      setNotificationsEnabled(settings.notifications_enabled);
      setRemindersEnabled(settings.reminders_enabled);
    }
  }, [settings]);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || '');
      setOrgDescription(organization.description || '');
      setOrgWebsite(organization.website || '');
      setOrgPhone(organization.phone || '');
      setOrgEmail(organization.email || '');
    }
  }, [organization]);

  const handleSaveProfile = async () => {
    const tz = teudatZehut.trim();
    if (tz && !/^\d{9}$/.test(tz)) {
      toast.error(t('teudatZehutInvalidTitle'), t('teudatZehutInvalid'));
      return;
    }
    const minVal = priceMinShekels.trim() ? Math.round(parseFloat(priceMinShekels) * 100) : null;
    const maxVal = priceMaxShekels.trim() ? Math.round(parseFloat(priceMaxShekels) * 100) : null;
    if (minVal != null && maxVal != null && minVal > maxVal) {
      toast.error(t('priceRangeInvalidTitle'), t('priceRangeInvalid'));
      return;
    }
    const duration = consultationDurationMinutes;
    if (duration < 5 || duration > 240) {
      toast.error(t('consultationDurationInvalidTitle'), t('consultationDurationInvalid'));
      return;
    }
    try {
      const payload: Parameters<typeof updateProfile.mutateAsync>[0] = {
        about: about || null,
        education: education || null,
        languages: languages.length > 0 ? languages : null,
        phone: phone || null,
        email: email || null,
        address_line: addressLine || null,
        zip_code: zipCode || null,
        city: city || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        is_accepting_new_patients: acceptingPatients,
        price_min_agorot: minVal,
        price_max_agorot: maxVal,
        consultation_duration_minutes: duration,
      };
      if (specialtyId) payload.specialty_id = specialtyId;
      if (tz) payload.teudat_zehut = tz;

      await updateProfile.mutateAsync(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setTeudatZehut('');
      toast.success(t('saved'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(tc('saveErrorTitle'), msg || tc('saveError'));
    }
  };

  const handleSaveOrganization = async () => {
    if (!organization) return;
    try {
      await updateOrganization.mutateAsync({
        id: organization.id,
        data: {
          name: orgName || undefined,
          description: orgDescription || null,
          website: orgWebsite || null,
          phone: orgPhone || null,
          email: orgEmail || null,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success(t('saved'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(tc('saveErrorTitle'), msg || tc('saveError'));
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        notifications_enabled: notificationsEnabled,
        reminders_enabled: remindersEnabled,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success(t('saved'));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(tc('saveErrorTitle'), msg || tc('saveError'));
    }
  };

  const switchLocale = async (newLocale: Locale) => {
    try {
      await updateSettings.mutateAsync({ locale: newLocale });
    } catch {
      toast.error(tc('saveErrorTitle'), tc('saveError'));
    }
    router.replace(pathname, { locale: newLocale });
  };

  const handleImproveAbout = async () => {
    try {
      const generated = await generateAbout.mutateAsync(about || undefined);
      setAbout(generated);
      toast.success(t('aiImproveSuccess'));
    } catch {
      toast.error(t('aiImproveErrorTitle'), t('aiImproveError'));
    }
  };

  const scrollToSection = (section: 'avatar' | 'about' | 'contact' | 'address' | 'consultation' | 'pricing') => {
    const el = document.getElementById(`profile-section-${section}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImproveEducation = async () => {
    try {
      const generated = await generateEducation.mutateAsync(education || undefined);
      setEducation(generated);
      toast.success(t('aiImproveSuccess'));
    } catch {
      toast.error(t('aiImproveErrorTitle'), t('aiImproveError'));
    }
  };

  if (loadingPractitioner || loadingSettings || loadingOrganization) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6" aria-label="Chargement">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-4 w-80 rounded-md" />
          </div>
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('language')}, {t('notifications')}, {t('profile')}…
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {t('saved')}
            </div>
          )}
          {practitionerProfile && (
            <div className="flex items-center gap-2.5 rounded-full bg-primary/5 border border-primary/15 px-4 py-2">
              <div className="relative h-7 w-7">
                <svg className="h-7 w-7 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary/15" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary transition-all duration-700 ease-out" strokeDasharray={`${practitionerProfile.completionPercent * 0.94} 94`} />
                </svg>
              </div>
              <span className="text-sm font-bold text-primary tabular-nums">{practitionerProfile.completionPercent}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Profile completion banner - full width */}
      {practitionerProfile && practitionerProfile.completionPercent < 100 && (
        <ProfileCompletionCard
          completionPercent={practitionerProfile.completionPercent}
          completionItems={practitionerProfile.completionItems}
          onScrollToSection={scrollToSection}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: quick settings + integrations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Language */}
          <Card className="settings-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-4 w-4" />
                </div>
                {t('language')}
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Select
                id="interface-language"
                label={t('language')}
                value={locale}
                onChange={(e) => void switchLocale(e.target.value as Locale)}
                options={(Object.entries(localeNames) as [Locale, string][]).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <p className="text-xs text-muted-foreground">
                {t('interfaceLanguageHint')}
              </p>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="settings-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </div>
                {t('notifications')}
              </CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3">
                <span id="notif-label" className="text-sm text-gray-700">
                  {t('notificationsEnabled')}
                </span>
                <Switch
                  aria-labelledby="notif-label"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3">
                <span id="reminders-label" className="text-sm text-gray-700">
                  {t('remindersEnabled')}
                </span>
                <Switch
                  aria-labelledby="reminders-label"
                  checked={remindersEnabled}
                  onCheckedChange={setRemindersEnabled}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} loading={updateSettings.isPending}>
                  {tc('save')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Google Calendar */}
          <GoogleCalendarSection />
        </div>

        {/* Right column: profile sections + organization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Photo & Identity */}
          <Card className={cn('settings-section', !isSectionComplete('avatar') && 'border-l-4 border-l-amber-400')} id="profile-section-avatar">
            <SectionHeader
              icon={User}
              title={t('avatarTitle')}
              badge={!isSectionComplete('avatar') ? t('toCompleteBadge') : undefined}
            />
            <AvatarUploadSection
              avatarUrl={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
            />
            <div className="mt-5">
              <SpecialtyCombobox
                id="specialty"
                label={t('specialty')}
                value={specialtyId}
                onChange={setSpecialtyId}
                placeholder={t('specialtyPlaceholder')}
              />
            </div>
          </Card>

          {/* Section 2: About & Education */}
          <Card className={cn('settings-section', !isSectionComplete('about') && 'border-l-4 border-l-amber-400')} id="profile-section-about">
            <SectionHeader
              icon={FileText}
              title={t('about')}
              subtitle={t('aboutHint')}
              badge={!isSectionComplete('about') ? t('toCompleteBadge') : undefined}
            />
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  label={t('about')}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  placeholder={t('aboutHint')}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImproveAbout}
                    loading={generateAbout.isPending}
                    disabled={generateAbout.isPending}
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('aiImprove')}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Input
                  label={t('education')}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder={t('educationHint')}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImproveEducation}
                    loading={generateEducation.isPending}
                    disabled={generateEducation.isPending}
                  >
                    <Sparkles className="h-4 w-4" />
                    {t('aiImprove')}
                  </Button>
                </div>
              </div>
              <LanguagesCombobox
                id="languages"
                label={t('languages')}
                value={languages}
                onChange={setLanguages}
                placeholder={t('languagesPlaceholder')}
              />
            </div>
          </Card>

          {/* Section 3: Contact */}
          <Card className={cn('settings-section', !isSectionComplete('contact') && 'border-l-4 border-l-amber-400')} id="profile-section-contact">
            <SectionHeader
              icon={Phone}
              title={t('contactInfo')}
              badge={!isSectionComplete('contact') ? t('toCompleteBadge') : undefined}
            />
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={tc('phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label={tc('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Input
                  label={t('teudatZehut')}
                  value={teudatZehut}
                  onChange={(e) => setTeudatZehut(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={practitioner?.teudat_zehut_masked || '000000000'}
                />
                <p className="text-xs text-muted-foreground">{t('teudatZehutHint')}</p>
                {practitioner?.has_teudat_zehut && (
                  <p className="text-xs text-muted-foreground">
                    {t('teudatZehutCurrent')}: <span className="font-medium text-gray-900">{practitioner.teudat_zehut_masked || '•••••••••'}</span>
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Section 4: Address */}
          <Card className={cn('settings-section', !isSectionComplete('address') && 'border-l-4 border-l-amber-400')} id="profile-section-address">
            <SectionHeader
              icon={MapPin}
              title={t('address')}
              badge={!isSectionComplete('address') ? t('toCompleteBadge') : undefined}
            />
            <div className="space-y-3">
              <AddressAutocomplete
                id="addressLine"
                label={t('addressLine')}
                value={addressLine}
                placeholder={t('addressSelectHint')}
                onChange={(data: AddressResult) => {
                  setAddressLine(data.address_line);
                  setZipCode(data.zip_code);
                  setCity(data.city);
                  setLatitude(data.latitude);
                  setLongitude(data.longitude);
                }}
                onClear={() => {
                  setAddressLine('');
                  setZipCode('');
                  setCity('');
                  setLatitude(null);
                  setLongitude(null);
                }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t('zipCode')} value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                <Input label={t('city')} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Section 5: Consultation & Pricing */}
          <Card className={cn('settings-section', !isSectionComplete('pricing') && 'border-l-4 border-l-amber-400')} id="profile-section-consultation">
            <SectionHeader
              icon={Banknote}
              title={t('consultationDuration')}
              badge={!isSectionComplete('pricing') ? t('toCompleteBadge') : undefined}
            />
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{t('consultationDurationHint')}</p>
                <Input
                  label={t('consultationDurationMinutes')}
                  type="number"
                  min={5}
                  max={240}
                  value={consultationDurationMinutes}
                  onChange={(e) => setConsultationDurationMinutes(Number(e.target.value) || 30)}
                  placeholder="30"
                />
              </div>

              <div className="h-px bg-border/50" />

              <div className="space-y-3" id="profile-section-pricing">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-gray-700">{t('priceRange')}</h4>
                  {pricingIncomplete && (
                    <Badge className="bg-amber-100 text-amber-900 text-xs">
                      {t('toCompleteBadge')}
                    </Badge>
                  )}
                </div>
                {pricingIncomplete && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    <p className="font-medium">{t('pricingRequiredTitle')}</p>
                    <p className="text-xs text-amber-700 mt-1">{t('pricingRequiredDesc')}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{t('priceRangeHint')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('priceMin')}
                    type="number"
                    min={0}
                    step={1}
                    value={priceMinShekels}
                    onChange={(e) => setPriceMinShekels(e.target.value)}
                    placeholder="150"
                  />
                  <Input
                    label={t('priceMax')}
                    type="number"
                    min={0}
                    step={1}
                    value={priceMaxShekels}
                    onChange={(e) => setPriceMaxShekels(e.target.value)}
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/40 px-4 py-3">
                <span id="accepting-label" className="text-sm text-gray-700">
                  {t('acceptingPatients')}
                </span>
                <Switch
                  aria-labelledby="accepting-label"
                  checked={acceptingPatients}
                  onCheckedChange={setAcceptingPatients}
                />
              </div>
            </div>
          </Card>

          {/* Sticky save bar */}
          <div className="sticky bottom-4 z-10">
            <div className="rounded-2xl border border-border/80 bg-white/95 backdrop-blur-md shadow-lg px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-gray-600 truncate">{t('profile')}</span>
              </div>
              <Button onClick={handleSaveProfile} loading={updateProfile.isPending} className="shrink-0 shadow-sm">
                {tc('save')}
              </Button>
            </div>
          </div>

          {/* Organization */}
          {organization && (
            <Card className="settings-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>
                  {t('organization')}
                </CardTitle>
                <Badge className="bg-primary/10 text-primary text-xs">
                  {organization.type === 'enterprise'
                    ? t('organizationTypeEnterprise')
                    : organization.type === 'clinic'
                      ? t('organizationTypeClinic')
                      : t('organizationTypeIndividual')}
                </Badge>
              </CardHeader>
              <div className="space-y-4">
                <Input
                  label={t('organizationName')}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
                <Textarea
                  label={t('organizationDescription')}
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  rows={3}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label={tc('phone')} type="tel" value={orgPhone} onChange={(e) => setOrgPhone(e.target.value)} />
                  <Input label={tc('email')} type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} />
                </div>
                <Input
                  label={t('organizationWebsite')}
                  value={orgWebsite}
                  onChange={(e) => setOrgWebsite(e.target.value)}
                  placeholder="https://"
                />
                {organization.license_number && (
                  <div className="text-sm text-muted-foreground">
                    {t('organizationLicense')}: <span className="font-medium text-gray-900">{organization.license_number}</span>
                  </div>
                )}
                <div className="flex items-center justify-end pt-1">
                  <Button onClick={handleSaveOrganization} loading={updateOrganization.isPending}>
                    {tc('save')}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
