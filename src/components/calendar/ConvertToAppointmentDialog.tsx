'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import {
  Sparkles,
  Search,
  UserPlus,
  Clock,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { formatTime, formatDate } from '@/lib/utils';
import { useToast } from '@/providers/ToastProvider';
import {
  useExtractPatientInfo,
  useConvertExternalEventToAppointment,
} from '@/hooks/useExternalEvents';
import { useCrmPatientSearch } from '@/hooks/useCrmPatients';
import { useReasons } from '@/hooks/useSettings';
import type { ExternalEvent, CrmPatientListItem, AppointmentReason } from '@/types';
import type { Locale } from '@/i18n/config';

type PatientMode = 'search' | 'create';

export interface ConvertToAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  event: ExternalEvent;
  onConverted: () => void;
}

export function ConvertToAppointmentDialog({
  open,
  onClose,
  event,
  onConverted,
}: ConvertToAppointmentDialogProps) {
  const t = useTranslations('calendar');
  const tc = useTranslations('common');
  const locale = useLocale() as Locale;
  const toast = useToast();

  const extractMutation = useExtractPatientInfo();
  const convertMutation = useConvertExternalEventToAppointment();
  const { data: reasons } = useReasons();

  const [patientMode, setPatientMode] = useState<PatientMode>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<CrmPatientListItem | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [notes, setNotes] = useState('');

  const [aiExtracted, setAiExtracted] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const searchEnabled = patientMode === 'search' && searchQuery.length >= 2;
  const { data: searchResults } = useCrmPatientSearch(searchQuery, searchEnabled);

  useEffect(() => {
    if (!open) return;
    setPatientMode('create');
    setSearchQuery('');
    setSelectedPatient(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setReasonId('');
    setNotes('');
    setAiExtracted(false);
    setAiConfidence(null);
  }, [open]);

  useEffect(() => {
    if (!open || aiExtracted) return;
    extractMutation.mutate(event.id, {
      onSuccess: (data) => {
        if (data.first_name) setFirstName(data.first_name);
        if (data.last_name) setLastName(data.last_name);
        if (data.phone) setPhone(data.phone);
        if (data.email) setEmail(data.email);
        setAiConfidence(data.confidence);
        setAiExtracted(true);
      },
      onError: () => {
        setAiExtracted(true);
      },
    });
  }, [open, event.id, aiExtracted]);

  const reasonOptions = useMemo(() => {
    if (!reasons) return [];
    return (reasons as AppointmentReason[])
      .filter((r) => r.is_active)
      .map((r) => {
        const label =
          locale === 'he'
            ? r.label_he || r.label
            : locale === 'fr'
              ? r.label_fr || r.label
              : r.label;
        return { value: r.id, label };
      });
  }, [reasons, locale]);

  const eventStartTime = event.start_at.substring(11, 19) || '00:00:00';
  const eventEndTime = event.end_at.substring(11, 19) || '23:59:59';

  const canSubmit =
    patientMode === 'search'
      ? !!selectedPatient
      : firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleConvert = async () => {
    try {
      await convertMutation.mutateAsync({
        eventId: event.id,
        payload: {
          patient_record_id:
            patientMode === 'search' ? selectedPatient?.id : undefined,
          patient:
            patientMode === 'create'
              ? {
                  first_name: firstName.trim(),
                  last_name: lastName.trim(),
                  phone: phone.trim() || null,
                  email: email.trim() || null,
                }
              : undefined,
          reason_id: reasonId || null,
          notes: notes.trim() || null,
        },
      });
      toast.success(t('convertSuccess'));
      onConverted();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || tc('saveError');
      toast.error(tc('saveErrorTitle'), msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('convertToAppointment')}
      className="max-w-xl"
    >
      <div className="space-y-5">
        {/* Event summary */}
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-2">
          <p className="text-sm font-semibold text-orange-900">
            {event.title || '-'}
          </p>
          {event.description && (
            <p className="text-xs text-orange-800 whitespace-pre-line">
              {event.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-orange-700">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDate(event.date, 'EEEE d MMMM yyyy', locale)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(eventStartTime)} - {formatTime(eventEndTime)}
            </span>
          </div>
        </div>

        {/* AI extraction status */}
        {extractMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('extractingPatientInfo')}
          </div>
        )}
        {aiExtracted && aiConfidence !== null && aiConfidence > 0 && (
          <div className="flex items-center gap-2">
            <Badge className="bg-violet-100 text-violet-700">
              <Sparkles className="h-3 w-3" />
              {t('aiSuggestion')}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t('aiConfidence', { value: Math.round(aiConfidence * 100) })}
            </span>
          </div>
        )}

        {/* Patient mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={patientMode === 'create' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setPatientMode('create');
              setSelectedPatient(null);
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {t('newPatient')}
          </Button>
          <Button
            variant={patientMode === 'search' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPatientMode('search')}
          >
            <Search className="h-3.5 w-3.5" />
            {t('existingPatient')}
          </Button>
        </div>

        {/* Search mode */}
        {patientMode === 'search' && (
          <div className="space-y-3">
            <Input
              id="patient-search"
              label={t('searchPatient')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedPatient(null);
              }}
              placeholder={t('searchPatientPlaceholder')}
            />
            {searchResults?.patients && searchResults.patients.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {searchResults.patients.map((p: CrmPatientListItem) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatient(p)}
                    className={`w-full text-start px-3 py-2 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                      selectedPatient?.id === p.id
                        ? 'bg-primary-50 border-l-2 border-l-primary'
                        : ''
                    }`}
                  >
                    <Avatar
                      src={p.avatar_url}
                      firstName={p.first_name}
                      lastName={p.last_name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      {p.phone && (
                        <p className="text-xs text-muted-foreground">{p.phone}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="rounded-xl border border-primary/30 bg-primary-50/50 px-4 py-3 flex items-center gap-3">
                <Avatar
                  src={selectedPatient.avatar_url}
                  firstName={selectedPatient.first_name}
                  lastName={selectedPatient.last_name}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                  {selectedPatient.phone && (
                    <p className="text-xs text-muted-foreground">
                      {selectedPatient.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create mode */}
        {patientMode === 'create' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="patient-first-name"
                label={tc('firstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                id="patient-last-name"
                label={tc('lastName')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="patient-phone"
                label={tc('phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('optional')}
              />
              <Input
                id="patient-email"
                type="email"
                label={tc('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('optional')}
              />
            </div>
          </div>
        )}

        {/* Reason */}
        {reasonOptions.length > 0 && (
          <Select
            id="reason"
            label={t('reason')}
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value)}
            options={[
              { value: '', label: t('optional') },
              ...reasonOptions,
            ]}
          />
        )}

        {/* Notes */}
        <Input
          id="notes"
          label={t('notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('optional')}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={convertMutation.isPending}
          >
            {tc('cancel')}
          </Button>
          <Button
            onClick={handleConvert}
            loading={convertMutation.isPending}
            disabled={!canSubmit}
          >
            {t('convertToAppointment')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
