'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import type { QuestionnaireField } from '@/types';

interface QuestionnaireFieldsBuilderProps {
  value: QuestionnaireField[];
  onChange: (fields: QuestionnaireField[]) => void;
  disabled?: boolean;
}

const MAX_LINES_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }));

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

const EMPTY_FIELD: QuestionnaireField = {
  id: '',
  label: '',
  label_fr: null,
  label_he: null,
  required: false,
  max_lines: 1,
};

export function QuestionnaireFieldsBuilder({
  value,
  onChange,
  disabled,
}: QuestionnaireFieldsBuilderProps) {
  const t = useTranslations('questionnaire');
  const tc = useTranslations('common');

  const [showDialog, setShowDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<QuestionnaireField>(EMPTY_FIELD);
  const [autoId, setAutoId] = useState(true);

  const openAdd = () => {
    setEditingIndex(null);
    setForm(EMPTY_FIELD);
    setAutoId(true);
    setShowDialog(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setForm({ ...value[index] });
    setAutoId(false);
    setShowDialog(true);
  };

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleLabelChange = (label: string) => {
    setForm((prev) => ({
      ...prev,
      label,
      id: autoId ? slugify(label) : prev.id,
    }));
  };

  const handleSave = () => {
    if (!form.label.trim() || !form.id.trim()) return;

    const field: QuestionnaireField = {
      ...form,
      label: form.label.trim(),
      id: form.id.trim(),
      label_fr: form.label_fr?.trim() || null,
      label_he: form.label_he?.trim() || null,
    };

    if (editingIndex !== null) {
      const next = [...value];
      next[editingIndex] = field;
      onChange(next);
    } else {
      onChange([...value, field]);
    }
    setShowDialog(false);
  };

  const isValid = form.label.trim().length > 0 && form.id.trim().length > 0;

  return (
    <div className="space-y-2">
      {value.map((field, index) => (
        <div
          key={field.id}
          className="flex items-center gap-2 p-3 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900 truncate">{field.label}</span>
              {field.required && (
                <Badge variant="warning" className="text-xs px-1.5 py-0">
                  {t('required')}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 rounded">
                {field.id}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('linesLabel', { count: field.max_lines })}
              {field.label_fr && ` · FR: ${field.label_fr}`}
              {field.label_he && ` · HE: ${field.label_he}`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => openEdit(index)}
              disabled={disabled}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => removeField(index)}
              disabled={disabled}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">{t('noFields')}</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openAdd}
        disabled={disabled}
        className="mt-1"
      >
        <Plus className="h-4 w-4" />
        {t('addField')}
      </Button>

      {/* Add / Edit Dialog */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingIndex !== null ? t('editField') : t('addField')}
      >
        <div className="space-y-4">
          <Input
            label={t('labelEn')}
            value={form.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {t('fieldId')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => {
                setAutoId(false);
                setForm((prev) => ({
                  ...prev,
                  id: e.target.value.replace(/[^a-z0-9_]/g, ''),
                }));
              }}
              placeholder="symptoms"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">{t('fieldIdHint')}</p>
          </div>

          <Input
            label={t('labelFr')}
            value={form.label_fr ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, label_fr: e.target.value }))}
          />

          <Input
            label={t('labelHe')}
            value={form.label_he ?? ''}
            onChange={(e) => setForm((prev) => ({ ...prev, label_he: e.target.value }))}
            dir="rtl"
          />

          <Select
            label={t('maxLines')}
            value={String(form.max_lines)}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, max_lines: Number(e.target.value) }))
            }
            options={MAX_LINES_OPTIONS}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="qf-required"
              checked={form.required}
              onChange={(e) => setForm((prev) => ({ ...prev, required: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <label htmlFor="qf-required" className="text-sm text-gray-700">
              {t('required')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!isValid}>
              {tc('save')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
