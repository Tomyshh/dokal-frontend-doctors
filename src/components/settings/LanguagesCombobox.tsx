'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { COMMON_LANGUAGES } from '@/lib/languages';
import { Badge } from '@/components/ui/Badge';

export interface LanguagesComboboxProps {
  id: string;
  label: string;
  /** Array of selected language names */
  value: string[];
  onChange: (languages: string[]) => void;
  placeholder?: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function LanguagesCombobox({
  id,
  label,
  value,
  onChange,
  placeholder,
}: LanguagesComboboxProps) {
  const t = useTranslations('settings');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const selectedSet = useMemo(() => new Set(value), [value]);

  const suggestions = useMemo(() => {
    const q = normalize(inputValue);
    const filtered = q
      ? COMMON_LANGUAGES.filter((lang) => normalize(lang).includes(q))
      : [...COMMON_LANGUAGES];
    return filtered.filter((lang) => !selectedSet.has(lang));
  }, [inputValue, selectedSet]);

  const handleFocus = useCallback(() => {
    setOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 150);
  }, []);

  const handleAdd = useCallback(
    (lang: string) => {
      if (selectedSet.has(lang)) return;
      onChange([...value, lang]);
      setInputValue('');
      inputRef.current?.focus();
    },
    [value, selectedSet, onChange]
  );

  const handleRemove = useCallback(
    (lang: string) => {
      onChange(value.filter((l) => l !== lang));
    },
    [value, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      const match = COMMON_LANGUAGES.find(
        (l) => normalize(l) === normalize(inputValue.trim())
      );
      if (match && !selectedSet.has(match)) {
        handleAdd(match);
        setInputValue('');
      } else if (!match) {
        handleAdd(inputValue.trim());
        setInputValue('');
      }
      e.preventDefault();
    }
  };

  const showList = open && (inputValue.trim() || suggestions.length > 0);

  return (
    <div ref={containerRef} className="space-y-1.5 relative">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm ring-offset-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors',
          showList && 'ring-2 ring-primary/20 border-primary'
        )}
      >
        {value.map((lang) => (
          <Badge
            key={lang}
            variant="secondary"
            className="gap-1 pr-1 py-0.5 font-normal"
          >
            {lang}
            <button
              type="button"
              onClick={() => handleRemove(lang)}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
              aria-label={`Remove ${lang}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          autoComplete="off"
          role="combobox"
          aria-expanded={!!showList}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          className="flex-1 min-w-[120px] outline-none placeholder:text-gray-400 bg-transparent"
        />
      </div>
      {showList && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {inputValue.trim()
                ? t('languagesNoMatch')
                : t('languagesAllAdded')}
            </li>
          ) : (
            suggestions.map((lang) => (
              <li
                key={lang}
                role="option"
                aria-selected={false}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary/10 focus:bg-primary/10 outline-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAdd(lang);
                }}
              >
                {lang}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
