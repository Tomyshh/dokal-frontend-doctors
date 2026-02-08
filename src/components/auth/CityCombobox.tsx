'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type City = {
  id: number;
  he: string;
  en: string;
};

export interface CityComboboxProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

function normalizeForSearch(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    // Hebrew diacritics (niqqud + cantillation)
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[’'".,;:(){}\[\]<>!?/\\|@#$%^&*_+=~`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripParentheses(s: string) {
  let out = (s || '').trim();
  if (!out) return '';

  // Remove parenthetical content in both normal "(...)" and reversed ")...(" forms.
  for (let i = 0; i < 5; i++) {
    const prev = out;
    out = out.replace(/\s*\([^()]*\)\s*/g, ' ');
    out = out.replace(/\s*\)[^()]*\(\s*/g, ' ');
    if (out === prev) break;
  }

  out = out.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  return out;
}

export function CityCombobox({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
}: CityComboboxProps) {
  const locale = useLocale();
  const tCommon = useTranslations('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [cities, setCities] = useState<City[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCities = useCallback(async () => {
    if (cities || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/israel-cities', { cache: 'no-store' });
      const data = (await res.json()) as City[];
      if (Array.isArray(data)) setCities(data);
      else setCities([]);
    } catch {
      setCities([]);
    } finally {
      setLoading(false);
    }
  }, [cities, loading]);

  const handleFocus = useCallback(() => {
    setOpen(true);
    setInputValue('');
    void loadCities();
  }, [loadCities]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 150);
  }, []);

  const getDisplayLabel = useCallback(
    (c: City) => {
      const raw = locale === 'he' ? c.he || c.en : c.en || c.he;
      return stripParentheses(raw);
    },
    [locale]
  );

  const displayValue = useMemo(() => value || '', [value]);

  const suggestions = useMemo(() => {
    if (!cities) return [];
    const q = normalizeForSearch(inputValue);
    const list = q
      ? cities.filter((c) => {
          const he = normalizeForSearch(stripParentheses(c.he));
          const en = normalizeForSearch(stripParentheses(c.en));
          return he.includes(q) || en.includes(q);
        })
      : cities;

    // Hard limit to keep the dropdown fast.
    return list.slice(0, 40);
  }, [cities, inputValue]);

  const showList = open && (loading || suggestions.length > 0);

  return (
    <div className="space-y-1.5 relative">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="text"
        id={id}
        value={open ? inputValue : displayValue}
        onChange={(e) => {
          const v = e.target.value;
          setInputValue(v);
          setOpen(true);
          onChange(v);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        className={cn(
          'flex h-10 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors'
        )}
      />

      {showList && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {tCommon('loading')}
            </li>
          )}
          {!loading &&
            suggestions.map((c) => {
              const labelText = getDisplayLabel(c);
              return (
                <li
                  key={c.id}
                  role="option"
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const selected = getDisplayLabel(c);
                    onChange(selected);
                    setInputValue('');
                    setOpen(false);
                    inputRef.current?.blur();
                  }}
                >
                  {labelText}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

