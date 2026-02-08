'use client';

import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCrmStats } from '@/hooks/useCrmStats';
import { Spinner } from '@/components/ui/Spinner';
import { ApiErrorCallout } from '@/components/ui/ApiErrorCallout';
import { format, startOfMonth, endOfMonth } from 'date-fns';

type ChartRow = { status: string; value: number };

export default function AppointmentChart() {
  const t = useTranslations('dashboard');
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('patientOverview')}</CardTitle>
      </CardHeader>
      <div className="h-[300px]">
        {isError ? (
          <ApiErrorCallout error={error} />
        ) : isLoading ? (
          <Spinner />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={6} layout="vertical" margin={{ left: 16, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} fill="#94A3B8" />
              <YAxis
                type="category"
                dataKey="status"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={110}
                fill="#94A3B8"
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
