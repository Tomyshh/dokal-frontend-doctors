'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useProfileQuestionnaireConfig,
  useUpdateProfileQuestionnaireConfig,
} from '@/hooks/useQuestionnaire';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PreVisitInstructionsEditor } from '@/components/appointments/PreVisitInstructionsEditor';
import { QuestionnaireFieldsBuilder } from '@/components/appointments/QuestionnaireFieldsBuilder';
import { useToast } from '@/providers/ToastProvider';
import { ListChecks, ClipboardList, Info } from 'lucide-react';
import type { QuestionnaireField } from '@/types';

export default function QuestionnairePage() {
  const t = useTranslations('questionnaire');
  const tc = useTranslations('common');
  const toast = useToast();

  const { data, isLoading } = useProfileQuestionnaireConfig();
  const updateConfig = useUpdateProfileQuestionnaireConfig();

  const [instructions, setInstructions] = useState<string[]>([]);
  const [fields, setFields] = useState<QuestionnaireField[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setInstructions(data.pre_visit_instructions ?? []);
      setFields(data.questionnaire_fields ?? []);
      setDirty(false);
    }
  }, [data]);

  const handleInstructionsChange = (next: string[]) => {
    setInstructions(next);
    setDirty(true);
  };

  const handleFieldsChange = (next: QuestionnaireField[]) => {
    setFields(next);
    setDirty(true);
  };

  const handleSave = () => {
    updateConfig.mutate(
      { pre_visit_instructions: instructions, questionnaire_fields: fields },
      {
        onSuccess: () => {
          toast.success(tc('saveSuccess'));
          setDirty(false);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
              ?.error?.message || tc('saveError');
          toast.error(tc('saveErrorTitle'), msg);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl" aria-label="Chargement">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-[80%] rounded-md" />
        <div className="space-y-4 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('pageTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t('pageSubtitle')}</p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80">{t('infoBanner')}</p>
      </div>

      {/* ── Section 1: Pre-visit instructions ── */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            {t('preVisitInstructions')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('preVisitInstructionsHint')}</p>
        </div>
        <PreVisitInstructionsEditor
          value={instructions}
          onChange={handleInstructionsChange}
          disabled={updateConfig.isPending}
        />
      </Card>

      {/* ── Section 2: Questionnaire fields ── */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t('questionnaireFields')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('questionnaireFieldsHint')}</p>
        </div>
        <QuestionnaireFieldsBuilder
          value={fields}
          onChange={handleFieldsChange}
          disabled={updateConfig.isPending}
        />
      </Card>

      {/* ── Save bar ── */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button
            onClick={handleSave}
            loading={updateConfig.isPending}
            className="shadow-lg"
          >
            {tc('save')}
          </Button>
        </div>
      )}
    </div>
  );
}
