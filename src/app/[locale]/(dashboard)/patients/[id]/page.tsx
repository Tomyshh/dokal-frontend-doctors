'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { usePatient } from '@/hooks/usePatient';
import { useUpdateCrmPatient } from '@/hooks/useCrmPatients';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { getAppointmentStatusLabel } from '@/lib/appointmentStatus';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { CrmPatientListItem, Appointment } from '@/types';
import { formatMissingFieldLabel } from '@/lib/crm';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const ta = useTranslations('appointments');
  const tcal = useTranslations('calendar');
  const locale = useLocale();
  const { data: patient, isLoading } = usePatient(id);
  const updateMutation = useUpdateCrmPatient();
  const [editMode, setEditMode] = useState(false);

  const record = useMemo(() => {
    if (!patient) return null;
    const anyPatient = patient as unknown as { patient?: CrmPatientListItem };
    return (anyPatient.patient || (patient as unknown as CrmPatientListItem)) as CrmPatientListItem;
  }, [patient]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<string>('');
  const [teudat, setTeudat] = useState<string>('');

  useEffect(() => {
    if (!record) return;
    setFirstName(record.first_name || '');
    setLastName(record.last_name || '');
    setPhone(record.phone || '');
    setEmail(record.email || '');
    setCity(record.city || '');
    setDob(record.date_of_birth || '');
    setSex((record.sex as string) || '');
  }, [record?.id]);

  if (isLoading) return <Spinner size="lg" />;
  if (!patient || !record?.id) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('notFound')}
      </div>
    );
  }

  const displayName = `${record.first_name || ''} ${record.last_name || ''}`.trim() || '-';
  const missingFields = record.missing_fields || [];
  const isIncomplete = record.is_incomplete === true;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/patients">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 rtl-flip-arrow" />
          {tc('back')}
        </Button>
      </Link>

      {/* Profile Header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar src={record.avatar_url} firstName={record.first_name} lastName={record.last_name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {displayName}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              {record.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> {record.phone}
                </span>
              )}
              {record.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {record.email}
                </span>
              )}
              {record.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {record.city}
                </span>
              )}
              {record.date_of_birth && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {formatDate(record.date_of_birth, 'dd/MM/yyyy', locale)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {record.status && (
                <Badge className={record.status === 'linked' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}>
                  {record.status === 'linked' ? t('statusLinked') : t('statusDraft')}
                </Badge>
              )}
              {isIncomplete && (
                <Badge className="bg-red-50 text-red-700 border border-red-200">
                  {t('incomplete')}
                </Badge>
              )}
              {record.has_teudat_zehut === false && (
                <Badge className="bg-gray-100 text-gray-700">
                  {t('noTeudat')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={editMode ? 'outline' : 'default'}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? tc('close') : tc('edit')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Missing fields */}
      {isIncomplete && missingFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {t('missingFields')}
            </CardTitle>
          </CardHeader>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            {missingFields.map((f) => (
              <li key={f}>{formatMissingFieldLabel(tcal, f)}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Edit form */}
      {editMode && (
        <Card>
          <CardHeader>
            <CardTitle>{t('editPatient')}</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={tc('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label={tc('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label={tc('phone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label={tc('email')} value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label={t('city')} value={city} onChange={(e) => setCity(e.target.value)} />
            <Input type="date" label={t('dateOfBirth')} value={dob} onChange={(e) => setDob(e.target.value)} />
            <Select
              id="sex"
              label={t('sex')}
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              options={[
                { value: '', label: t('optional') },
                { value: 'male', label: t('sexMale') },
                { value: 'female', label: t('sexFemale') },
                { value: 'other', label: t('sexOther') },
              ]}
            />
            <Input
              label={t('teudatZehut')}
              value={teudat}
              onChange={(e) => setTeudat(e.target.value)}
              placeholder={t('teudatZehutPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditMode(false)} disabled={updateMutation.isPending}>
              {tc('cancel')}
            </Button>
            <Button
              loading={updateMutation.isPending}
              onClick={async () => {
                await updateMutation.mutateAsync({
                  id: record.id,
                  data: {
                    first_name: firstName.trim() || null,
                    last_name: lastName.trim() || null,
                    phone: phone.trim() || null,
                    email: email.trim() || null,
                    city: city.trim() || null,
                    date_of_birth: dob || null,
                    sex: (sex || null) as 'male' | 'female' | 'other' | null,
                    teudat_zehut: teudat.trim() || null,
                  },
                });
                setEditMode(false);
              }}
            >
              {tc('save')}
            </Button>
          </div>
        </Card>
      )}

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle>{t('appointmentHistory')}</CardTitle>
        </CardHeader>
        {(((patient as any).appointment_history || (patient as any).appointments) as Appointment[] | undefined)?.length ? (
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
                {(((patient as any).appointment_history || (patient as any).appointments) as Appointment[]).map((appt) => (
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
