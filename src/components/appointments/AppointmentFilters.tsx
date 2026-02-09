'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';

interface AppointmentFiltersProps {
  date: string;
  status: string;
  onDateChange: (date: string) => void;
  onStatusChange: (status: string) => void;
}

export default function AppointmentFilters({
  date,
  status,
  onDateChange,
  onStatusChange,
}: AppointmentFiltersProps) {
  const t = useTranslations('appointments');
  const tc = useTranslations('common');
  const locale = useLocale();

  const statusOptions = [
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
      <div className="w-48">
        <Input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          label={t('date')}
        />
      </div>
      <div className="w-52">
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={statusOptions}
          label={t('status')}
        />
      </div>
    </div>
  );
}
