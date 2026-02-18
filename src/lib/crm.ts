import type { Appointment, AppointmentSource, CrmPatientListItem } from '@/types';

type Translator = (key: string, values?: Record<string, string | number | Date>) => string;

export function getAppointmentSourceLabel(t: Translator, source?: AppointmentSource | string | null) {
  const s = source || 'legacy_unknown';
  switch (s) {
    case 'dokal_crm':
      return t('sourceLabel.dokal_crm');
    case 'dokal_app':
      return t('sourceLabel.dokal_app');
    case 'google_calendar_sync':
      return t('sourceLabel.google_calendar_sync');
    case 'legacy_unknown':
    default:
      return t('sourceLabel.legacy_unknown');
  }
}

function pickPatientLike(appt: Appointment): Partial<CrmPatientListItem> | null {
  const a = appt as unknown as Record<string, unknown>;
  const direct = (appt.patient_record || null) as Partial<CrmPatientListItem> | null;
  if (direct) return direct;
  const candidates = [
    a.patient_record,
    a.patient,
    a.patients,
    a.patientRecord,
    a.patientRecordData,
  ];
  for (const c of candidates) {
    if (c && typeof c === 'object') return c as Partial<CrmPatientListItem>;
  }
  return null;
}

export function getCrmAppointmentPatientDisplayName(appt: Appointment): string {
  const p = pickPatientLike(appt);
  const fromPatient =
    p && (p.first_name || p.last_name)
      ? `${p.first_name || ''} ${p.last_name || ''}`.trim()
      : '';
  if (fromPatient) return fromPatient;

  const prof = appt.profiles;
  const fromProfile =
    prof && (prof.first_name || prof.last_name)
      ? `${prof.first_name || ''} ${prof.last_name || ''}`.trim()
      : '';
  return fromProfile || '-';
}

export function getCrmAppointmentPatientPhone(appt: Appointment): string | null {
  const p = pickPatientLike(appt);
  if (p?.phone) return p.phone;
  return appt.profiles?.phone || null;
}

export function getCrmAppointmentPatientRecordId(appt: Appointment): string | null {
  const direct = appt.patient_record_id;
  if (direct) return direct;
  const p = pickPatientLike(appt);
  return (p?.id as string | undefined) || null;
}

export function isDraftPatientAppointment(appt: Appointment): boolean {
  // Backend contract: appointments.patient_id can be NULL until mobile signup.
  return !appt.patient_id;
}

export function formatMissingFieldLabel(t: Translator, field: string): string {
  // Prefer translations when keys exist; fallback to humanized.
  const key = `missingField.${field}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return field.replace(/_/g, ' ');
}

