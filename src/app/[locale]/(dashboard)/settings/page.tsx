'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
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
  Settings2,
  Globe,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrmOrganization, useUpdateOrganization } from '@/hooks/useOrganization';
import { Select } from '@/components/ui/Select';
import { localeNames, type Locale } from '@/i18n/config';
import { usePathname, useRouter } from '@/i18n/routing';
import { usePractitionerProfile } from '@/providers/PractitionerProfileProvider';
import { useToast } from '@/providers/ToastProvider';
import { useManualGoogleCalendarSync } from '@/hooks/useGoogleCalendarIntegration';

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
  const { data: organization, isLoading: loadingOrganization } = useCrmOrganization();
  const updateOrganization = useUpdateOrganization();
  const [saved, setSaved] = useState(false);

  const isSecretary = profile?.role === 'secretary';

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const searchParams = useSearchParams();
  const syncMutation = useManualGoogleCalendarSync();
  const initialSyncTriggered = useRef(false);

  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgEmail, setOrgEmail] = useState('');

  useEffect(() => {
    if (searchParams.get('googleCalendar') === 'connected' && !initialSyncTriggered.current) {
      initialSyncTriggered.current = true;
      syncMutation.mutateAsync()
        .then(() => {
          toast.success(
            'Google Calendar Synchronisée',
            'Votre calendrier est maintenant synchronisé avec Google Calendar'
          );
        })
        .catch(() => {
          toast.error(
            tc('saveErrorTitle'),
            'La synchronisation initiale a échoué'
          );
        })
        .finally(() => {
          router.replace(pathname, { locale });
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  if (loadingSettings || loadingOrganization) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{t('generalSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {t('saved')}
            </div>
          )}
          {practitionerProfile && !isSecretary && (
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

      <div className="grid gap-6 sm:grid-cols-2">
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
  );
}
