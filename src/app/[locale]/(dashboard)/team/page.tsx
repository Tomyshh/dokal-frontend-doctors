'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { SpecialtyCombobox } from '@/components/auth/SpecialtyCombobox';
import { PhoneInputIL, normalizeIsraelPhoneToE164 } from '@/components/auth/PhoneInputIL';
import {
  useCrmOrganization,
  useOrganizationMembers,
  useInviteMember,
  useRemoveOrganizationMember,
  useUpdateOrganizationMember,
  useUpdatePractitionerLicenses,
} from '@/hooks/useOrganization';
import { useAuth } from '@/providers/AuthProvider';
import type { InviteMemberRequest } from '@/types/api';
import type { OrganizationMember } from '@/types';
import { useRouter } from '@/i18n/routing';
import {
  SEAT_PRICES_ILS,
  BASE_PRICES_ILS,
  calculateMonthlyPriceILS,
} from '@/lib/subscription';
import {
  UserPlus,
  Users,
  Stethoscope,
  ClipboardPen,
  Trash2,
  ShieldCheck,
  Crown,
  Mail,
  Building2,
  ArrowRight,
  Pencil,
  FileCheck,
  Receipt,
} from 'lucide-react';

type StaffTypeForm = 'practitioner' | 'secretary';

interface InviteForm {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  staffType: StaffTypeForm;
  orgRole: 'member' | 'admin';
  /** Specialty UUID from the backend */
  specialtyId: string;
  licenseNumber: string;
  specializationLicense: string;
  addressLine: string;
  zipCode: string;
  city: string;
}

const INITIAL_FORM: InviteForm = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  staffType: 'practitioner',
  orgRole: 'member',
  specialtyId: '',
  licenseNumber: '',
  specializationLicense: '',
  addressLine: '',
  zipCode: '',
  city: '',
};

export default function TeamPage() {
  const t = useTranslations('team');
  const tc = useTranslations('common');
  const ts = useTranslations('settings');
  const locale = useLocale();
  const { profile } = useAuth();
  const router = useRouter();
  const { data: organization, isLoading: loadingOrg } = useCrmOrganization();
  const { data: members, isLoading: loadingMembers } = useOrganizationMembers(organization?.id);
  const inviteMember = useInviteMember();
  const removeMember = useRemoveOrganizationMember();
  const updateMember = useUpdateOrganizationMember();
  const updateLicenses = useUpdatePractitionerLicenses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<InviteForm>(INITIAL_FORM);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<OrganizationMember | null>(null);

  // License editing dialog state
  const [editLicenseMember, setEditLicenseMember] = useState<OrganizationMember | null>(null);
  const [editLicenseNumber, setEditLicenseNumber] = useState('');
  const [editSpecLicense, setEditSpecLicense] = useState('');
  const [editLicenseError, setEditLicenseError] = useState('');

  // Check if current user is owner or admin
  const currentMember = members?.find((m) => m.user_id === profile?.id);
  const canManage = currentMember?.role === 'owner' || currentMember?.role === 'admin';

  const handleChange = <K extends keyof InviteForm>(key: K, value: InviteForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    setInviteError('');
    setInviteSuccess('');

    const normalizedPhone = form.phone ? normalizeIsraelPhoneToE164(form.phone) : undefined;

    let payload: InviteMemberRequest;

    if (form.staffType === 'practitioner') {
      if (!form.specialtyId) {
        setInviteError(t('specialtyInvalid'));
        return;
      }

      payload = {
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: normalizedPhone || undefined,
        staff_type: 'practitioner',
        org_role: form.orgRole,
        specialty_id: form.specialtyId,
        license_number: form.licenseNumber,
        specialization_license: form.specializationLicense || undefined,
        address_line: form.addressLine || undefined,
        zip_code: form.zipCode || undefined,
        city: form.city || undefined,
      };
    } else {
      payload = {
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone: normalizedPhone || undefined,
        staff_type: 'secretary',
        org_role: form.orgRole,
      };
    }

    try {
      const result = await inviteMember.mutateAsync({
        organizationId: organization.id,
        data: payload,
      });
      setInviteSuccess(
        result.invite_sent ? t('inviteSentSuccess') : t('memberAddedSuccess'),
      );
      setForm(INITIAL_FORM);
      setTimeout(() => {
        setDialogOpen(false);
        setInviteSuccess('');
      }, 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('inviteError');
      setInviteError(message);
    }
  };

  const handleRemoveMember = async (member: OrganizationMember) => {
    if (!organization) return;
    try {
      await removeMember.mutateAsync({
        organizationId: organization.id,
        memberId: member.id,
      });
    } catch {
      // Silently fail
    }
    setConfirmRemove(null);
  };

  const handleOpenEditLicenses = (member: OrganizationMember) => {
    setEditLicenseMember(member);
    setEditLicenseNumber(member.practitioner?.license_number ?? '');
    setEditSpecLicense(member.practitioner?.specialization_license ?? '');
    setEditLicenseError('');
  };

  const handleSaveLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !editLicenseMember?.practitioner) return;

    if (!editLicenseNumber && !editSpecLicense) {
      setEditLicenseError(t('licenseAtLeastOne'));
      return;
    }

    if (editLicenseNumber && !/^\d{1,6}$/.test(editLicenseNumber)) {
      setEditLicenseError(t('licenseNumberInvalid'));
      return;
    }
    if (editSpecLicense && !/^\d{1,6}$/.test(editSpecLicense)) {
      setEditLicenseError(t('specializationLicenseInvalid'));
      return;
    }

    try {
      await updateLicenses.mutateAsync({
        organizationId: organization.id,
        practitionerId: editLicenseMember.practitioner.id,
        data: {
          license_number: editLicenseNumber || undefined,
          specialization_license: editSpecLicense || undefined,
        },
      });
      setEditLicenseMember(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('inviteError');
      setEditLicenseError(message);
    }
  };

  const handleToggleRole = async (member: OrganizationMember) => {
    if (!organization) return;
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    try {
      await updateMember.mutateAsync({
        organizationId: organization.id,
        memberId: member.id,
        data: { role: newRole },
      });
    } catch {
      // Silently fail
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge className="bg-amber-100 text-amber-800"><Crown className="h-3 w-3 mr-1" />{ts('organizationOwner')}</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800"><ShieldCheck className="h-3 w-3 mr-1" />{ts('organizationAdmin')}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{ts('organizationMember')}</Badge>;
    }
  };

  const getStaffTypeBadge = (staffType: string) => {
    if (staffType === 'secretary') {
      return (
        <div className="flex items-center gap-1.5">
          <Badge className="bg-purple-100 text-purple-800"><ClipboardPen className="h-3 w-3 mr-1" />{t('secretary')}</Badge>
          {orgPlan === 'clinic' && (
            <Badge className="bg-gray-50 text-gray-500 text-[10px]">{SEAT_PRICES_ILS.secretary} ₪/{t('perMonth')}</Badge>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <Badge className="bg-primary/10 text-primary"><Stethoscope className="h-3 w-3 mr-1" />{t('practitioner')}</Badge>
        {orgPlan === 'clinic' && (
          <Badge className="bg-gray-50 text-gray-500 text-[10px]">{SEAT_PRICES_ILS.practitioner} ₪/{t('perMonth')}</Badge>
        )}
      </div>
    );
  };

  const getSpecialtyLabel = (member: OrganizationMember) => {
    if (!member.practitioner?.specialty) return null;
    const spec = member.practitioner.specialty;
    if (locale === 'fr' && spec.name_fr) return spec.name_fr;
    if (locale === 'he' && spec.name_he) return spec.name_he;
    return spec.name;
  };

  if (loadingOrg || loadingMembers) return <Spinner size="lg" />;

  if (!organization) {
    return <Spinner size="lg" />;
  }

  // Seat counts for cost display
  const practitionerCount = members?.filter(
    (m) => m.staff_type === 'practitioner' && m.is_active !== false
  ).length ?? 1;
  const secretaryCount = members?.filter(
    (m) => m.staff_type === 'secretary' && m.is_active !== false
  ).length ?? 0;
  const orgPlan = organization.type === 'enterprise' ? 'enterprise' as const
    : organization.type === 'clinic' ? 'clinic' as const
    : 'individual' as const;
  const totalMonthlyCost = calculateMonthlyPriceILS(orgPlan, practitionerCount, secretaryCount);

  // Show upgrade prompt for individual organizations — redirect to Settings
  if (organization.type !== 'clinic' && organization.type !== 'enterprise') {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-lg w-full text-center">
          <div className="flex flex-col items-center gap-4 p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{t('upgradeTitle')}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('upgradeDescription')}
            </p>
            <Button
              className="w-full"
              onClick={() => router.push('/settings#plan')}
            >
              {t('upgradeButton')}
              <ArrowRight className="h-4 w-4 rtl-flip-arrow" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle', { name: organization.name })}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => { setDialogOpen(true); setForm(INITIAL_FORM); setInviteError(''); setInviteSuccess(''); }}>
            <UserPlus className="h-4 w-4" />
            {t('inviteMember')}
          </Button>
        )}
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t('members')} ({members?.length ?? 0})
          </CardTitle>
        </CardHeader>

        <div className="divide-y divide-border">
          {members?.map((member) => (
            <div key={member.id} className="flex items-center gap-4 p-4">
              <Avatar
                src={member.profiles?.avatar_url}
                firstName={member.profiles?.first_name}
                lastName={member.profiles?.last_name}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">
                    {member.profiles?.first_name} {member.profiles?.last_name}
                  </p>
                  {getRoleBadge(member.role)}
                  {getStaffTypeBadge(member.staff_type)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {member.profiles?.email}
                </p>
                {member.practitioner?.specialty && (
                  <p className="text-xs text-muted-foreground">
                    {getSpecialtyLabel(member)}
                  </p>
                )}
                {member.staff_type === 'practitioner' && member.practitioner && (
                  <div className="flex items-center gap-3 mt-0.5">
                    {member.practitioner.license_number && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileCheck className="h-3 w-3" />
                        {t('licenseNumberShort')}: {member.practitioner.license_number}
                      </span>
                    )}
                    {member.practitioner.specialization_license && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileCheck className="h-3 w-3" />
                        {t('specializationLicenseShort')}: {member.practitioner.specialization_license}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {/* Actions — only for non-owners, by managers */}
              {canManage && member.role !== 'owner' && member.user_id !== profile?.id && (
                <div className="flex items-center gap-1">
                  {member.staff_type === 'practitioner' && member.practitioner && (
                    <button
                      onClick={() => handleOpenEditLicenses(member)}
                      className="rounded-lg p-2 text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title={t('editLicenses')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleRole(member)}
                    className="rounded-lg p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title={member.role === 'admin' ? t('demoteToMember') : t('promoteToAdmin')}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmRemove(member)}
                    className="rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title={t('removeMember')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {(!members || members.length === 0) && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {t('noMembers')}
            </div>
          )}
        </div>
      </Card>

      {/* Cost Recap (clinic plan) */}
      {orgPlan === 'clinic' && members && members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {t('costRecap')}
            </CardTitle>
          </CardHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('basePlan')}</span>
              <span className="font-medium">{BASE_PRICES_ILS.clinic} ₪</span>
            </div>
            {practitionerCount > 1 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {practitionerCount - 1} {t('extraPractitioners')}
                </span>
                <span className="font-medium">
                  {(practitionerCount - 1) * SEAT_PRICES_ILS.practitioner} ₪
                </span>
              </div>
            )}
            {secretaryCount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {secretaryCount} {t('secretariesLabel')}
                </span>
                <span className="font-medium">
                  {secretaryCount * SEAT_PRICES_ILS.secretary} ₪
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
              <span className="text-gray-900">{t('totalMonthly')}</span>
              <span className="text-primary">{totalMonthlyCost} ₪/{t('perMonth')}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t('inviteMember')}
        className="max-w-xl"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          {/* Staff Type Selector */}
          <Select
            id="staffType"
            label={t('staffType')}
            value={form.staffType}
            onChange={(e) => handleChange('staffType', e.target.value as StaffTypeForm)}
            options={[
              { value: 'practitioner', label: t('practitioner') },
              { value: 'secretary', label: t('secretary') },
            ]}
          />

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="invFirstName"
              label={tc('firstName')}
              value={form.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
            <Input
              id="invLastName"
              label={tc('lastName')}
              value={form.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
          </div>

          <Input
            id="invEmail"
            type="email"
            label={tc('email')}
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            placeholder="membre@example.com"
          />

          <PhoneInputIL
            id="invPhone"
            label={tc('phone')}
            value={form.phone}
            onChange={(v) => handleChange('phone', v)}
          />

          {/* Org Role */}
          <Select
            id="orgRole"
            label={t('orgRole')}
            value={form.orgRole}
            onChange={(e) => handleChange('orgRole', e.target.value as 'member' | 'admin')}
            options={[
              { value: 'member', label: ts('organizationMember') },
              { value: 'admin', label: ts('organizationAdmin') },
            ]}
          />

          {/* Practitioner-specific fields */}
          {form.staffType === 'practitioner' && (
            <>
              <SpecialtyCombobox
                id="invSpecialty"
                label={t('specialty')}
                value={form.specialtyId}
                onChange={(v) => handleChange('specialtyId', v)}
                required
                placeholder={t('specialty')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="invLicense"
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
                />
                <Input
                  id="invSpecLicense"
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
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input
                    id="invAddress"
                    label={t('addressLine')}
                    value={form.addressLine}
                    onChange={(e) => handleChange('addressLine', e.target.value)}
                    placeholder={t('addressAutoOrg')}
                  />
                </div>
                <Input
                  id="invZip"
                  label={t('zipCode')}
                  value={form.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                />
              </div>
              <Input
                id="invCity"
                label={t('city')}
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder={t('addressAutoOrg')}
              />
            </>
          )}

          {/* Error / Success */}
          {inviteError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {inviteSuccess}
            </div>
          )}

          <Button type="submit" className="w-full" loading={inviteMember.isPending}>
            <UserPlus className="h-4 w-4" />
            {t('sendInvite')}
          </Button>
        </form>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <Dialog
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title={t('confirmRemoveTitle')}
      >
        <p className="text-sm text-gray-600 mb-6">
          {t('confirmRemoveText', {
            name: `${confirmRemove?.profiles?.first_name ?? ''} ${confirmRemove?.profiles?.last_name ?? ''}`.trim(),
          })}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmRemove(null)}>
            {tc('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => confirmRemove && handleRemoveMember(confirmRemove)}
            loading={removeMember.isPending}
          >
            {t('removeMember')}
          </Button>
        </div>
      </Dialog>

      {/* Edit Licenses Dialog */}
      <Dialog
        open={!!editLicenseMember}
        onClose={() => setEditLicenseMember(null)}
        title={t('editLicenses')}
        className="max-w-md"
      >
        <form onSubmit={handleSaveLicenses} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('editLicensesDescription', {
              name: `${editLicenseMember?.profiles?.first_name ?? ''} ${editLicenseMember?.profiles?.last_name ?? ''}`.trim(),
            })}
          </p>

          <Input
            id="editLicenseNumber"
            label={t('licenseNumber')}
            value={editLicenseNumber}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
              setEditLicenseNumber(digitsOnly);
              setEditLicenseError('');
            }}
            inputMode="numeric"
            pattern="[0-9]{0,6}"
            maxLength={6}
            placeholder="123456"
          />

          <Input
            id="editSpecLicense"
            label={t('specializationLicense')}
            value={editSpecLicense}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
              setEditSpecLicense(digitsOnly);
              setEditLicenseError('');
            }}
            inputMode="numeric"
            pattern="[0-9]{0,6}"
            maxLength={6}
            placeholder="123456"
          />

          {editLicenseError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {editLicenseError}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={() => setEditLicenseMember(null)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" loading={updateLicenses.isPending}>
              {tc('save')}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
