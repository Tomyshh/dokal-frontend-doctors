'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  TextCursorInput,
  AlignLeft,
} from 'lucide-react';
import type { QuestionnaireField } from '@/types';

interface QuestionnaireFieldsBuilderProps {
  value: QuestionnaireField[];
  onChange: (fields: QuestionnaireField[]) => void;
  disabled?: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || `field_${Date.now()}`;
}

const EMPTY_FIELD: QuestionnaireField = {
  id: '',
  label: '',
  required: false,
  max_lines: 1,
};

const INPUT_TYPE_OPTIONS = [
  { value: '1', key: 'shortAnswer' },
  { value: '3', key: 'longAnswer' },
] as const;

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

  const openAdd = () => {
    setEditingIndex(null);
    setForm(EMPTY_FIELD);
    setShowDialog(true);
  };

  const openEdit = (index: number) => {
    setEditingIndex(index);
    setForm({ ...value[index] });
    setShowDialog(true);
  };

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!form.label.trim()) return;

    const field: QuestionnaireField = {
      ...form,
      label: form.label.trim(),
      id: form.id || slugify(form.label),
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

  const isShort = (f: QuestionnaireField) => f.max_lines <= 1;

  return (
    <div className="space-y-3">
      {value.map((field, index) => (
        <div
          key={field.id || index}
          className="flex items-start gap-3 p-4 border border-border/50 rounded-xl hover:bg-muted/30 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-1 cursor-grab" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{field.label}</span>
              {field.required && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  {t('required')}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              {isShort(field) ? (
                <><TextCursorInput className="h-3 w-3" />{t('shortAnswer')}</>
              ) : (
                <><AlignLeft className="h-3 w-3" />{t('longAnswer')}</>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(index)} disabled={disabled}>
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
        <p className="text-sm text-muted-foreground py-3">{t('noFields')}</p>
      )}

      <Button type="button" variant="outline" size="sm" onClick={openAdd} disabled={disabled} className="mt-2">
        <Plus className="h-4 w-4" />
        {t('addField')}
      </Button>

      {/* ── Add / Edit Dialog ── */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingIndex !== null ? t('editField') : t('addField')}
      >
        <div className="space-y-5">
          {/* Question label */}
          <div>
            <Input
              label={t('fieldLabel')}
              placeholder={t('fieldLabelPlaceholder')}
              value={form.label}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  label: e.target.value,
                  id: editingIndex !== null ? prev.id : slugify(e.target.value),
                }))
              }
              required
            />
            <p className="text-xs text-muted-foreground mt-1.5">{t('fieldLabelHint')}</p>
          </div>

          {/* Answer type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">{t('answerType')}</label>
            <div className="grid grid-cols-2 gap-2">
              {INPUT_TYPE_OPTIONS.map(({ value: v, key }) => {
                const selected = String(form.max_lines <= 1 ? '1' : '3') === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, max_lines: Number(v) }))}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border text-foreground/70 hover:border-primary/40'
                    }`}
                  >
                    {v === '1' ? <TextCursorInput className="h-4 w-4 shrink-0" /> : <AlignLeft className="h-4 w-4 shrink-0" />}
                    {t(key)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('required')}</p>
              <p className="text-xs text-muted-foreground">{t('requiredHint')}</p>
            </div>
            <Switch
              checked={form.required}
              onCheckedChange={(v) => setForm((prev) => ({ ...prev, required: v }))}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!form.label.trim()}>
              {tc('save')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
