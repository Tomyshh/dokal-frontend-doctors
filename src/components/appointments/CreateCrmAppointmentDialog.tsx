'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { useCrmOrganization, useOrganizationMembers } from '@/hooks/useOrganization';
import { useReasons } from '@/hooks/useSettings';
import { useCreateCrmAppointment } from '@/hooks/useAppointments';
import { useCrmPatientSearch, useCreateCrmPatient } from '@/hooks/useCrmPatients';
import type { CrmPatientListItem } from '@/types';
import type { CreateCrmAppointmentRequest, CreateCrmPatientRequest } from '@/types/api';

type Step = 'patient' | 'details';

function padTime(t: string) {
  if (!t) return t;
  if (t.length === 5) return `${t}:00`;
  return t;
}

function toMinutes(t: string) {
  const norm = padTime(t);
  const [h, m] = norm.split(':').map((x) => Number(x));
  return h * 60 + m;
}

function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export interface CreateCrmAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string; // yyyy-MM-dd
  defaultStartTime?: string; // HH:mm
}

export function CreateCrmAppointmentDialog({
  open,
  onClose,
  defaultDate,
  defaultStartTime,
}: CreateCrmAppointmentDialogProps) {
  const t = useTranslations('appointments');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { profile } = useAuth();
  const isSecretary = profile?.role === 'secretary';

  const { data: organization } = useCrmOrganization();
  const { data: members } = useOrganizationMembers(organization?.id);
  const practitionerMembers =
    members?.filter((m) => m.staff_type === 'practitioner' && m.is_active !== false) || [];

  const { data: reasons } = useReasons();

  const createAppointmentMutation = useCreateCrmAppointment();
  const createPatientMutation = useCreateCrmPatient();

  const [step, setStep] = useState<Step>('patient');

  // Patient selection state
  const [patientQuery, setPatientQuery] = useState('');
  const [patientOpen, setPatientOpen] = useState(false);
  const patientInputRef = useRef<HTMLInputElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<CrmPatientListItem | null>(null);
  const [createNewPatient, setCreateNewPatient] = useState(false);

  const searchEnabled = open && patientOpen && patientQuery.trim().length >= 2;
  const { data: patientSearch } = useCrmPatientSearch(patientQuery.trim(), searchEnabled);
  const patientSuggestions = patientSearch?.patients || [];

  // New patient form state
  const [pFirstName, setPFirstName] = useState('');
  const [pLastName, setPLastName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pCity, setPCity] = useState('');
  const [pSex, setPSex] = useState<'male' | 'female' | 'other' | ''>('');
  const [pDob, setPDob] = useState(''); // yyyy-MM-dd

  // Appointment details
  const [practitionerId, setPractitionerId] = useState<string>('');
  const [date, setDate] = useState(defaultDate || todayStr());
  const [startTime, setStartTime] = useState(defaultStartTime || '09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [reasonId, setReasonId] = useState<string>('');
  const [visitedBefore, setVisitedBefore] = useState(false);
  const [status, setStatus] = useState<'pending' | 'confirmed'>('confirmed');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');

  // Reset ONLY once per dialog open (avoid wiping user input when async data arrives)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (open) {
      if (initializedRef.current) return;
      initializedRef.current = true;

      setStep('patient');
      setError('');
      setPatientQuery('');
      setPatientOpen(false);
      setSelectedPatient(null);
      setCreateNewPatient(false);
      setPFirstName('');
      setPLastName('');
      setPPhone('');
      setPEmail('');
      setPCity('');
      setPSex('');
      setPDob('');
      setDate(defaultDate || todayStr());
      setStartTime(defaultStartTime || '09:00');
      setEndTime('09:30');
      setReasonId('');
      setVisitedBefore(false);
      setStatus('confirmed');
      setNotes('');
      // Don't derive practitioner here (members may still be loading)
      setPractitionerId('');
    } else {
      initializedRef.current = false;
    }
  }, [open, defaultDate, defaultStartTime]);

  // When members arrive, set a default practitioner for secretaries without resetting the form
  useEffect(() => {
    if (!open) return;
    if (!isSecretary) return;
    if (practitionerId) return;
    if (practitionerMembers.length === 0) return;
    const first = practitionerMembers.find((m) => m.role === 'owner') || practitionerMembers[0];
    const id = first?.practitioner?.id || '';
    if (id) setPractitionerId(id);
  }, [open, isSecretary, practitionerId, practitionerMembers]);

  const submitting = createAppointmentMutation.isPending || createPatientMutation.isPending;

  const patientDisplayName = useMemo(() => {
    if (!selectedPatient) return '';
    return `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim();
  }, [selectedPatient]);

  const goNext = useCallback(async () => {
    setError('');
    if (createNewPatient) {
      if (!pFirstName.trim() || !pLastName.trim() || !pPhone.trim()) {
        setError(t('patientRequiredFields'));
        return;
      }
      // create patient now, then select it
      const payload: CreateCrmPatientRequest = {
        first_name: pFirstName.trim(),
        last_name: pLastName.trim(),
        phone: pPhone.trim(),
        email: pEmail.trim() || undefined,
        city: pCity.trim() || undefined,
        sex: (pSex || undefined) as 'male' | 'female' | 'other' | undefined,
        date_of_birth: pDob || undefined,
      };
      try {
        const created = await createPatientMutation.mutateAsync(payload);
        setSelectedPatient(created);
      } catch {
        setError(t('patientCreateFailed'));
        return;
      }
    } else {
      if (!selectedPatient) {
        setError(t('selectPatientRequired'));
        return;
      }
    }
    setStep('details');
  }, [
    createNewPatient,
    pFirstName,
    pLastName,
    pPhone,
    pEmail,
    pCity,
    pSex,
    pDob,
    selectedPatient,
    createPatientMutation,
    t,
  ]);

  const submitAppointment = useCallback(async () => {
    setError('');
    if (!selectedPatient) {
      setError(t('selectPatientRequired'));
      setStep('patient');
      return;
    }
    if (isSecretary && !practitionerId) {
      setError(t('selectPractitionerRequired'));
      return;
    }
    if (!date || !startTime || !endTime) {
      setError(t('appointmentDateTimeRequired'));
      return;
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setError(t('appointmentEndAfterStart'));
      return;
    }

    const payload: CreateCrmAppointmentRequest = {
      patient_id: selectedPatient.id,
      practitioner_id: isSecretary ? practitionerId : undefined,
      reason_id: reasonId || null,
      appointment_date: date,
      start_time: padTime(startTime),
      end_time: padTime(endTime),
      visited_before: visitedBefore,
      status,
      notes: notes.trim() || null,
    };

    try {
      await createAppointmentMutation.mutateAsync(payload);
      onClose();
    } catch {
      setError(t('appointmentCreateFailed'));
    }
  }, [
    selectedPatient,
    isSecretary,
    practitionerId,
    date,
    startTime,
    endTime,
    reasonId,
    visitedBefore,
    status,
    notes,
    createAppointmentMutation,
    onClose,
    t,
  ]);

  const handlePatientFocus = () => {
    setPatientOpen(true);
  };
  const handlePatientBlur = () => {
    setTimeout(() => setPatientOpen(false), 150);
  };

  const showPatientList = patientOpen && !createNewPatient && (patientSuggestions.length > 0);

  return (
    <Dialog open={open} onClose={onClose} title={t('newAppointment')} className="max-w-2xl">
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          <Badge className={cn(step === 'patient' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600')}>
            1. {t('stepPatient')}
          </Badge>
          <Badge className={cn(step === 'details' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600')}>
            2. {t('stepDetails')}
          </Badge>
        </div>

        {step === 'patient' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="create-new-patient"
                checked={createNewPatient}
                onChange={(e) => {
                  setCreateNewPatient(e.target.checked);
                  setSelectedPatient(null);
                  setPatientQuery('');
                }}
                className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
              />
              <div>
                <label htmlFor="create-new-patient" className="text-sm font-medium text-gray-700">
                  {t('createPatientToggle')}
                </label>
                <p className="text-xs text-muted-foreground">{t('createPatientToggleDesc')}</p>
              </div>
            </div>

            {!createNewPatient ? (
              <div className="space-y-1.5 relative">
                <label htmlFor="patient-search" className="text-sm font-medium text-gray-700">
                  {t('selectPatient')}
                </label>
                <input
                  ref={patientInputRef}
                  type="text"
                  id="patient-search"
                  value={patientQuery}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPatientQuery(v);
                    setPatientOpen(true);
                    setSelectedPatient(null);
                  }}
                  onFocus={handlePatientFocus}
                  onBlur={handlePatientBlur}
                  placeholder={t('searchPatientPlaceholder')}
                  autoComplete="off"
                  dir={locale === 'he' ? 'rtl' : 'ltr'}
                  className={cn(
                    'flex h-10 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors'
                  )}
                  disabled={submitting}
                />

                {showPatientList && (
                  <ul
                    role="listbox"
                    className="absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
                  >
                    {patientSuggestions.map((p) => {
                      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || '-';
                      return (
                        <li
                          key={p.id}
                          role="option"
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 outline-none flex items-center gap-3"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSelectedPatient(p);
                            setPatientQuery(name);
                            setPatientOpen(false);
                            patientInputRef.current?.blur();
                          }}
                        >
                          <Avatar
                            src={p.avatar_url}
                            firstName={p.first_name}
                            lastName={p.last_name}
                            size="xs"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.phone || ''}{p.email ? ` • ${p.email}` : ''}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {selectedPatient && (
                  <div className="mt-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800 flex items-center gap-2">
                    <span className="font-medium">{t('selectedPatient')}:</span>
                    <span>{patientDisplayName}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 rounded-xl bg-muted/30 border border-border/50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="p-first"
                    label={tc('firstName')}
                    value={pFirstName}
                    onChange={(e) => setPFirstName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <Input
                    id="p-last"
                    label={tc('lastName')}
                    value={pLastName}
                    onChange={(e) => setPLastName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="p-phone"
                    label={tc('phone')}
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    disabled={submitting}
                    required
                  />
                  <Input
                    id="p-email"
                    type="email"
                    label={tc('email')}
                    value={pEmail}
                    onChange={(e) => setPEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="p-city"
                    label={t('city')}
                    value={pCity}
                    onChange={(e) => setPCity(e.target.value)}
                    disabled={submitting}
                  />
                  <Select
                    id="p-sex"
                    label={t('sex')}
                    value={pSex}
                    onChange={(e) => setPSex(e.target.value as typeof pSex)}
                    disabled={submitting}
                    options={[
                      { value: '', label: t('optional') },
                      { value: 'male', label: t('sexMale') },
                      { value: 'female', label: t('sexFemale') },
                      { value: 'other', label: t('sexOther') },
                    ]}
                  />
                </div>
                <Input
                  id="p-dob"
                  type="date"
                  label={t('dateOfBirth')}
                  value={pDob}
                  onChange={(e) => setPDob(e.target.value)}
                  disabled={submitting}
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                {tc('cancel')}
              </Button>
              <Button onClick={goNext} loading={submitting}>
                {tc('next')}
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-4">
            {/* Selected patient recap */}
            {selectedPatient && (
              <div className="rounded-xl bg-gray-50 border border-border/50 p-3 flex items-center gap-3">
                <Avatar
                  src={selectedPatient.avatar_url}
                  firstName={selectedPatient.first_name}
                  lastName={selectedPatient.last_name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{patientDisplayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedPatient.phone || ''}{selectedPatient.email ? ` • ${selectedPatient.email}` : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setStep('patient')}
                  disabled={submitting}
                >
                  {tc('edit')}
                </Button>
              </div>
            )}

            {isSecretary && (
              <Select
                id="practitioner"
                label={t('practitioner')}
                value={practitionerId}
                onChange={(e) => setPractitionerId(e.target.value)}
                disabled={submitting}
                options={[
                  { value: '', label: t('selectPractitioner') },
                  ...practitionerMembers
                    .filter((m) => m.practitioner?.id)
                    .map((m) => ({
                      value: m.practitioner!.id,
                      label: `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim(),
                    })),
                ]}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                id="a-date"
                type="date"
                label={t('date')}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
              />
              <Input
                id="a-start"
                type="time"
                label={t('startTime')}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={submitting}
              />
              <Input
                id="a-end"
                type="time"
                label={t('endTime')}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={submitting}
              />
            </div>

            <Select
              id="reason"
              label={t('reason')}
              value={reasonId}
              onChange={(e) => setReasonId(e.target.value)}
              disabled={submitting}
              options={[
                { value: '', label: t('optional') },
                ...(reasons || []).map((r) => ({
                  value: r.id,
                  label:
                    locale === 'he'
                      ? r.label_he || r.label
                      : locale === 'fr'
                        ? r.label_fr || r.label
                        : r.label,
                })),
              ]}
            />

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="visitedBefore"
                checked={visitedBefore}
                onChange={(e) => setVisitedBefore(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                disabled={submitting}
              />
              <div>
                <label htmlFor="visitedBefore" className="text-sm font-medium text-gray-700">
                  {t('visitedBefore')}
                </label>
                <p className="text-xs text-muted-foreground">{t('visitedBeforeDesc')}</p>
              </div>
            </div>

            <Select
              id="status"
              label={t('status')}
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              disabled={submitting}
              options={[
                { value: 'confirmed', label: t('statusLabel.confirmed') },
                { value: 'pending', label: t('statusLabel.pending') },
              ]}
            />

            <Textarea
              id="notes"
              label={t('notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={submitting}
            />

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setStep('patient')} disabled={submitting}>
                {tc('back')}
              </Button>
              <Button onClick={submitAppointment} loading={submitting}>
                {t('createAppointment')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

