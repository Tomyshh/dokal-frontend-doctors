'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useWeeklySchedule, useAddScheduleBlock, useUpdateScheduleBlock, useDeleteScheduleBlock, useScheduleOverrides, useUpsertOverride, useDeleteOverride } from '@/hooks/useSchedule';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { getDayName, formatTime } from '@/lib/utils';
import { Plus, Pencil, Trash2, CalendarOff } from 'lucide-react';
import type { WeeklySchedule } from '@/types';

export default function SchedulePage() {
  const t = useTranslations('schedule');
  const locale = useLocale();
  const { data: schedule, isLoading } = useWeeklySchedule();
  const { data: overrides, isLoading: loadingOverrides } = useScheduleOverrides();

  const addBlock = useAddScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();
  const deleteBlock = useDeleteScheduleBlock();
  const upsertOverride = useUpsertOverride();
  const deleteOverride = useDeleteOverride();

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<WeeklySchedule | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);

  // Block form
  const [blockDay, setBlockDay] = useState(0);
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('17:00');
  const [blockDuration, setBlockDuration] = useState(30);

  // Override form
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideAvailable, setOverrideAvailable] = useState(false);
  const [overrideStart, setOverrideStart] = useState('');
  const [overrideEnd, setOverrideEnd] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const dayOptions = Array.from({ length: 7 }, (_, i) => ({
    value: String(i),
    label: getDayName(i, locale),
  }));

  const openAddBlock = () => {
    setEditingBlock(null);
    setBlockDay(0);
    setBlockStart('09:00');
    setBlockEnd('17:00');
    setBlockDuration(30);
    setShowBlockDialog(true);
  };

  const openEditBlock = (block: WeeklySchedule) => {
    setEditingBlock(block);
    setBlockDay(block.day_of_week);
    setBlockStart(formatTime(block.start_time));
    setBlockEnd(formatTime(block.end_time));
    setBlockDuration(block.slot_duration_minutes);
    setShowBlockDialog(true);
  };

  const handleSaveBlock = () => {
    if (editingBlock) {
      updateBlock.mutate(
        { id: editingBlock.id, data: { start_time: blockStart, end_time: blockEnd, slot_duration_minutes: blockDuration } },
        { onSuccess: () => setShowBlockDialog(false) }
      );
    } else {
      addBlock.mutate(
        { day_of_week: blockDay, start_time: blockStart, end_time: blockEnd, slot_duration_minutes: blockDuration },
        { onSuccess: () => setShowBlockDialog(false) }
      );
    }
  };

  const handleSaveOverride = () => {
    upsertOverride.mutate(
      {
        date: overrideDate,
        is_available: overrideAvailable,
        start_time: overrideAvailable ? overrideStart || undefined : undefined,
        end_time: overrideAvailable ? overrideEnd || undefined : undefined,
        reason: overrideReason || undefined,
      },
      { onSuccess: () => { setShowOverrideDialog(false); setOverrideDate(''); setOverrideReason(''); } }
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>{t('weeklySchedule')}</CardTitle>
          <Button size="sm" onClick={openAddBlock}>
            <Plus className="h-4 w-4" />
            {t('addBlock')}
          </Button>
        </CardHeader>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="space-y-2">
            {schedule?.sort((a, b) => a.day_of_week - b.day_of_week).map((block) => (
              <div
                key={block.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-900 w-28">
                    {getDayName(block.day_of_week, locale)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                  </span>
                  <Badge variant={block.is_active ? 'success' : 'secondary'}>
                    {block.slot_duration_minutes} min
                  </Badge>
                  {!block.is_active && (
                    <Badge variant="secondary">{locale === 'fr' ? 'Inactif' : 'Inactive'}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => openEditBlock(block)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => deleteBlock.mutate(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Overrides */}
      <Card>
        <CardHeader>
          <CardTitle>{t('overrides')}</CardTitle>
          <Button size="sm" onClick={() => setShowOverrideDialog(true)}>
            <Plus className="h-4 w-4" />
            {t('addOverride')}
          </Button>
        </CardHeader>

        {loadingOverrides ? (
          <Spinner />
        ) : (
          <div className="space-y-2">
            {overrides?.map((override) => (
              <div
                key={override.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <CalendarOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-gray-900">{override.date}</span>
                  <Badge variant={override.is_available ? 'success' : 'destructive'}>
                    {override.is_available ? t('available') : t('unavailable')}
                  </Badge>
                  {override.start_time && override.end_time && (
                    <span className="text-sm text-gray-600">
                      {formatTime(override.start_time)} - {formatTime(override.end_time)}
                    </span>
                  )}
                  {override.reason && (
                    <span className="text-sm text-muted-foreground">({override.reason})</span>
                  )}
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50"
                  onClick={() => deleteOverride.mutate(override.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Block Dialog */}
      <Dialog
        open={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        title={editingBlock ? t('editBlock') : t('addBlock')}
      >
        <div className="space-y-4">
          {!editingBlock && (
            <Select
              label={t('dayOfWeek')}
              value={String(blockDay)}
              onChange={(e) => setBlockDay(Number(e.target.value))}
              options={dayOptions}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label={t('startTime')}
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
            />
            <Input
              type="time"
              label={t('endTime')}
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
            />
          </div>
          <Input
            type="number"
            label={t('slotDuration')}
            value={blockDuration}
            onChange={(e) => setBlockDuration(Number(e.target.value))}
            min={5}
            max={240}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              {t('startTime') === 'Début' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveBlock} loading={addBlock.isPending || updateBlock.isPending}>
              {t('startTime') === 'Début' ? 'Enregistrer' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Override Dialog */}
      <Dialog
        open={showOverrideDialog}
        onClose={() => setShowOverrideDialog(false)}
        title={t('addOverride')}
      >
        <div className="space-y-4">
          <Input
            type="date"
            label={t('dayOfWeek')}
            value={overrideDate}
            onChange={(e) => setOverrideDate(e.target.value)}
          />
          <Select
            label={t('available')}
            value={overrideAvailable ? 'true' : 'false'}
            onChange={(e) => setOverrideAvailable(e.target.value === 'true')}
            options={[
              { value: 'false', label: t('unavailable') },
              { value: 'true', label: t('specialHours') },
            ]}
          />
          {overrideAvailable && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                label={t('startTime')}
                value={overrideStart}
                onChange={(e) => setOverrideStart(e.target.value)}
              />
              <Input
                type="time"
                label={t('endTime')}
                value={overrideEnd}
                onChange={(e) => setOverrideEnd(e.target.value)}
              />
            </div>
          )}
          <Textarea
            label={t('reason')}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              {t('startTime') === 'Début' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={handleSaveOverride} loading={upsertOverride.isPending}>
              {t('startTime') === 'Début' ? 'Enregistrer' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
