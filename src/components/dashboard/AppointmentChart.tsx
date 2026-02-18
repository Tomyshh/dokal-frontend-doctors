'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCrmStats } from '@/hooks/useCrmStats';
import { Skeleton } from '@/components/ui/Skeleton';
import { ApiErrorCallout } from '@/components/ui/ApiErrorCallout';
import { format, startOfMonth, endOfMonth } from 'date-fns';

type ChartRow = { status: string; value: number };

export default function AppointmentChart() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const rtl = locale === 'he';
  const now = new Date();
  const from = format(startOfMonth(now), 'yyyy-MM-dd');
  const to = format(endOfMonth(now), 'yyyy-MM-dd');
  const { data: stats, isLoading, isError, error } = useCrmStats({ from, to });

  const data: ChartRow[] = stats
    ? [
        { status: t('pending'), value: stats.pending },
        { status: t('confirmed'), value: stats.confirmed },
        { status: t('completed'), value: stats.completed },
        { status: t('cancelled'), value: stats.cancelled },
        { status: t('noShow'), value: stats.no_show },
      ]
    : [];

  const yAxisTick = ({
    x = 0,
    y = 0,
    payload,
  }: {
    // Recharts may provide string|number for coordinates depending on layout.
    x?: string | number;
    y?: string | number;
    payload?: { value?: string };
    // Allow extra fields so the signature matches Recharts tick props.
    [key: string]: unknown;
  }) => {
    const value = payload?.value ?? '';
    const xNum = typeof x === 'number' ? x : Number(x) || 0;
    const yNum = typeof y === 'number' ? y : Number(y) || 0;
    return (
      <text
        x={xNum}
        y={yNum}
        dy={4}
        dx={rtl ? 8 : -8}
        textAnchor={rtl ? 'start' : 'end'}
        fill="#94A3B8"
        fontSize={12}
        style={{ direction: rtl ? 'rtl' : 'ltr', unicodeBidi: 'plaintext' }}
      >
        {value}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('patientOverview')}</CardTitle>
      </CardHeader>
      <div className="h-[300px]">
        {isError ? (
          <ApiErrorCallout error={error} />
        ) : isLoading ? (
          <div className="h-full flex flex-col justify-center gap-4 px-4" aria-label="Chargement">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-4 flex-1 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barGap={6}
              layout="vertical"
              margin={rtl ? { left: 16, right: 32 } : { left: 16, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} fill="#94A3B8" />
              <YAxis
                type="category"
                dataKey="status"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={rtl ? 150 : 110}
                fill="#94A3B8"
                orientation={rtl ? 'right' : 'left'}
                tick={yAxisTick}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
                }}
              />
              <Bar dataKey="value" fill="#005044" radius={[6, 6, 6, 6]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
