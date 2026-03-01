'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface PreVisitInstructionsEditorProps {
  value: string[];
  onChange: (instructions: string[]) => void;
  disabled?: boolean;
}

export function PreVisitInstructionsEditor({
  value,
  onChange,
  disabled,
}: PreVisitInstructionsEditorProps) {
  const t = useTranslations('questionnaire');
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onChange([...value, trimmed]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, text: string) => {
    const next = [...value];
    next[index] = text;
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-2">
      {value.map((instruction, index) => (
        <div key={index} className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
          <input
            type="text"
            value={instruction}
            onChange={(e) => updateItem(index, e.target.value)}
            disabled={disabled}
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => removeItem(index)}
            disabled={disabled}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-600 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1">
        <GripVertical className="h-4 w-4 text-transparent shrink-0" />
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('addInstructionPlaceholder')}
          disabled={disabled}
          className="flex-1 rounded-xl border border-dashed border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
        />
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          onClick={addItem}
          disabled={disabled || !newItem.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground px-6">
          {t('noInstructions')}
        </p>
      )}
    </div>
  );
}
