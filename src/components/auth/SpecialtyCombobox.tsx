'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SPECIALTY_KEYS } from '@/data/specialties';

export interface SpecialtyComboboxProps {
  id: string;
  label: string;
  value: string;
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
  const t = useTranslations('specialties');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const normalize = useCallback((s: string) => {
    // Lowercase + remove punctuation + normalize spaces.
    // Also removes Hebrew diacritics (niqqud + cantillation).
    return s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/[’'".,;:(){}\[\]<>!?/\\|@#$%^&*_+=~`-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const expandQueryTerms = useCallback(
    (q: string) => {
      const base = normalize(q);
      const terms = new Set<string>();
      if (base) terms.add(base);

      if (locale === 'he') {
        // Heuristics: users may type "רופא/רופאה" while labels use "רפואת ...".
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

        if (base === 'רופא' || base === 'רופאה' || base === 'רופאים' || base === 'רופאות') {
          terms.add('רפואת');
          terms.add('רפוא');
        }
      }

      return [...terms].filter(Boolean);
    },
    [locale, normalize]
  );

  const buildSearchStrings = useCallback(
    (labelText: string) => {
      const base = normalize(labelText);
      const list = new Set<string>();
      if (base) list.add(base);

      if (locale === 'he') {
        // Add an alias that replaces "רפואת X" -> "רופא X" to match how users search.
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
    [locale, normalize]
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
            // Subsequence-ish match (very light fuzzy) for typos / partials.
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
    []
  );

  const displayValue = useMemo(() => {
    if (!value) return '';
    const key = SPECIALTY_KEYS.find((k) => k === value);
    return key ? t(key) : value;
  }, [value, t]);

  const suggestions = useMemo(() => {
    const q = inputValue.trim();
    if (!q) return SPECIALTY_KEYS.slice();

    const queryTerms = expandQueryTerms(q);
    const ranked = SPECIALTY_KEYS.map((key) => {
      const labelText = t(key);
      const candidateStrings = buildSearchStrings(labelText);
      return {
        key,
        labelText,
        score: scoreMatch(candidateStrings, queryTerms),
      };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.labelText.localeCompare(b.labelText);
      })
      .map((x) => x.key);

    return ranked;
  }, [buildSearchStrings, expandQueryTerms, inputValue, scoreMatch, t]);

  const handleFocus = useCallback(() => {
    setOpen(true);
    setInputValue('');
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 150);
  }, []);

  const handleSelect = useCallback(
    (key: (typeof SPECIALTY_KEYS)[number]) => {
      onChange(key);
      setInputValue('');
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    setOpen(true);
    const exactKey = SPECIALTY_KEYS.find((k) => t(k) === v);
    if (exactKey) onChange(exactKey);
    else onChange(v);
  };

  const showList = open && suggestions.length > 0;

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
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
        aria-activedescendant={showList ? undefined : undefined}
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
          {suggestions.map((key) => (
            <li
              key={key}
              role="option"
              className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 focus:bg-primary-50 outline-none"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(key);
              }}
            >
              {t(key)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
