'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useCrmStats } from '@/hooks/useCrmStats';
import StatCard from '@/components/dashboard/StatCard';
import AppointmentChart from '@/components/dashboard/AppointmentChart';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';
import DashboardCalendarWidget from '@/components/dashboard/DashboardCalendarWidget';
import DashboardDaySidebar from '@/components/dashboard/DashboardDaySidebar';
import { Users, CalendarCheck, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { usePendingReviewCount } from '@/hooks/useExternalEvents';
import { Link } from '@/i18n/routing';

function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('goodMorning');
  if (hour < 18) return t('goodAfternoon');
  return t('goodEvening');
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const now = new Date();
  const from = format(startOfMonth(now), 'yyyy-MM-dd');
  const to = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: stats } = useCrmStats({ from, to });
  const { data: pendingReviewCount } = usePendingReviewCount();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const totalAppointments = stats
    ? stats.pending + stats.confirmed + stats.cancelled + stats.completed + stats.no_show
    : 0;

  const greeting = useMemo(() => getGreeting(t), [t]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-6">
      {/* Page Title with greeting */}
      <div className="dashboard-fade-in">
        <p className="text-sm text-muted-foreground">{greeting}</p>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="dashboard-fade-in" style={{ animationDelay: '50ms' }}>
          <StatCard
            title={t('todayAppointments')}
            value={totalAppointments}
            subtitle={`${t('appointments')}`}
            icon={CalendarCheck}
            iconBg="bg-primary-50"
            iconColor="text-primary"
            accentColor="border-l-primary"
          />
        </div>
        <div className="dashboard-fade-in" style={{ animationDelay: '100ms' }}>
          <StatCard
            title={t('pending')}
            value={stats?.pending ?? 0}
            icon={Clock}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
            accentColor="border-l-yellow-500"
          />
        </div>
        <div className="dashboard-fade-in" style={{ animationDelay: '150ms' }}>
          <StatCard
            title={t('confirmed')}
            value={stats?.confirmed ?? 0}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            accentColor="border-l-blue-500"
          />
        </div>
        <div className="dashboard-fade-in" style={{ animationDelay: '200ms' }}>
          <StatCard
            title={t('cancelled')}
            value={stats?.cancelled ?? 0}
            icon={XCircle}
            iconBg="bg-red-50"
            iconColor="text-red-600"
            accentColor="border-l-red-500"
          />
        </div>
        {(pendingReviewCount ?? 0) > 0 && (
          <div className="dashboard-fade-in" style={{ animationDelay: '250ms' }}>
            <Link href="/calendar">
              <StatCard
                title={t('pendingReviewCount')}
                value={pendingReviewCount ?? 0}
                icon={AlertTriangle}
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
                accentColor="border-l-orange-500"
              />
            </Link>
          </div>
        )}
      </div>

      {/* Charts and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dashboard-fade-in" style={{ animationDelay: '250ms' }}>
          <AppointmentChart />
        </div>
        <div className="dashboard-fade-in" style={{ animationDelay: '300ms' }}>
          <DashboardCalendarWidget onDayClick={handleDayClick} />
        </div>
      </div>

      {/* Upcoming Appointments Table */}
      <div className="dashboard-fade-in" style={{ animationDelay: '350ms' }}>
        <UpcomingAppointments />
      </div>

      {/* Day sidebar */}
      {selectedDate && (
        <DashboardDaySidebar
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
