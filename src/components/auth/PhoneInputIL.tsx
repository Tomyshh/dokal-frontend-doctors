'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface PhoneInputILProps {
  id: string;
  label?: string;
  value: string; // user-entered digits (e.g. 058..., 58..., 97258...)
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

function normalizeDigits(s: string) {
  return (s || '').replace(/\D/g, '');
}

export function normalizeIsraelPhoneToE164(input: string) {
  let digits = normalizeDigits(input);

  // If pasted with country code, remove it.
  if (digits.startsWith('972')) digits = digits.slice(3);

  // If typed with leading 0, remove it.
  if (digits.startsWith('0')) digits = digits.slice(1);

  // Israel NSN is typically 8 (landline) or 9 (mobile) digits after removing leading 0.
  if (!/^\d{8,9}$/.test(digits)) return null;

  return `+972${digits}`;
}

export function PhoneInputIL({ id, label, value, onChange, required, error }: PhoneInputILProps) {
  const displayDigits = useMemo(() => {
    let digits = normalizeDigits(value);
    if (digits.startsWith('972')) digits = digits.slice(3);
    // keep leading 0 if user typed it
    // limit to 10 digits max (e.g. 05XXXXXXXX)
    return digits.slice(0, 10);
  }, [value]);

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        dir="ltr"
        className={cn(
          'flex h-10 w-full rounded-xl border border-border bg-white ring-offset-white transition-colors overflow-hidden',
          error && 'border-destructive'
        )}
      >
        <div className="flex items-center gap-2 px-3 bg-muted text-gray-700 border-r border-border select-none whitespace-nowrap">
          <span aria-hidden className="text-base leading-none">
            🇮🇱
          </span>
          <span className="text-sm font-medium">+972</span>
        </div>

        <input
          id={id}
          type="tel"
          className={cn(
            'flex-1 h-full bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary text-left',
            error && 'focus-visible:ring-destructive/20'
          )}
          dir="ltr"
          value={displayDigits}
          onChange={(e) => {
            const digits = normalizeDigits(e.target.value);
            // allow either 0XXXXXXXXX (10) or XXXXXXXXX (9) or shorter while typing
            onChange(digits);
          }}
          inputMode="tel"
          autoComplete="tel"
          placeholder="0584268519"
          required={required}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

