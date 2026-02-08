'use client';

import { useTranslations } from 'next-intl';
import { useCrmStats } from '@/hooks/useCrmStats';
import StatCard from '@/components/dashboard/StatCard';
import AppointmentChart from '@/components/dashboard/AppointmentChart';
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments';
import DoctorScheduleWidget from '@/components/dashboard/DoctorScheduleWidget';
import { Users, CalendarCheck, Clock, XCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const now = new Date();
  const from = format(startOfMonth(now), 'yyyy-MM-dd');
  const to = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: stats } = useCrmStats({ from, to });

  const totalAppointments = stats
    ? stats.pending + stats.confirmed + stats.cancelled + stats.completed + stats.no_show
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('todayAppointments')}
          value={totalAppointments}
          subtitle={`${t('appointments')}`}
          icon={CalendarCheck}
          iconBg="bg-primary-50"
          iconColor="text-primary"
        />
        <StatCard
          title={t('pending')}
          value={stats?.pending ?? 0}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-600"
        />
        <StatCard
          title={t('confirmed')}
          value={stats?.confirmed ?? 0}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title={t('cancelled')}
          value={stats?.cancelled ?? 0}
          icon={XCircle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Charts and Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AppointmentChart />
        </div>
        <div>
          <DoctorScheduleWidget />
        </div>
      </div>

      {/* Upcoming Appointments Table */}
      <UpcomingAppointments />
    </div>
  );
}
