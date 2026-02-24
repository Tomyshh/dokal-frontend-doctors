'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Check } from 'lucide-react';
import { usePatient } from '@/hooks/usePatient';
import { useUpdateCrmPatient } from '@/hooks/useCrmPatients';
import { useToast } from '@/providers/ToastProvider';
import { formatMissingFieldLabel } from '@/lib/crm';
import type { CrmPatientListItem } from '@/types';
import type { UpdateCrmPatientRequest } from '@/types/api';

const INSURANCE_PROVIDER_OPTIONS = [
  'AIG',
  'איילון',
  'ביטוח חקלאי',
  'דקלה',
  'הראל',
  'הכשרה',
  'הפניקס',
  'כלל',
  'מגדל',
  'מנורה',
  'ביטוח ישיר',
  'שירביט',
  'שלמה',
  'שומרה',
] as const;

const ALL_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'email',
  'city',
  'date_of_birth',
  'sex',
  'teudat_zehut',
  'insurance_provider',
] as const;

function getFieldValue(
  record: Partial<CrmPatientListItem> | null,
  field: string,
  teudatDisplay: string,
  insuranceDisplay: string
): string {
  if (field === 'teudat_zehut') return teudatDisplay;
  if (field === 'insurance_provider') return insuranceDisplay;
  if (!record) return '';
  const v = (record as Record<string, unknown>)[field];
  if (v == null || v === '') return '';
  return String(v);
}

export interface CompletePatientInfoDialogProps {
  open: boolean;
  onClose: () => void;
  patientRecordId: string;
  missingFields: string[];
}

export function CompletePatientInfoDialog({
  open,
  onClose,
  patientRecordId,
  missingFields,
}: CompletePatientInfoDialogProps) {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const tcal = useTranslations('calendar');
  const { data, isLoading } = usePatient(patientRecordId);
  const updateMutation = useUpdateCrmPatient();
  const toast = useToast();

  const record = (data as { patient?: CrmPatientListItem })?.patient ?? (data as CrmPatientListItem | undefined);
  const normalize = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const recordObj = (record ?? null) as unknown as Record<string, unknown> | null;
  const dataObj = (data ?? null) as unknown as Record<string, unknown> | null;
  const healthProfileObj = (dataObj?.health_profile ?? null) as unknown as Record<string, unknown> | null;
  const teudatDisplay =
    normalize(recordObj?.teudat_zehut) ||
    normalize(healthProfileObj?.teudat_zehut) ||
    normalize(recordObj?.teudat_zehut_masked) ||
    '';
  const insuranceDisplay =
    normalize(healthProfileObj?.insurance_provider) ||
    normalize(recordObj?.insurance_provider) ||
    '';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<string>('');
  const [teudat, setTeudat] = useState<string>('');
  const [insuranceProvider, setInsuranceProvider] = useState<string>('');

  useEffect(() => {
    if (!record) return;
    setFirstName(getFieldValue(record, 'first_name', teudatDisplay, insuranceDisplay));
    setLastName(getFieldValue(record, 'last_name', teudatDisplay, insuranceDisplay));
    setPhone(getFieldValue(record, 'phone', teudatDisplay, insuranceDisplay));
    setEmail(getFieldValue(record, 'email', teudatDisplay, insuranceDisplay));
    setCity(getFieldValue(record, 'city', teudatDisplay, insuranceDisplay));
    setDob(getFieldValue(record, 'date_of_birth', teudatDisplay, insuranceDisplay));
    setSex(getFieldValue(record, 'sex', teudatDisplay, insuranceDisplay) || '');
    setTeudat(teudatDisplay);
    setInsuranceProvider(insuranceDisplay);
  }, [record?.id, teudatDisplay, insuranceDisplay]);

  const completedFields = ALL_FIELDS.filter((f) => !missingFields.includes(f));
  const missingSet = new Set(missingFields);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: patientRecordId,
        data: {
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          city: city.trim() || null,
          date_of_birth: dob || null,
          sex: (sex || null) as UpdateCrmPatientRequest['sex'],
          teudat_zehut: teudat.trim() || null,
          insurance_provider: insuranceProvider || null,
        },
      });
      toast.success(tc('saveSuccess'));
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        tc('saveError');
      toast.error(tc('saveErrorTitle'), msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={tcal('completePatientInfoTitle')}
      className="max-w-xl"
    >
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">{tc('loading')}</div>
      ) : (
        <div className="space-y-6">
          {/* Champs complétés */}
          {completedFields.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {tcal('completedFieldsLabel')}
              </h3>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                {completedFields.map((field) => {
                  const displayValue = getFieldValue(record ?? null, field, teudatDisplay, insuranceDisplay);
                  const display =
                    field === 'sex'
                      ? displayValue === 'male'
                        ? t('sexMale')
                        : displayValue === 'female'
                          ? t('sexFemale')
                          : displayValue === 'other'
                            ? t('sexOther')
                            : displayValue || '-'
                      : displayValue || '-';
                  return (
                    <div key={field} className="flex justify-between items-center text-sm gap-4">
                      <span className="text-muted-foreground shrink-0">{formatMissingFieldLabel(tcal, field)}</span>
                      <span className="font-medium text-gray-900 text-right truncate">{display}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Champs à compléter */}
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2">{tcal('missingFieldsToCompleteLabel')}</h3>
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 space-y-4">
              {missingSet.has('first_name') && (
                <Input label={tc('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              )}
              {missingSet.has('last_name') && (
                <Input label={tc('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              )}
              {missingSet.has('phone') && (
                <Input label={tc('phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
              )}
              {missingSet.has('email') && (
                <Input type="email" label={tc('email')} value={email} onChange={(e) => setEmail(e.target.value)} />
              )}
              {missingSet.has('city') && (
                <Input label={t('city')} value={city} onChange={(e) => setCity(e.target.value)} />
              )}
              {missingSet.has('date_of_birth') && (
                <Input
                  type="date"
                  label={t('dateOfBirth')}
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              )}
              {missingSet.has('sex') && (
                <Select
                  id="sex"
                  label={t('sex')}
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  options={[
                    { value: '', label: t('optional') },
                    { value: 'male', label: t('sexMale') },
                    { value: 'female', label: t('sexFemale') },
                    { value: 'other', label: t('sexOther') },
                  ]}
                />
              )}
              {missingSet.has('teudat_zehut') && (
                <Input
                  label={t('teudatZehut')}
                  value={teudat}
                  onChange={(e) => setTeudat(e.target.value)}
                  placeholder={t('teudatZehutPlaceholder')}
                />
              )}
              {missingSet.has('insurance_provider') && (
                <Select
                  id="insurance_provider"
                  label={t('insurance')}
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  options={[
                    { value: '', label: t('optional') },
                    ...INSURANCE_PROVIDER_OPTIONS.map((v) => ({ value: v, label: v })),
                  ]}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
              {tc('cancel')}
            </Button>
            <Button loading={updateMutation.isPending} onClick={handleSave}>
              {tc('save')}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
