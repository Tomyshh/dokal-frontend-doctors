'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReasons, useAddReason, useUpdateReason } from '@/hooks/useSettings';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Pencil, ClipboardList } from 'lucide-react';
import type { AppointmentReason } from '@/types';

export default function ReasonsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { data: reasons, isLoading } = useReasons();
  const addReason = useAddReason();
  const updateReason = useUpdateReason();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<AppointmentReason | null>(null);
  const [label, setLabel] = useState('');
  const [labelFr, setLabelFr] = useState('');
  const [labelHe, setLabelHe] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAdd = () => {
    setEditing(null);
    setLabel('');
    setLabelFr('');
    setLabelHe('');
    setIsActive(true);
    setShowDialog(true);
  };

  const openEdit = (reason: AppointmentReason) => {
    setEditing(reason);
    setLabel(reason.label);
    setLabelFr(reason.label_fr || '');
    setLabelHe(reason.label_he || '');
    setIsActive(reason.is_active);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) {
      updateReason.mutate(
        { id: editing.id, data: { label, label_fr: labelFr || null, label_he: labelHe || null, is_active: isActive } },
        { onSuccess: () => setShowDialog(false) }
      );
    } else {
      addReason.mutate(
        { label, label_fr: labelFr || null, label_he: labelHe || null, is_active: isActive },
        { onSuccess: () => setShowDialog(false) }
      );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('reasons')}</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          {tc('add')}
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-2" aria-label="Chargement">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-56 rounded-md" />
                    <Skeleton className="h-3 w-40 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : !reasons?.length ? (
          <EmptyState icon={ClipboardList} title={tc('noResults')} action={<Button onClick={openAdd}><Plus className="h-4 w-4" />{tc('add')}</Button>} />
        ) : (
          <div className="space-y-2">
            {reasons.map((reason) => (
              <div key={reason.id} className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reason.label}</p>
                    {reason.label_fr && <p className="text-xs text-muted-foreground">{reason.label_fr}</p>}
                  </div>
                  <Badge variant={reason.is_active ? 'success' : 'secondary'}>
                    {reason.is_active ? tc('active') : tc('inactive')}
                  </Badge>
                </div>
                <Button size="icon-sm" variant="ghost" onClick={() => openEdit(reason)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} title={editing ? tc('edit') : tc('add')}>
        <div className="space-y-4">
          <Input label={t('labelEn')} value={label} onChange={(e) => setLabel(e.target.value)} required />
          <Input label={t('labelFr')} value={labelFr} onChange={(e) => setLabelFr(e.target.value)} />
          <Input label={t('labelHe')} value={labelHe} onChange={(e) => setLabelHe(e.target.value)} />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
            <label htmlFor="active" className="text-sm text-gray-700">{tc('active')}</label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)}>{tc('cancel')}</Button>
            <Button onClick={handleSave} loading={addReason.isPending || updateReason.isPending}>{tc('save')}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
