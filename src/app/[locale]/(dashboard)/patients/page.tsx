'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCrmPatients } from '@/hooks/useCrmPatients';
import { Link } from '@/i18n/routing';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CrmPatientListItem } from '@/types';
import { formatMissingFieldLabel } from '@/lib/crm';

const PAGE_SIZE = 30;

export default function PatientsPage() {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const tcal = useTranslations('calendar');

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('');
  const [incomplete, setIncomplete] = useState<string>('');
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError } = useCrmPatients({
    q: q.trim() || undefined,
    status: (status || undefined) as 'draft' | 'linked' | undefined,
    incomplete: incomplete === '' ? undefined : incomplete === 'true',
    limit: PAGE_SIZE,
    offset,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const patients = data?.patients || [];

  const rows = useMemo(() => {
    return patients.map((p) => ({
      ...p,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || '-',
    }));
  }, [patients]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('patientsTitle')}</h1>
      </div>

      <Card>
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Input
            label={t('search')}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOffset(0);
            }}
            placeholder={t('searchPlaceholder')}
          />
          <Select
            id="status"
            label={tc('status')}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setOffset(0);
            }}
            options={[
              { value: '', label: tc('all') },
              { value: 'draft', label: t('statusDraft') },
              { value: 'linked', label: t('statusLinked') },
            ]}
          />
          <Select
            id="incomplete"
            label={t('incompleteFilter')}
            value={incomplete}
            onChange={(e) => {
              setIncomplete(e.target.value);
              setOffset(0);
            }}
            options={[
              { value: '', label: tc('all') },
              { value: 'true', label: t('incompleteOnly') },
              { value: 'false', label: t('completeOnly') },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="py-2">
            <TableSkeleton rows={10} columns={6} />
          </div>
        ) : isError ? (
          <div className="text-sm text-muted-foreground">{tc('apiError')}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Users} title={t('noPatients')} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
                      {tc('patient')}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
                      {tc('phone')}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
                      {tc('email')}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
                      {t('registration')}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
                      {t('toComplete')}
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-3">
                      {tc('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rows.map((p: CrmPatientListItem & { name: string }) => {
                    const missing = p.missing_fields || [];
                    const missingLabel = missing.length
                      ? missing.map((f) => formatMissingFieldLabel(tcal, f)).join(', ')
                      : '';
                    return (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                          <Link href={`/patients/${p.id}`} className="group">
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                              {p.name}
                            </p>
                            {(p.status === 'draft' || p.is_incomplete) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {p.status === 'draft' && (
                                  <Badge className="bg-amber-50 text-amber-800 border border-amber-200">
                                    {tcal('patientDraftBadge')}
                                  </Badge>
                                )}
                                {p.is_incomplete && (
                                  <Badge className="bg-red-50 text-red-700 border border-red-200">
                                    {tcal('missingInfoBadge')}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600">{p.phone || '-'}</td>
                        <td className="py-3 px-3 text-sm text-gray-600">{p.email || '-'}</td>
                        <td className="py-3 px-3">
                          {p.status ? (
                            <Badge className={p.status === 'linked' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}>
                              {p.status === 'linked' ? t('statusLinked') : t('statusDraft')}
                            </Badge>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-3 text-sm text-gray-600" title={missingLabel || undefined}>
                          {missing.length ? (
                            <span>
                              {missing.slice(0, 2).map((f) => formatMissingFieldLabel(tcal, f)).join(', ')}
                              {missing.length > 2 ? ` +${missing.length - 2}` : ''}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link href={`/patients/${p.id}`}>
                            <Button size="sm" variant="outline" className="h-8">
                              {t('open')}
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {data?.total || 0} {t('patientsTitle').toLowerCase()}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                    disabled={offset === 0}
                  >
                    <ChevronLeft className="h-4 w-4 rtl-flip-arrow" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + PAGE_SIZE)}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4 rtl-flip-arrow" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

