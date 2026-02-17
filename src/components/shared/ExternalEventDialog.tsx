'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import type { ExternalEventType } from '@/types';
import type { CreateExternalEventRequest } from '@/types/api';

function padTime(t: string) {
  // Normalize to HH:mm:ss
  if (!t) return t;
  if (t.length === 5) return `${t}:00`;
  return t;
}

function toMinutes(t: string) {
  const norm = padTime(t);
  const [h, m] = norm.split(':').map((x) => Number(x));
  return h * 60 + m;
}

export interface ExternalEventDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExternalEventRequest) => Promise<void> | void;
  defaultDate?: string; // yyyy-MM-dd
  submitting?: boolean;
}

export function ExternalEventDialog({
  open,
  onClose,
  onSubmit,
  defaultDate,
  submitting = false,
}: ExternalEventDialogProps) {
  const t = useTranslations('calendar');
  const tc = useTranslations('common');

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || todayStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [typeDetected, setTypeDetected] = useState<ExternalEventType>('appointment');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setTitle('');
    setDate(defaultDate || todayStr);
    setStartTime('09:00');
    setEndTime('09:30');
    setTypeDetected('appointment');
    setLocation('');
    setDescription('');
  }, [open, defaultDate, todayStr]);

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError(t('externalEventTitleRequired'));
      return;
    }
    if (!date) {
      setError(t('externalEventDateRequired'));
      return;
    }
    if (!startTime || !endTime) {
      setError(t('externalEventTimeRequired'));
      return;
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      setError(t('externalEventEndAfterStart'));
      return;
    }

    const payload: CreateExternalEventRequest = {
      title: title.trim(),
      date,
      start_time: padTime(startTime),
      end_time: padTime(endTime),
      location: location.trim() || null,
      description: description.trim() || null,
      type_detected: typeDetected,
    };

    await onSubmit(payload);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('addExternalEvent')}
      className="max-w-xl"
    >
      <div className="space-y-4">
        <Input
          id="ext-title"
          label={t('externalEventTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('externalEventTitlePlaceholder')}
          disabled={submitting}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="ext-date"
            type="date"
            label={t('externalEventDate')}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
          />
          <Input
            id="ext-start"
            type="time"
            label={t('externalEventStart')}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            disabled={submitting}
          />
          <Input
            id="ext-end"
            type="time"
            label={t('externalEventEnd')}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={submitting}
          />
        </div>

        <Select
          id="ext-type"
          label={t('type')}
          value={typeDetected}
          onChange={(e) => setTypeDetected(e.target.value as ExternalEventType)}
          disabled={submitting}
          options={[
            { value: 'appointment', label: t('detectedAppointment') },
            { value: 'busy', label: t('detectedBusy') },
          ]}
        />

        <Input
          id="ext-location"
          label={t('externalEventLocation')}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t('externalEventLocationPlaceholder')}
          disabled={submitting}
        />

        <Textarea
          id="ext-desc"
          label={t('externalEventDescription')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('externalEventDescriptionPlaceholder')}
          rows={3}
          disabled={submitting}
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {tc('add')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

