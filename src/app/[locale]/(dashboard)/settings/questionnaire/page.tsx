'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { ListChecks, ClipboardList, Info, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
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

  const handleInstructionsChange = useCallback((next: string[]) => {
    setInstructions(next);
    setDirty(true);
  }, []);

  const handleFieldsChange = useCallback((next: QuestionnaireField[]) => {
    setFields(next);
    setDirty(true);
  }, []);

  const handleSave = () => {
    updateConfig.mutate(
      { pre_visit_instructions: instructions, questionnaire_fields: fields },
      {
        onSuccess: () => {
          toast.success(tc('saveSuccess'));
          setDirty(false);
        },
        onError: () => {
          toast.error(t('saveErrorTitle'), t('saveErrorBackendNotReady'));
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl" aria-label="Chargement">
        <Skeleton className="h-8 w-80 rounded-lg" />
        <Skeleton className="h-5 w-[90%] rounded-md" />
        <Card><div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div></Card>
        <Card><div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Back link ── */}
      <Link href="/settings">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 rtl-flip-arrow" />
          {t('backToSettings')}
        </Button>
      </Link>

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('pageTitle')}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
          {t('pageSubtitle')}
        </p>
      </div>

      {/* ── Info banner ── */}
      <div className="flex gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80 leading-relaxed">
          {t('infoBanner')}
        </p>
      </div>

      {/* ── Section 1: Pre-visit instructions ── */}
      <Card>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            {t('preVisitInstructions')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {t('preVisitInstructionsHint')}
          </p>
        </div>
        <PreVisitInstructionsEditor
          value={instructions}
          onChange={handleInstructionsChange}
          disabled={updateConfig.isPending}
        />
      </Card>

      {/* ── Section 2: Questionnaire fields ── */}
      <Card>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t('questionnaireFields')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {t('questionnaireFieldsHint')}
          </p>
        </div>
        <QuestionnaireFieldsBuilder
          value={fields}
          onChange={handleFieldsChange}
          disabled={updateConfig.isPending}
        />
      </Card>

      {/* ── Sticky save bar ── */}
      {dirty && (
        <div className="sticky bottom-4 flex justify-end z-10">
          <Button
            onClick={handleSave}
            loading={updateConfig.isPending}
            className="shadow-lg px-6"
          >
            {tc('save')}
          </Button>
        </div>
      )}
    </div>
  );
}
