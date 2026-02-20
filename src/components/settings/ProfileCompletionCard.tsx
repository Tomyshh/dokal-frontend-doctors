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
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-50 via-white to-primary/5 p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Circular progress */}
        <div className="flex shrink-0 justify-center">
          <div className="relative">
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/40"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className="text-primary transition-all duration-500 ease-out"
                strokeDasharray={`${completionPercent * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-gray-900">{completionPercent}</span>
              <span className="text-xs font-medium text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{t('profileCompletion')}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {completionPercent === 100
                ? t('profileCompleteMessage')
                : t('profileIncompleteMessage', { count: incompleteCount })}
            </p>
          </div>

          {completionPercent < 100 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('completionToDo')}
              </p>
              <div className="flex flex-wrap gap-2">
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
                          'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 hover:ring-2 hover:ring-amber-200'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {label}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
