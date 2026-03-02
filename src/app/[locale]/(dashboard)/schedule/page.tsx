'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useWeeklySchedule, useAddScheduleBlock, useUpdateScheduleBlock, useDeleteScheduleBlock, useScheduleOverrides, useUpsertOverride, useDeleteOverride } from '@/hooks/useSchedule';
import { useBreaks, useCreateBreak, useDeleteBreak } from '@/hooks/useBreaks';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { getDayName, formatTime } from '@/lib/utils';
import { useToast } from '@/providers/ToastProvider';
import { Plus, Pencil, Trash2, CalendarOff, Coffee, Clock, Info, CalendarDays, Timer, Utensils, User, Users, GraduationCap, ArrowRight, Repeat, CalendarCheck } from 'lucide-react';
import type { WeeklySchedule } from '@/types';

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

export default function SchedulePage() {
  const t = useTranslations('schedule');
  const tc = useTranslations('common');
  const toast = useToast();
  const locale = useLocale();
  const { data: schedule, isLoading } = useWeeklySchedule();
  const { data: overrides, isLoading: loadingOverrides } = useScheduleOverrides();

  const addBlock = useAddScheduleBlock();
  const updateBlock = useUpdateScheduleBlock();
  const deleteBlock = useDeleteScheduleBlock();
  const upsertOverride = useUpsertOverride();
  const deleteOverride = useDeleteOverride();

  // Breaks
  const { data: breaksData, isLoading: loadingBreaks } = useBreaks();
  const createBreakMutation = useCreateBreak();
  const deleteBreakMutation = useDeleteBreak();

  const breaks = useMemo(
    () => (breaksData ?? []).sort((a, b) => {
      if (a.is_recurring !== b.is_recurring) return a.is_recurring ? -1 : 1;
      return a.start_time.localeCompare(b.start_time);
    }),
    [breaksData],
  );

  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingBlock, setEditingBlock] = useState<WeeklySchedule | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showBreakDialog, setShowBreakDialog] = useState(false);

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

  // Break form
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [breakTitle, setBreakTitle] = useState('');
  const [breakIsRecurring, setBreakIsRecurring] = useState(false);
  const [breakDate, setBreakDate] = useState(todayStr);
  const [breakRecurringDays, setBreakRecurringDays] = useState<number[]>([]);
  const [breakStartTime, setBreakStartTime] = useState('12:00');
  const [breakEndTime, setBreakEndTime] = useState('13:00');
  const [breakDescription, setBreakDescription] = useState('');
  const [breakError, setBreakError] = useState('');

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
    const onSuccess = () => {
      setShowBlockDialog(false);
      toast.success(tc('saveSuccess'));
    };
    const onError = (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
      toast.error(tc('saveErrorTitle'), msg);
    };
    if (editingBlock) {
      updateBlock.mutate(
        { id: editingBlock.id, data: { start_time: blockStart, end_time: blockEnd, slot_duration_minutes: blockDuration } },
        { onSuccess, onError }
      );
    } else {
      addBlock.mutate(
        { day_of_week: blockDay, start_time: blockStart, end_time: blockEnd, slot_duration_minutes: blockDuration },
        { onSuccess, onError }
      );
    }
  };

  const breakPresets = [
    { label: t('breakLunch'), desc: t('breakLunchDesc'), start: '12:00', end: '13:00', icon: Utensils },
    { label: t('breakPersonal'), desc: t('breakPersonalDesc'), start: '14:00', end: '14:30', icon: User },
    { label: t('breakMeeting'), desc: t('breakMeetingDesc'), start: '10:00', end: '11:00', icon: Users },
    { label: t('breakTraining'), desc: t('breakTrainingDesc'), start: '15:00', end: '17:00', icon: GraduationCap },
  ];

  const openBreakDialog = () => {
    setBreakTitle('');
    setBreakIsRecurring(false);
    setBreakDate(todayStr);
    setBreakRecurringDays([]);
    setBreakStartTime('12:00');
    setBreakEndTime('13:00');
    setBreakDescription('');
    setBreakError('');
    setShowBreakDialog(true);
  };

  const applyBreakPreset = (preset: { label: string; start: string; end: string }) => {
    setBreakTitle(preset.label);
    setBreakStartTime(preset.start);
    setBreakEndTime(preset.end);
  };

  const toggleRecurringDay = (day: number) => {
    setBreakRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const handleSaveBreak = () => {
    setBreakError('');
    if (!breakTitle.trim()) {
      setBreakError(t('breakTitleRequired'));
      return;
    }
    if (!breakIsRecurring && !breakDate) {
      setBreakError(t('breakDateRequired'));
      return;
    }
    if (breakIsRecurring && breakRecurringDays.length === 0) {
      setBreakError(t('breakSelectDays'));
      return;
    }
    if (!breakStartTime || !breakEndTime) {
      setBreakError(t('breakTimeRequired'));
      return;
    }
    if (toMinutes(breakEndTime) <= toMinutes(breakStartTime)) {
      setBreakError(t('breakEndAfterStart'));
      return;
    }

    createBreakMutation.mutate(
      {
        title: breakTitle.trim(),
        is_recurring: breakIsRecurring,
        date: breakIsRecurring ? null : breakDate,
        recurring_days: breakIsRecurring ? breakRecurringDays : null,
        start_time: padTime(breakStartTime),
        end_time: padTime(breakEndTime),
        description: breakDescription.trim() || null,
      },
      {
        onSuccess: () => {
          setShowBreakDialog(false);
          toast.success(tc('saveSuccess'));
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
          toast.error(tc('saveErrorTitle'), msg);
        },
      },
    );
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
      {
        onSuccess: () => {
          setShowOverrideDialog(false);
          setOverrideDate('');
          setOverrideReason('');
          toast.success(tc('saveSuccess'));
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
          toast.error(tc('saveErrorTitle'), msg);
        },
      }
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
          <div className="space-y-2" aria-label="Chargement">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
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
                    <Badge variant="secondary">{tc('inactive')}</Badge>
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
                    onClick={() =>
                      deleteBlock.mutate(block.id, {
                        onSuccess: () => toast.success(tc('saveSuccess')),
                        onError: (err: unknown) => {
                          const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
                          toast.error(tc('saveErrorTitle'), msg);
                        },
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Breaks / Pauses */}
      <Card>
        <CardHeader>
          <CardTitle>{t('breaks')}</CardTitle>
          <Button size="sm" onClick={openBreakDialog}>
            <Plus className="h-4 w-4" />
            {t('addBreak')}
          </Button>
        </CardHeader>

        {loadingBreaks ? (
          <div className="space-y-2" aria-label="Chargement">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : breaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Coffee className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-gray-900">{t('noBreaks')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('noBreaksDescription')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {breaks.map((brk) => (
              <div
                key={brk.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Coffee className="h-4 w-4 text-amber-500 shrink-0" />
                  {brk.is_recurring ? (
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {(brk.recurring_days ?? []).map((d) => getDayName(d, locale)).join(', ')}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{brk.date}</span>
                  )}
                  <span className="text-sm text-gray-600 shrink-0">
                    <Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                    {formatTime(brk.start_time)} - {formatTime(brk.end_time)}
                  </span>
                  <Badge variant="secondary">{brk.title}</Badge>
                  {brk.is_recurring ? (
                    <Badge variant="success" className="shrink-0">
                      <Repeat className="h-3 w-3 mr-1" />
                      {t('breakRecurringBadge')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">{t('breakOnceBadge')}</Badge>
                  )}
                  {brk.description && (
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {brk.description}
                    </span>
                  )}
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50 shrink-0"
                  onClick={() =>
                    deleteBreakMutation.mutate(brk.id, {
                      onSuccess: () => toast.success(tc('saveSuccess')),
                      onError: (err: unknown) => {
                        const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
                        toast.error(tc('saveErrorTitle'), msg);
                      },
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
          <div className="space-y-2" aria-label="Chargement">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4 rounded-md" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-36 rounded-md" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
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
                  onClick={() =>
                    deleteOverride.mutate(override.id, {
                      onSuccess: () => toast.success(tc('saveSuccess')),
                      onError: (err: unknown) => {
                        const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || tc('saveError');
                        toast.error(tc('saveErrorTitle'), msg);
                      },
                    })
                  }
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
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground -mt-2">
            {editingBlock ? t('editBlockSubtitle') : t('addBlockSubtitle')}
          </p>

          <div className="rounded-xl bg-blue-50/60 border border-blue-200/60 px-4 py-3 flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              {t('blockInfoBanner')}
            </p>
          </div>

          {!editingBlock && (
            <div>
              <Select
                label={t('dayOfWeek')}
                value={String(blockDay)}
                onChange={(e) => setBlockDay(Number(e.target.value))}
                options={dayOptions}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{t('dayOfWeekHint')}</p>
            </div>
          )}

          <div>
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
            <p className="mt-1 text-[11px] text-muted-foreground">{t('timeRangeHint')}</p>
          </div>

          <div>
            <Input
              type="number"
              label={t('slotDuration')}
              value={blockDuration}
              onChange={(e) => setBlockDuration(Number(e.target.value))}
              min={5}
              max={240}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{t('slotDurationHint')}</p>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSaveBlock} loading={addBlock.isPending || updateBlock.isPending}>
              {tc('save')}
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
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground -mt-2">
            {t('addOverrideSubtitle')}
          </p>

          <div className="rounded-xl bg-violet-50/60 border border-violet-200/60 px-4 py-3 flex items-start gap-3">
            <Info className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
            <p className="text-xs text-violet-700 leading-relaxed">
              {t('overrideInfoBanner')}
            </p>
          </div>

          <div>
            <Input
              type="date"
              label={t('breakDate')}
              value={overrideDate}
              onChange={(e) => setOverrideDate(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{t('overrideDateHint')}</p>
          </div>

          <div>
            <Select
              label={t('available')}
              value={overrideAvailable ? 'true' : 'false'}
              onChange={(e) => setOverrideAvailable(e.target.value === 'true')}
              options={[
                { value: 'false', label: t('unavailable') },
                { value: 'true', label: t('specialHours') },
              ]}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{t('overrideAvailableHint')}</p>
          </div>

          {overrideAvailable && (
            <div>
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
              <p className="mt-1 text-[11px] text-muted-foreground">{t('timeRangeHint')}</p>
            </div>
          )}

          <div>
            <Textarea
              label={t('reason')}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">{t('overrideReasonHint')}</p>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSaveOverride} loading={upsertOverride.isPending}>
              {tc('save')}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Break Dialog */}
      <Dialog
        open={showBreakDialog}
        onClose={() => setShowBreakDialog(false)}
        title={t('addBreak')}
      >
        <div className="space-y-5">
          {/* Subtitle */}
          <p className="text-sm text-muted-foreground -mt-1">
            {t('breakDialogSubtitle')}
          </p>

          {/* Info banner */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              {t('breakInfoBanner')}
            </p>
          </div>

          {/* Section 1: Presets */}
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white">1</span>
              <h3 className="text-sm font-semibold text-foreground">{t('breakStepType')}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 ml-7">
              {t('breakPresetsHint')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {breakPresets.map((preset) => {
                const PresetIcon = preset.icon;
                const isActive = breakTitle === preset.label;
                const durationMin = toMinutes(preset.end) - toMinutes(preset.start);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyBreakPreset(preset)}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm'
                        : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'
                    }`}
                  >
                    <div className={`rounded-lg p-2 shrink-0 ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <PresetIcon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <span className={`block text-sm font-medium leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {preset.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">
                        {preset.start} → {preset.end} · {durationMin} min
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-xs text-muted-foreground">{t('breakCustomHint')}</span>
            </div>
          </div>

          {/* Section 2: Details */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white">2</span>
              <h3 className="text-sm font-semibold text-foreground">{t('breakStepDetails')}</h3>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <Input
                  label={t('breakTitle')}
                  value={breakTitle}
                  onChange={(e) => setBreakTitle(e.target.value)}
                  placeholder={t('breakTitlePlaceholder')}
                  required
                />
                <p className="mt-1 text-[11px] text-muted-foreground ml-0.5">{t('breakTitleHint')}</p>
              </div>

              {/* Mode: One-time vs Recurring */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">{t('breakModeLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBreakIsRecurring(false)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      !breakIsRecurring
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'
                    }`}
                  >
                    <CalendarCheck className={`h-4 w-4 shrink-0 ${!breakIsRecurring ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <span className={`block text-sm font-medium ${!breakIsRecurring ? 'text-primary' : 'text-foreground'}`}>{t('breakModeOnce')}</span>
                      <span className="block text-[11px] text-muted-foreground">{t('breakModeOnceDesc')}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakIsRecurring(true)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      breakIsRecurring
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-card hover:border-primary/30 hover:bg-muted/40'
                    }`}
                  >
                    <Repeat className={`h-4 w-4 shrink-0 ${breakIsRecurring ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <span className={`block text-sm font-medium ${breakIsRecurring ? 'text-primary' : 'text-foreground'}`}>{t('breakModeRecurring')}</span>
                      <span className="block text-[11px] text-muted-foreground">{t('breakModeRecurringDesc')}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date (one-time) OR Day picker (recurring) */}
              {breakIsRecurring ? (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t('breakSelectDays')} <span className="text-destructive">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 7 }, (_, i) => {
                      const isSelected = breakRecurringDays.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleRecurringDay(i)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-primary text-white shadow-sm'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                          }`}
                        >
                          {getDayName(i, locale)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground ml-0.5">{t('breakSelectDaysHint')}</p>
                </div>
              ) : (
                <div>
                  <Input
                    type="date"
                    label={t('breakDate')}
                    value={breakDate}
                    onChange={(e) => setBreakDate(e.target.value)}
                    min={todayStr}
                    required
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground ml-0.5">{t('breakDateHint')}</p>
                </div>
              )}

              {/* Time range */}
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="time"
                    label={t('breakStart')}
                    value={breakStartTime}
                    onChange={(e) => setBreakStartTime(e.target.value)}
                    required
                  />
                  <Input
                    type="time"
                    label={t('breakEnd')}
                    value={breakEndTime}
                    onChange={(e) => setBreakEndTime(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] text-muted-foreground ml-0.5">{t('breakTimeHint')}</p>
                  {breakStartTime && breakEndTime && toMinutes(breakEndTime) > toMinutes(breakStartTime) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                      <Timer className="h-3 w-3" />
                      {t('breakDuration', { duration: toMinutes(breakEndTime) - toMinutes(breakStartTime) })}
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Textarea
                  label={t('breakDescription')}
                  value={breakDescription}
                  onChange={(e) => setBreakDescription(e.target.value)}
                  placeholder={t('breakDescriptionPlaceholder')}
                  rows={2}
                />
                <p className="mt-1 text-[11px] text-muted-foreground ml-0.5">{t('breakDescriptionHint')}</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {breakError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              {breakError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1 border-t border-border">
            <Button variant="outline" onClick={() => setShowBreakDialog(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSaveBreak} loading={createBreakMutation.isPending}>
              <Coffee className="h-4 w-4" />
              {t('breakSave')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
