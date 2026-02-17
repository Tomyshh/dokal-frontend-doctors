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
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { Avatar } from '@/components/ui/Avatar';
import {
  CheckCircle2,
  Building2,
  Crown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Users,
  Globe,
  Phone,
} from 'lucide-react';
import api from '@/lib/api';
import type { Practitioner } from '@/types';
import type { OrganizationMember } from '@/types';
import { useCrmOrganization, useUpdateOrganization, useOrganizationMembers } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/components/ui/Select';
import { localeNames, type Locale } from '@/i18n/config';
import { usePathname, useRouter } from '@/i18n/routing';
import { getMyPractitionerOrNull } from '@/lib/practitioner';
import {
  changePlan,
  downgradePlan,
  BASE_PRICES_ILS,
  SEAT_PRICES_ILS,
  calculateMonthlyPriceILS,
  type PlanType,
} from '@/lib/subscription';
import GoogleCalendarSection from '@/components/settings/GoogleCalendarSection';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const tsub = useTranslations('subscription');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const { profile, subscriptionStatus, refreshSubscription } = useAuth();
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const updateSettings = useUpdateSettings();
  const updateProfile = useUpdatePractitionerProfile();
  const { data: organization, isLoading: loadingOrganization } = useCrmOrganization();
  const updateOrganization = useUpdateOrganization();
  const { data: members } = useOrganizationMembers(organization?.id);
  const [saved, setSaved] = useState(false);

  // Organization form state
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgEmail, setOrgEmail] = useState('');

  // Plan management state
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [downgradeStep, setDowngradeStep] = useState<'choose' | 'confirm'>('choose');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');

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

  // Derive current plan from subscription
  const currentPlan: PlanType = (subscriptionStatus?.subscription?.plan as PlanType) || 'individual';
  const isClinic = currentPlan === 'clinic';
  const isEnterprise = currentPlan === 'enterprise';
  const isIndividual = currentPlan === 'individual';
  const isTrial = subscriptionStatus?.trial?.isActive && !subscriptionStatus?.subscription;
  const isTrialing = subscriptionStatus?.subscription?.status === 'trialing';

  // Seat counts
  const practitionerSeats = subscriptionStatus?.subscription?.practitioner_seats ?? 1;
  const secretarySeats = subscriptionStatus?.subscription?.secretary_seats ?? 0;
  const totalMonthly = calculateMonthlyPriceILS(currentPlan, practitionerSeats, secretarySeats);

  // Get practitioner members only (for downgrade selection)
  const practitionerMembers = members?.filter(
    (m) => m.staff_type === 'practitioner' && m.is_active !== false
  ) || [];

  const secretaryMembers = members?.filter(
    (m) => m.staff_type === 'secretary' && m.is_active !== false
  ) || [];

  // Pre-select the current owner for downgrade
  useEffect(() => {
    if (practitionerMembers.length > 0 && !selectedPractitionerId) {
      const owner = practitionerMembers.find((m) => m.role === 'owner');
      if (owner?.practitioner?.id) {
        setSelectedPractitionerId(owner.practitioner.id);
      } else if (practitionerMembers[0]?.practitioner?.id) {
        setSelectedPractitionerId(practitionerMembers[0].practitioner.id);
      }
    }
  }, [practitionerMembers, selectedPractitionerId]);

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

  // ─── Upgrade Handler ──────────────────────────────────────────────
  const handleUpgrade = async () => {
    setPlanError('');
    setPlanLoading(true);
    try {
      await changePlan('clinic');
      await refreshSubscription();
      setUpgradeDialogOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setPlanError(axiosError?.response?.data?.error?.message || tsub('genericError'));
    } finally {
      setPlanLoading(false);
    }
  };

  // ─── Downgrade Handler ────────────────────────────────────────────
  const handleDowngrade = async () => {
    if (!selectedPractitionerId) return;
    setPlanError('');
    setPlanLoading(true);
    try {
      await downgradePlan(selectedPractitionerId);
      await refreshSubscription();
      setDowngradeDialogOpen(false);
      window.location.reload();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setPlanError(axiosError?.response?.data?.error?.message || tsub('genericError'));
    } finally {
      setPlanLoading(false);
    }
  };

  const openDowngradeDialog = () => {
    setDowngradeStep('choose');
    setPlanError('');
    setDowngradeDialogOpen(true);
  };

  // Members that will be deactivated (all except selected practitioner)
  const deactivatedMembers = members?.filter(
    (m) => m.practitioner?.id !== selectedPractitionerId && m.is_active !== false
  ) || [];

  const getSpecialtyLabel = (member: OrganizationMember) => {
    if (!member.practitioner?.specialty) return null;
    const spec = member.practitioner.specialty;
    if (locale === 'fr' && spec.name_fr) return spec.name_fr;
    if (locale === 'he' && spec.name_he) return spec.name_he;
    return spec.name;
  };

  // ─── Plan icon ─────────────────────────────────────────────────────
  const getPlanIcon = () => {
    if (isEnterprise) return <Globe className="h-6 w-6 text-primary" />;
    if (isClinic) return <Building2 className="h-6 w-6 text-primary" />;
    return <Users className="h-6 w-6 text-gray-500" />;
  };

  const getPlanBadge = () => {
    if (isEnterprise) return tsub('multiSite');
    if (isClinic) return tsub('unlimitedTeam');
    return tsub('onePractitioner');
  };

  if (loadingPractitioner || loadingSettings || loadingOrganization) return <Spinner size="lg" />;

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

      {/* My Plan Section */}
      <Card id="plan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {t('myPlan')}
          </CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isClinic || isEnterprise ? 'bg-primary/10' : 'bg-gray-100'
              }`}>
                {getPlanIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {isEnterprise ? tsub('planEnterprise') : isClinic ? tsub('planClinic') : tsub('planIndividual')}
                  </span>
                  <Badge className={isClinic || isEnterprise ? 'bg-primary/10 text-primary text-xs' : 'bg-gray-100 text-gray-600 text-xs'}>
                    {getPlanBadge()}
                  </Badge>
                  {(isTrial || isTrialing) && (
                    <Badge className="bg-amber-100 text-amber-800 text-xs">
                      {tsub('trialBadge')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {(isTrial || isTrialing)
                    ? tsub('trialBannerText', { days: subscriptionStatus?.trial?.daysRemaining ?? 0 })
                    : `${totalMonthly} ₪/${tsub('perMonth')}`
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Seat breakdown for clinic/enterprise */}
          {(isClinic || isEnterprise) && !isTrial && !isTrialing && (
            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{tsub('basePlan')}</span>
                <span className="font-medium">{BASE_PRICES_ILS[currentPlan]} ₪</span>
              </div>
              {isClinic && practitionerSeats > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {practitionerSeats - 1} {tsub('extraPractitioners')}
                  </span>
                  <span className="font-medium">
                    {(practitionerSeats - 1) * SEAT_PRICES_ILS.practitioner} ₪
                  </span>
                </div>
              )}
              {isClinic && secretarySeats > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {secretarySeats} {tsub('secretaries')}
                  </span>
                  <span className="font-medium">
                    {secretarySeats * SEAT_PRICES_ILS.secretary} ₪
                  </span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-gray-900">{tsub('totalMonthlyCost')}</span>
                <span className="text-primary">{totalMonthly} ₪/{tsub('perMonth')}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {t('myPlanDescription')}
          </p>

          {/* Upgrade / Downgrade buttons */}
          {!isTrial && !isTrialing && (
            <div className="flex gap-3 pt-2">
              {isIndividual && (
                <Button
                  onClick={() => { setUpgradeDialogOpen(true); setPlanError(''); }}
                  className="gap-2"
                >
                  <ArrowUp className="h-4 w-4" />
                  {tsub('upgradeToClinic')}
                </Button>
              )}
              {isClinic && (
                <>
                  <Button
                    variant="ghost"
                    onClick={openDowngradeDialog}
                    className="gap-2 text-gray-500 hover:text-red-600"
                  >
                    <ArrowDown className="h-4 w-4" />
                    {tsub('downgradeToIndividual')}
                  </Button>
                </>
              )}
              {isEnterprise && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tsub('enterprisePlan')}</p>
                    <p className="text-xs text-muted-foreground">{tsub('contactSalesDesc')}</p>
                  </div>
                  <a
                    href="mailto:contact@dokal.co.il"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 shrink-0"
                  >
                    <Phone className="h-3 w-3" />
                    {tsub('contactSales')}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

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
            <Button onClick={handleSaveOrganization} loading={updateOrganization.isPending}>
              {tc('save')}
            </Button>
          </div>
        </Card>
      )}

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

      {/* Google Calendar Integration */}
      <GoogleCalendarSection />

      {/* ─── Upgrade Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        title={tsub('upgradeConfirmTitle')}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold text-gray-900">{tsub('planClinic')}</span>
              <Badge className="bg-primary/10 text-primary text-xs">{BASE_PRICES_ILS.clinic} ₪/{tsub('perMonth')}</Badge>
            </div>
            <p className="text-sm text-gray-600">{tsub('upgradeConfirmText')}</p>
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>+ {SEAT_PRICES_ILS.practitioner} ₪/{tsub('perPractitioner')}</p>
              <p>+ {SEAT_PRICES_ILS.secretary} ₪/{tsub('perSecretary')}</p>
              <p className="text-primary/70">{tsub('basePriceIncludes')}</p>
            </div>
          </div>

          {planError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {planError}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setUpgradeDialogOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleUpgrade} loading={planLoading}>
              <ArrowUp className="h-4 w-4" />
              {tc('confirm')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ─── Downgrade Dialog (2 steps) ─────────────────────────────────── */}
      <Dialog
        open={downgradeDialogOpen}
        onClose={() => setDowngradeDialogOpen(false)}
        title={downgradeStep === 'choose' ? tsub('downgradeChoosePractitioner') : tsub('downgradeWarningTitle')}
        className="max-w-xl"
      >
        {downgradeStep === 'choose' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{tsub('downgradeChooseDescription')}</p>

            {/* Practitioner list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {practitionerMembers.map((member) => {
                const practId = member.practitioner?.id;
                if (!practId) return null;
                const isSelected = selectedPractitionerId === practId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedPractitionerId(practId)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all border-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-primary' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                    <Avatar
                      src={member.profiles?.avatar_url}
                      firstName={member.profiles?.first_name}
                      lastName={member.profiles?.last_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </p>
                      {member.practitioner?.specialty && (
                        <p className="text-xs text-muted-foreground">{getSpecialtyLabel(member)}</p>
                      )}
                    </div>
                    {member.role === 'owner' && (
                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        {t('organizationOwner')}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {planError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {planError}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDowngradeDialogOpen(false)}>
                {tc('cancel')}
              </Button>
              <Button
                onClick={() => setDowngradeStep('confirm')}
                disabled={!selectedPractitionerId}
              >
                {tc('next')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Warning banner */}
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">{tsub('downgradeWarningTitle')}</span>
              </div>
              <p className="text-sm text-red-600">{tsub('downgradeWarningText')}</p>
            </div>

            {/* Practitioner kept */}
            {practitionerMembers.filter((m) => m.practitioner?.id === selectedPractitionerId).map((member) => (
              <div key={member.id} className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <Avatar
                  src={member.profiles?.avatar_url}
                  firstName={member.profiles?.first_name}
                  lastName={member.profiles?.last_name}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {member.profiles?.first_name} {member.profiles?.last_name}
                  </p>
                  <p className="text-xs text-green-700">{tsub('downgradeKeepLabel')}</p>
                </div>
              </div>
            ))}

            {/* Members to be deactivated */}
            {deactivatedMembers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-2">{tsub('downgradeDeactivatedLabel')}</p>
                <div className="space-y-1">
                  {deactivatedMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 rounded-lg bg-red-50/50 p-2">
                      <Avatar
                        src={member.profiles?.avatar_url}
                        firstName={member.profiles?.first_name}
                        lastName={member.profiles?.last_name}
                        size="xs"
                      />
                      <span className="text-sm text-gray-700">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </span>
                      <Badge className="bg-red-100 text-red-700 text-[10px]">
                        {tsub('downgradeWarningMembers')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-sm text-gray-600">
                {tsub('planIndividual')} — {BASE_PRICES_ILS.individual} ₪/{tsub('perMonth')}
              </p>
            </div>

            {planError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {planError}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDowngradeStep('choose')}>
                {tc('back')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDowngrade}
                loading={planLoading}
              >
                <ArrowDown className="h-4 w-4" />
                {tsub('downgradeToIndividual')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
