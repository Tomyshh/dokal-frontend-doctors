'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInstructions, useAddInstruction, useUpdateInstruction } from '@/hooks/useSettings';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Pencil, FileText } from 'lucide-react';
import type { AppointmentInstruction } from '@/types';

export default function InstructionsPage() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const { data: instructions, isLoading } = useInstructions();
  const addInstruction = useAddInstruction();
  const updateInstruction = useUpdateInstruction();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<AppointmentInstruction | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openAdd = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setIsActive(true);
    setShowDialog(true);
  };

  const openEdit = (instruction: AppointmentInstruction) => {
    setEditing(instruction);
    setTitle(instruction.title);
    setContent(instruction.content);
    setIsActive(instruction.is_active);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editing) {
      updateInstruction.mutate(
        { id: editing.id, data: { title, content, is_active: isActive } },
        { onSuccess: () => setShowDialog(false) }
      );
    } else {
      addInstruction.mutate(
        { title, content, is_active: isActive },
        { onSuccess: () => setShowDialog(false) }
      );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('instructions')}</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          {tc('add')}
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-3" aria-label="Chargement">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-border/50 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-56 rounded-md" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-[85%] rounded-md" />
                    <Skeleton className="h-3 w-[70%] rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : !instructions?.length ? (
          <EmptyState icon={FileText} title={tc('noResults')} action={<Button onClick={openAdd}><Plus className="h-4 w-4" />{tc('add')}</Button>} />
        ) : (
          <div className="space-y-3">
            {instructions.map((instruction) => (
              <div key={instruction.id} className="border border-border/50 rounded-xl p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{instruction.title}</h3>
                      <Badge variant={instruction.is_active ? 'success' : 'secondary'}>
                        {instruction.is_active ? tc('active') : tc('inactive')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{instruction.content}</p>
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(instruction)} className="ml-2 shrink-0">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showDialog} onClose={() => setShowDialog(false)} title={editing ? tc('edit') : tc('add')}>
        <div className="space-y-4">
          <Input label={t('instructionTitle')} value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea label={t('instructionContent')} value={content} onChange={(e) => setContent(e.target.value)} rows={5} required />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
            <label htmlFor="active" className="text-sm text-gray-700">{tc('active')}</label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDialog(false)}>{tc('cancel')}</Button>
            <Button onClick={handleSave} loading={addInstruction.isPending || updateInstruction.isPending}>{tc('save')}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
