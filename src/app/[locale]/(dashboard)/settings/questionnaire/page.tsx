'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  useProfileQuestionnaireConfig,
  useUpdateProfileQuestionnaireConfig,
} from '@/hooks/useQuestionnaire';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PreVisitInstructionsEditor } from '@/components/appointments/PreVisitInstructionsEditor';
import { QuestionnaireFieldsBuilder } from '@/components/appointments/QuestionnaireFieldsBuilder';
import { useToast } from '@/providers/ToastProvider';
import { ListChecks, ClipboardList } from 'lucide-react';
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
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pageTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('pageSubtitle')}</p>
        </div>
        {dirty && (
          <Button onClick={handleSave} loading={updateConfig.isPending}>
            {tc('save')}
          </Button>
        )}
      </div>

      {/* Pre-visit instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-5 w-5 text-primary" />
            {t('preVisitInstructions')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('preVisitInstructionsHint')}</p>
        </CardHeader>
        <PreVisitInstructionsEditor
          value={instructions}
          onChange={handleInstructionsChange}
          disabled={updateConfig.isPending}
        />
      </Card>

      {/* Questionnaire fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t('questionnaireFields')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t('questionnaireFieldsHint')}</p>
        </CardHeader>
        <QuestionnaireFieldsBuilder
          value={fields}
          onChange={handleFieldsChange}
          disabled={updateConfig.isPending}
        />
      </Card>

      {dirty && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={updateConfig.isPending}>
            {tc('save')}
          </Button>
        </div>
      )}
    </div>
  );
}
