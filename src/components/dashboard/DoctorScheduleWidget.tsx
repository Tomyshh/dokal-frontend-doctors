'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useWeeklySchedule } from '@/hooks/useSchedule';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { getDayName, formatTime } from '@/lib/utils';
import { Clock } from 'lucide-react';

export default function DoctorScheduleWidget() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { data: schedule, isLoading } = useWeeklySchedule();

  const today = new Date().getDay();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('doctorSchedule')}</CardTitle>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-3" aria-label="Chargement">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {schedule
            ?.filter((s) => s.is_active)
            ?.sort((a, b) => a.day_of_week - b.day_of_week)
            ?.map((block) => (
              <div
                key={block.id}
                className={`flex items-center justify-between py-2 px-3 rounded-xl ${
                  block.day_of_week === today ? 'bg-primary-50 border border-primary-100' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-gray-900">
                    {getDayName(block.day_of_week, locale)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatTime(block.start_time)} - {formatTime(block.end_time)}
                </span>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
