'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  useSpecialties,
  getSpecialtyDisplayName,
  type BackendSpecialty,
} from '@/hooks/useSpecialties';

export interface SpecialtyComboboxProps {
  id: string;
  label: string;
  /** The selected specialty UUID (or empty string). */
  value: string;
  /** Called with the specialty UUID when the user selects one. */
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function SpecialtyCombobox({
  id,
  label,
  value,
  onChange,
  required,
  placeholder,
}: SpecialtyComboboxProps) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // ─── Fetch specialties from backend ─────────────────────────────
  const { data: specialties, isLoading, isError } = useSpecialties();

  // ─── Text helpers ───────────────────────────────────────────────
  const normalize = useCallback((s: string) => {
    return s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0591-\u05C7]/g, '')       // Hebrew diacritics
      .replace(/[\u0300-\u036F]/g, '')        // Latin diacritics
      .replace(/[''".,;:(){}\[\]<>!?/\\|@#$%^&*_+=~`-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const expandQueryTerms = useCallback(
    (q: string) => {
      const base = normalize(q);
      const terms = new Set<string>();
      if (base) terms.add(base);

      if (locale === 'he') {
        const variants: Array<[RegExp, string]> = [
          [/רופאים/g, 'רפוא'],
          [/רופאות/g, 'רפוא'],
          [/רופאה/g, 'רפוא'],
          [/רופא/g, 'רפוא'],
          [/רפואה/g, 'רפוא'],
        ];
        for (const [re, repl] of variants) {
          if (base.match(re)) terms.add(base.replace(re, repl));
        }
        if (['רופא', 'רופאה', 'רופאים', 'רופאות'].includes(base)) {
          terms.add('רפואת');
          terms.add('רפוא');
        }
      }

      return [...terms].filter(Boolean);
    },
    [locale, normalize],
  );

  const buildSearchStrings = useCallback(
    (labelText: string) => {
      const base = normalize(labelText);
      const list = new Set<string>();
      if (base) list.add(base);

      if (locale === 'he') {
        if (base.startsWith('רפואת ')) {
          list.add(base.replace(/^רפואת\s+/, 'רופא '));
          list.add(base.replace(/^רפואת\s+/, 'רופאה '));
        }
        if (base.startsWith('רפואה ')) {
          list.add(base.replace(/^רפואה\s+/, 'רופא '));
          list.add(base.replace(/^רפואה\s+/, 'רופאה '));
        }
      }

      return [...list];
    },
    [locale, normalize],
  );

  const scoreMatch = useCallback(
    (candidateStrings: string[], queryTerms: string[]) => {
      if (queryTerms.length === 0) return 1;
      let best = 0;
      for (const term of queryTerms) {
        if (!term) continue;
        for (const c of candidateStrings) {
          if (!c) continue;
          if (c.startsWith(term)) best = Math.max(best, 100);
          else if (c.includes(term)) best = Math.max(best, 70);
          else {
            let i = 0;
            for (let j = 0; j < c.length && i < term.length; j++) {
              if (c[j] === term[i]) i++;
            }
            if (i >= Math.min(term.length, 4) && term.length >= 3) {
              best = Math.max(best, 40);
            }
          }
        }
      }
      return best;
    },
    [],
  );

  // ─── Derived values ─────────────────────────────────────────────

  const displayValue = useMemo(() => {
    if (!value || !specialties) return '';
    const found = specialties.find((s) => s.id === value);
    return found ? getSpecialtyDisplayName(found, locale) : '';
  }, [value, specialties, locale]);

  const suggestions = useMemo(() => {
    if (!specialties) return [];
    const q = inputValue.trim();

    if (!q) {
      // No filter → return all, sorted by display name
      return specialties
        .map((s) => ({ ...s, displayName: getSpecialtyDisplayName(s, locale) }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, locale));
    }

    const queryTerms = expandQueryTerms(q);
    return specialties
      .map((s) => {
        const displayName = getSpecialtyDisplayName(s, locale);
        const candidateStrings = buildSearchStrings(displayName);
        // Also search on the English name for multilingual flexibility
        candidateStrings.push(...buildSearchStrings(s.name));
        return {
          ...s,
          displayName,
          score: scoreMatch(candidateStrings, queryTerms),
        };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.displayName.localeCompare(b.displayName, locale);
      });
  }, [specialties, inputValue, locale, expandQueryTerms, buildSearchStrings, scoreMatch]);

  // ─── Handlers ───────────────────────────────────────────────────

  const handleFocus = useCallback(() => {
    setOpen(true);
    setInputValue('');
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 150);
  }, []);

  const handleSelect = useCallback(
    (s: BackendSpecialty) => {
      onChange(s.id);
      setInputValue('');
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    setOpen(true);

    // If the user typed exactly a display name, auto-select it
    if (specialties) {
      const exact = specialties.find(
        (s) => getSpecialtyDisplayName(s, locale) === v,
      );
      if (exact) {
        onChange(exact.id);
      }
    }
  };

  const showList = open && suggestions.length > 0;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="space-y-1.5 relative">
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
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required={required}
        placeholder={isLoading ? '...' : isError ? '⚠' : placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        disabled={isLoading}
        className={cn(
          'flex h-10 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        )}
      />
      {showList && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          {suggestions.map((s) => (
            <li
              key={s.id}
              role="option"
              aria-selected={s.id === value}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 focus:bg-primary-50 outline-none',
                s.id === value && 'bg-primary-50 font-medium',
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(s);
              }}
            >
              {'displayName' in s ? (s as BackendSpecialty & { displayName: string }).displayName : getSpecialtyDisplayName(s, locale)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
