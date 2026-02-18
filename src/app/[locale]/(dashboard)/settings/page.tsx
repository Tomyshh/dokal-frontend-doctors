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
} from 'lucide-react';
import { useCrmOrganization, useUpdateOrganization } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/Select';
import { localeNames, type Locale } from '@/i18n/config';
import { usePathname, useRouter } from '@/i18n/routing';
import { getMyPractitionerOrNull } from '@/lib/practitioner';
import GoogleCalendarSection from '@/components/settings/GoogleCalendarSection';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdatePractitionerProfile();
  const { data: organization, isLoading: loadingOrganization } = useCrmOrganization();
  const updateOrganization = useUpdateOrganization();
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
  const [languages, setLanguages] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [acceptingPatients, setAcceptingPatients] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Populate form
  useEffect(() => {
    if (practitioner) {
      setAbout(practitioner.about || '');
      setEducation(practitioner.education || '');
      setLanguages(practitioner.languages?.join(', ') || '');
      setPhone(practitioner.phone || '');
      setEmail(practitioner.email || '');
      setAddressLine(practitioner.address_line || '');
      setZipCode(practitioner.zip_code || '');
      setCity(practitioner.city || '');
      setAcceptingPatients(practitioner.is_accepting_new_patients);
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
    await updateProfile.mutateAsync({
      about: about || null,
      education: education || null,
      languages: languages ? languages.split(',').map((l) => l.trim()) : null,
      phone: phone || null,
      email: email || null,
      address_line: addressLine || null,
      zip_code: zipCode || null,
      city: city || null,
      is_accepting_new_patients: acceptingPatients,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveOrganization = async () => {
    if (!organization) return;
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
  };

  const handleSaveSettings = async () => {
    await updateSettings.mutateAsync({
      notifications_enabled: notificationsEnabled,
      reminders_enabled: remindersEnabled,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const switchLocale = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('language')}, {t('notifications')}, {t('profile')}…
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            {t('saved')}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Colonne gauche: réglages rapides + intégrations */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interface */}
          <Card>
            <CardHeader>
              <CardTitle>{t('language')}</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Select
                id="interface-language"
                label={t('language')}
                value={locale}
                onChange={(e) => switchLocale(e.target.value as Locale)}
                options={(Object.entries(localeNames) as [Locale, string][]).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <p className="text-xs text-muted-foreground">
                {t('languagesPlaceholder')}
              </p>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications')}</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span id="notif-label" className="text-sm text-gray-700">
                  {t('notificationsEnabled')}
                </span>
                <Switch
                  aria-labelledby="notif-label"
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span id="reminders-label" className="text-sm text-gray-700">
                  {t('remindersEnabled')}
                </span>
                <Switch
                  aria-labelledby="reminders-label"
                  checked={remindersEnabled}
                  onCheckedChange={setRemindersEnabled}
                />
              </div>
              <Button onClick={handleSaveSettings} loading={updateSettings.isPending}>
                {tc('save')}
              </Button>
            </div>
          </Card>

          {/* Google Calendar Integration */}
          <GoogleCalendarSection />
        </div>

        {/* Colonne droite: profil + organisation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Practitioner Profile */}
          <Card>
            <CardHeader>
              <CardTitle>{t('profile')}</CardTitle>
            </CardHeader>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <Textarea label={t('about')} value={about} onChange={(e) => setAbout(e.target.value)} rows={4} />
                <Input label={t('education')} value={education} onChange={(e) => setEducation(e.target.value)} />
                <Input
                  label={t('languages')}
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder={t('languagesPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={tc('phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Input label={tc('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="pt-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('address')}</h3>
                <div className="space-y-3">
                  <Input label={t('addressLine')} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('zipCode')} value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                    <Input label={t('city')} value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <span id="accepting-label" className="text-sm text-gray-700">
                  {t('acceptingPatients')}
                </span>
                <Switch
                  aria-labelledby="accepting-label"
                  checked={acceptingPatients}
                  onCheckedChange={setAcceptingPatients}
                />
              </div>

              <div className="flex items-center justify-end pt-1">
                <Button onClick={handleSaveProfile} loading={updateProfile.isPending}>
                  {tc('save')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Organization */}
          {organization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
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
