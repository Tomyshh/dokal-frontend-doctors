'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getStatusLabel } from '@/lib/utils';

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
    { value: 'pending', label: getStatusLabel('pending', locale) },
    { value: 'confirmed', label: getStatusLabel('confirmed', locale) },
    { value: 'completed', label: getStatusLabel('completed', locale) },
    { value: 'cancelled_by_patient', label: getStatusLabel('cancelled_by_patient', locale) },
    { value: 'cancelled_by_practitioner', label: getStatusLabel('cancelled_by_practitioner', locale) },
    { value: 'no_show', label: getStatusLabel('no_show', locale) },
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
