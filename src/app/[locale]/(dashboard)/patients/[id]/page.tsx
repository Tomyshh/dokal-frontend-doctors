'use client';

import { use } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePatient } from '@/hooks/usePatient';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { ArrowLeft, Phone, Mail, MapPin, Heart, Pill, AlertTriangle, Syringe, Calendar } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const ta = useTranslations('appointments');
  const locale = useLocale();
  const { data: patient, isLoading } = usePatient(id);

  if (isLoading) return <Spinner size="lg" />;
  if (!patient) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('notFound')}
      </div>
    );
  }

  const p = patient.profile;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/appointments">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 rtl-flip-arrow" />
          {tc('back')}
        </Button>
      </Link>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar src={p.avatar_url} firstName={p.first_name} lastName={p.last_name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {p.first_name} {p.last_name}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {p.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {p.phone}
                </span>
              )}
              {p.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {p.email}
                </span>
              )}
              {p.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {p.city}
                </span>
              )}
              {p.date_of_birth && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {formatDate(p.date_of_birth, 'dd/MM/yyyy', locale)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              {t('healthProfile')}
            </CardTitle>
          </CardHeader>
          {patient.health_profile ? (
            <div className="space-y-3">
              {patient.health_profile.blood_type && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('bloodType')}</span>
                  <Badge variant="destructive">{patient.health_profile.blood_type}</Badge>
                </div>
              )}
              {patient.health_profile.kupat_holim && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('insurance')}</span>
                  <span className="font-medium">{patient.health_profile.kupat_holim}</span>
                </div>
              )}
              {patient.health_profile.family_doctor_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('familyDoctor')}</span>
                  <span className="font-medium">{patient.health_profile.family_doctor_name}</span>
                </div>
              )}
              {patient.health_profile.emergency_contact_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('emergencyContact')}</span>
                  <span className="font-medium">
                    {patient.health_profile.emergency_contact_name}
                    {patient.health_profile.emergency_contact_phone && ` (${patient.health_profile.emergency_contact_phone})`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noHealthProfile')}</p>
          )}
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('allergies')}
            </CardTitle>
          </CardHeader>
          {patient.allergies?.length > 0 ? (
            <div className="space-y-2">
              {patient.allergies.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-yellow-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.name}</p>
                    {a.reaction && <p className="text-xs text-muted-foreground">{a.reaction}</p>}
                  </div>
                  {a.severity && (
                    <Badge variant={a.severity === 'severe' ? 'destructive' : 'warning'}>
                      {a.severity}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-blue-500" />
              {t('medications')}
            </CardTitle>
          </CardHeader>
          {patient.medications?.length > 0 ? (
            <div className="space-y-2">
              {patient.medications.map((m) => (
                <div key={m.id} className="py-2 px-3 rounded-lg bg-blue-50">
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    {m.dosage && <span>{m.dosage}</span>}
                    {m.frequency && <span>{m.frequency}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-green-500" />
              {t('conditions')}
            </CardTitle>
          </CardHeader>
          {patient.conditions?.length > 0 ? (
            <div className="space-y-2">
              {patient.conditions.map((c) => (
                <div key={c.id} className="py-2 px-3 rounded-lg bg-green-50">
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  {c.severity && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.severity}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">-</p>
          )}
        </Card>
      </div>

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('appointmentHistory')}</CardTitle>
        </CardHeader>
        {patient.appointment_history?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase py-3 px-2">{tc('date')}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase py-3 px-2">{tc('time')}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase py-3 px-2">{tc('status')}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase py-3 px-2">{tc('notes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {patient.appointment_history.map((appt) => (
                  <tr key={appt.id} className="hover:bg-muted/30">
                    <td className="py-3 px-2 text-sm">{formatDate(appt.appointment_date, 'dd/MM/yyyy', locale)}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">
                      {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                    </td>
                    <td className="py-3 px-2">
                      <Badge className={getStatusColor(appt.status)}>
                        {getAppointmentStatusLabel(ta, appt.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {appt.practitioner_notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">-</p>
        )}
      </Card>
    </div>
  );
}
