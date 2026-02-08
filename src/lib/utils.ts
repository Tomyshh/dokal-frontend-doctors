import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isTomorrow, isYesterday, type Locale } from 'date-fns';
import { fr, enUS, he } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const localeMap: Record<string, Locale> = {
  fr,
  en: enUS,
  he,
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
  if (isToday(d)) return locale === 'fr' ? "Aujourd'hui" : locale === 'he' ? 'היום' : 'Today';
  if (isTomorrow(d)) return locale === 'fr' ? 'Demain' : locale === 'he' ? 'מחר' : 'Tomorrow';
  if (isYesterday(d)) return locale === 'fr' ? 'Hier' : locale === 'he' ? 'אתמול' : 'Yesterday';
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

export function getStatusLabel(status: string, locale: string = 'fr'): string {
  const labels: Record<string, Record<string, string>> = {
    pending: { fr: 'En attente', en: 'Pending', he: 'ממתין' },
    confirmed: { fr: 'Confirmé', en: 'Confirmed', he: 'מאושר' },
    completed: { fr: 'Terminé', en: 'Completed', he: 'הושלם' },
    cancelled_by_patient: { fr: 'Annulé (patient)', en: 'Cancelled (patient)', he: 'בוטל (מטופל)' },
    cancelled_by_practitioner: { fr: 'Annulé (praticien)', en: 'Cancelled (doctor)', he: 'בוטל (רופא)' },
    no_show: { fr: 'Absent', en: 'No show', he: 'לא הגיע' },
  };
  return labels[status]?.[locale] || status;
}

export function getDayName(day: number, locale: string = 'fr'): string {
  const days: Record<string, string[]> = {
    fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    he: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
  };
  return days[locale]?.[day] || days.fr[day];
}
