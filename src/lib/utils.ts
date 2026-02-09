import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInCalendarDays, startOfDay, type Locale } from 'date-fns';
import { fr, enUS, he, ru } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const localeMap: Record<string, Locale> = {
  fr,
  en: enUS,
  he,
  ru,
};

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy', locale: string = 'fr') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: localeMap[locale] || fr });
}

export function formatTime(time: string) {
  // Expects HH:mm:ss or HH:mm
  return time.substring(0, 5);
}

export function formatRelativeDate(date: string | Date, locale: string = 'fr') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diffDays = differenceInCalendarDays(startOfDay(d), startOfDay(new Date()));

  // Use Intl.RelativeTimeFormat for fully localized labels (today/yesterday/tomorrow)
  if (diffDays >= -1 && diffDays <= 1) {
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(diffDays, 'day');
    } catch {
      // Fallback if Intl.RelativeTimeFormat is not available for a locale
    }
  }

  return formatDate(d, 'dd MMM yyyy', locale);
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || '';
  const l = lastName?.charAt(0)?.toUpperCase() || '';
  return f + l || '?';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled_by_patient: 'bg-red-100 text-red-800',
    cancelled_by_practitioner: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getDayName(day: number, locale: string = 'fr'): string {
  // Use Intl to avoid hardcoded day names.
  // 2024-01-07 is a Sunday. We build a date matching the requested weekday.
  const base = new Date(Date.UTC(2024, 0, 7 + day));
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(base);
  } catch {
    return new Intl.DateTimeFormat('en', { weekday: 'long' }).format(base);
  }
}
