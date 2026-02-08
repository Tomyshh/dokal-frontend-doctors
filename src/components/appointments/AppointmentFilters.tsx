'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

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

  const statusOptions = [
    { value: '', label: tc('all') },
    { value: 'pending', label: t('confirm') === 'Confirmer' ? 'En attente' : 'Pending' },
    { value: 'confirmed', label: t('confirm') === 'Confirmer' ? 'Confirmé' : 'Confirmed' },
    { value: 'completed', label: t('confirm') === 'Confirmer' ? 'Terminé' : 'Completed' },
    { value: 'cancelled_by_patient', label: t('confirm') === 'Confirmer' ? 'Annulé (patient)' : 'Cancelled (patient)' },
    { value: 'cancelled_by_practitioner', label: t('confirm') === 'Confirmer' ? 'Annulé (praticien)' : 'Cancelled (doctor)' },
    { value: 'no_show', label: t('confirm') === 'Confirmer' ? 'Absent' : 'No show' },
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
