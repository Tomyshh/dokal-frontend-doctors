export type AppointmentStatusKey =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled_by_patient'
  | 'cancelled_by_practitioner'
  | 'no_show';

const statusKeyMap: Record<AppointmentStatusKey, string> = {
  pending: 'statusLabel.pending',
  confirmed: 'statusLabel.confirmed',
  completed: 'statusLabel.completed',
  cancelled_by_patient: 'statusLabel.cancelledByPatient',
  cancelled_by_practitioner: 'statusLabel.cancelledByPractitioner',
  no_show: 'statusLabel.noShow',
};

export function getAppointmentStatusLabel(
  tAppointments: (key: string, values?: Record<string, string | number | Date>) => string,
  status: string
): string {
  const key = statusKeyMap[status as AppointmentStatusKey];
  if (!key) return status;
  return tAppointments(key);
}

