'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';
import type { ProfileCompletionItem } from '@/lib/practitioner';

interface ProfileCompletionCardProps {
  completionPercent: number;
  completionItems: ProfileCompletionItem[];
  onScrollToSection?: (section: ProfileCompletionItem['section']) => void;
}

const SECTION_ORDER: ProfileCompletionItem['section'][] = ['avatar', 'about', 'contact', 'address', 'pricing'];

export default function ProfileCompletionCard({
  completionPercent,
  completionItems,
  onScrollToSection,
}: ProfileCompletionCardProps) {
  const t = useTranslations('settings');

  const fieldLabels: Record<string, string> = {
    avatar: t('completionAvatar'),
    about: t('completionAbout'),
    education: t('completionEducation'),
    languages: t('completionLanguages'),
    phone: t('completionPhone'),
    email: t('completionEmail'),
    address_line: t('completionAddress'),
    zip_code: t('completionZipCode'),
    city: t('completionCity'),
    price_min: t('completionPriceMin'),
    price_max: t('completionPriceMax'),
  };

  const groupedBySection = SECTION_ORDER.map((section) => ({
    section,
    items: completionItems.filter((i) => i.section === section),
  })).filter((g) => g.items.length > 0);

  const incompleteCount = completionItems.filter((i) => !i.completed).length;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/[0.04] via-white to-primary/[0.06] p-5 sm:p-6 shadow-sm">
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Circular progress */}
        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-center sm:gap-1">
          <div className="relative">
            <svg className="h-16 w-16 sm:h-20 sm:w-20 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                className="text-primary/10"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                className="text-primary transition-all duration-700 ease-out"
                strokeDasharray={`${completionPercent * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl sm:text-2xl font-bold tabular-nums text-gray-900">{completionPercent}</span>
              <span className="text-[10px] font-semibold text-muted-foreground -mt-0.5">%</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('profileCompletion')}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {completionPercent === 100
                ? t('profileCompleteMessage')
                : t('profileIncompleteMessage', { count: incompleteCount })}
            </p>
          </div>

          {/* Linear progress bar */}
          <div className="h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${completionPercent}%` }}
            />
          </div>

          {completionPercent < 100 && (
            <div className="flex flex-wrap gap-1.5">
              {groupedBySection.map(({ section, items }) =>
                items.map((item) => {
                  const isCompleted = item.completed;
                  const label = fieldLabels[item.key] ?? item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => !isCompleted && onScrollToSection?.(section)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200',
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : item.key === 'avatar'
                            ? 'bg-red-50 text-red-800 border border-red-300 hover:bg-red-100 hover:shadow-sm cursor-pointer animate-pulse'
                            : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100 hover:shadow-sm cursor-pointer'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3 shrink-0" />
                      ) : (
                        <Circle className="h-3 w-3 shrink-0" />
                      )}
                      {label}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
