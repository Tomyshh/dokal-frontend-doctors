'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface AddressResult {
  address_line: string;
  zip_code: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (data: AddressResult) => void;
  onClear?: () => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
}

const DEBOUNCE_MS = 300;

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  onClear,
  required,
  placeholder,
  error,
}: AddressAutocompleteProps) {
  const locale = useLocale();
  const t = useTranslations('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<Array<{ place_id: string; description: string }>>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.trim().length < 3) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(input.trim())}`,
        { cache: 'no-store' }
      );
      const data = (await res.json()) as { predictions?: Array<{ place_id: string; description: string }> };
      setPredictions(data.predictions ?? []);
    } catch {
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = setTimeout(() => {
      void fetchPredictions(inputValue);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, open, fetchPredictions]);

  const handleFocus = useCallback(() => {
    setOpen(true);
    setInputValue(value || '');
  }, [value]);

  const handleBlur = useCallback(() => {
    setTimeout(() => setOpen(false), 150);
  }, []);

  const handleSelect = useCallback(
    async (placeId: string) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/places/geocode?place_id=${encodeURIComponent(placeId)}`,
          { cache: 'no-store' }
        );
        const data = (await res.json()) as AddressResult & { formatted_address?: string };
        if (data.address_line && data.latitude != null && data.longitude != null) {
          onChange({
            address_line: data.address_line,
            zip_code: data.zip_code || '',
            city: data.city || '',
            latitude: data.latitude,
            longitude: data.longitude,
          });
          setInputValue('');
          setPredictions([]);
          setOpen(false);
          inputRef.current?.blur();
        }
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setInputValue('');
    setPredictions([]);
    onClear?.();
  }, [onClear]);

  const displayValue = open ? inputValue : value;

  return (
    <div className="space-y-1.5 relative">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={displayValue}
          onChange={(e) => {
            const v = e.target.value;
            setInputValue(v);
            setOpen(true);
            if (!v) handleClear();
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          placeholder={placeholder}
          autoComplete="off"
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          role="combobox"
          aria-expanded={open && (loading || predictions.length > 0)}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
          className={cn(
            'flex h-10 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-destructive focus-visible:ring-destructive/20'
          )}
        />
      </div>

      {open && (loading || predictions.length > 0) && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {t('loading')}
            </li>
          )}
          {!loading &&
            predictions.map((p) => (
              <li
                key={p.place_id}
                role="option"
                className="px-3 py-2 text-sm cursor-pointer hover:bg-primary-50 outline-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  void handleSelect(p.place_id);
                }}
              >
                {p.description}
              </li>
            ))}
        </ul>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
