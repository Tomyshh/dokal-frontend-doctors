'use client';

import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';

interface AppointmentFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
}

export default function AppointmentFilters({
  status,
  onStatusChange,
}: AppointmentFiltersProps) {
  const t = useTranslations('appointments');
  const tc = useTranslations('common');

  const statusOptions = [
    { value: 'upcoming', label: t('upcoming') },
    { value: '', label: tc('all') },
    { value: 'pending', label: getAppointmentStatusLabel(t, 'pending') },
    { value: 'confirmed', label: getAppointmentStatusLabel(t, 'confirmed') },
    { value: 'completed', label: getAppointmentStatusLabel(t, 'completed') },
    { value: 'cancelled_by_patient', label: getAppointmentStatusLabel(t, 'cancelled_by_patient') },
    { value: 'cancelled_by_practitioner', label: getAppointmentStatusLabel(t, 'cancelled_by_practitioner') },
    { value: 'no_show', label: getAppointmentStatusLabel(t, 'no_show') },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      <div className="w-52">
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
          label={t('filter')}
        />
      </div>
    </div>
  );
}
