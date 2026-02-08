'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings, useUpdateSettings, useUpdatePractitionerProfile } from '@/hooks/useSettings';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import type { Practitioner } from '@/types';
import { useQuery } from '@tanstack/react-query';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { profile } = useAuth();
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdatePractitionerProfile();
  const [saved, setSaved] = useState(false);

  // Fetch practitioner profile
  const { data: practitioner, isLoading: loadingPractitioner } = useQuery({
    queryKey: ['practitioner-profile'],
    queryFn: async () => {
      const { data } = await api.get<Practitioner>(`/practitioners/${profile?.id}`);
      return data;
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

  const handleSaveSettings = async () => {
    await updateSettings.mutateAsync({
      notifications_enabled: notificationsEnabled,
      reminders_enabled: remindersEnabled,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loadingPractitioner || loadingSettings) return <Spinner size="lg" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            {t('saved')}
          </div>
        )}
      </div>

      {/* Practitioner Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile')}</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <Textarea label={t('about')} value={about} onChange={(e) => setAbout(e.target.value)} rows={4} />
          <Input label={t('education')} value={education} onChange={(e) => setEducation(e.target.value)} />
          <Input
            label={t('languages')}
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            placeholder={t('languagesPlaceholder')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={tc('phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label={tc('email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="pt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('address')}</h3>
            <div className="space-y-3">
              <Input label={t('addressLine')} value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('zipCode')} value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                <Input label={t('city')} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="accepting"
              checked={acceptingPatients}
              onChange={(e) => setAcceptingPatients(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <label htmlFor="accepting" className="text-sm text-gray-700">{t('acceptingPatients')}</label>
          </div>

          <Button onClick={handleSaveProfile} loading={updateProfile.isPending}>
            {tc('save')}
          </Button>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('notifications')}</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notif"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <label htmlFor="notif" className="text-sm text-gray-700">{t('notificationsEnabled')}</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="reminders"
              checked={remindersEnabled}
              onChange={(e) => setRemindersEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <label htmlFor="reminders" className="text-sm text-gray-700">{t('remindersEnabled')}</label>
          </div>
          <Button onClick={handleSaveSettings} loading={updateSettings.isPending}>
            {tc('save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
