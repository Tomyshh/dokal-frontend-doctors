'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import {
  RefreshCw,
  Unlink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  useGoogleCalendarStatus,
  useGoogleCalendars,
  useStartGoogleCalendarConnect,
  useDisconnectGoogleCalendar,
  useUpdateGoogleCalendarConfig,
  useManualGoogleCalendarSync,
} from '@/hooks/useGoogleCalendarIntegration';
import type { UpdateGoogleCalendarConfigRequest } from '@/types/api';

export default function GoogleCalendarSection() {
  const t = useTranslations('settings');
  const tc = useTranslations('common');

  const { data: status, isLoading: statusLoading } = useGoogleCalendarStatus();
  const { data: calendars } = useGoogleCalendars(!!status?.connected);
  const connectMutation = useStartGoogleCalendarConnect();
  const disconnectMutation = useDisconnectGoogleCalendar();
  const updateConfigMutation = useUpdateGoogleCalendarConfig();
  const syncMutation = useManualGoogleCalendarSync();

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  // Local form state
  const [calendarId, setCalendarId] = useState('');
  const [syncCrmToGoogle, setSyncCrmToGoogle] = useState(true);
  const [syncGoogleToCrm, setSyncGoogleToCrm] = useState(true);
  const [keywordsAppointment, setKeywordsAppointment] = useState('');
  const [keywordsBusy, setKeywordsBusy] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Populate form from status
  useEffect(() => {
    if (status?.connected) {
      setCalendarId(status.calendar_id || '');
      setSyncCrmToGoogle(status.sync_crm_to_google);
      setSyncGoogleToCrm(status.sync_google_to_crm);
      setKeywordsAppointment(status.keywords_appointment?.join(', ') || '');
      setKeywordsBusy(status.keywords_busy?.join(', ') || '');
      setAiEnabled(status.ai_enabled);
      setAiPrompt(status.ai_prompt || '');
    }
  }, [status]);

  const handleConnect = useCallback(async () => {
    const result = await connectMutation.mutateAsync();
    if (result.auth_url) {
      window.location.href = result.auth_url;
    }
  }, [connectMutation]);

  const handleDisconnect = useCallback(async () => {
    await disconnectMutation.mutateAsync();
    setDisconnectDialogOpen(false);
  }, [disconnectMutation]);

  const handleSync = useCallback(async () => {
    await syncMutation.mutateAsync();
  }, [syncMutation]);

  const handleSaveConfig = useCallback(async () => {
    const data: UpdateGoogleCalendarConfigRequest = {
      calendar_id: calendarId || undefined,
      sync_crm_to_google: syncCrmToGoogle,
      sync_google_to_crm: syncGoogleToCrm,
      keywords_appointment: keywordsAppointment
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      keywords_busy: keywordsBusy
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean),
      ai_enabled: aiEnabled,
      ai_prompt: aiPrompt || null,
    };
    await updateConfigMutation.mutateAsync(data);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  }, [
    calendarId,
    syncCrmToGoogle,
    syncGoogleToCrm,
    keywordsAppointment,
    keywordsBusy,
    aiEnabled,
    aiPrompt,
    updateConfigMutation,
  ]);

  const formatLastSync = (iso: string | null) => {
    if (!iso) return t('googleCalendarNeverSynced');
    return new Date(iso).toLocaleString();
  };

  const isConnected = status?.connected ?? false;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              src="/logo/google_logo.png"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 shrink-0"
              aria-hidden
            />
            {t('googleCalendar')}
          </CardTitle>
          <Badge
            className={
              isConnected
                ? 'bg-green-100 text-green-700 text-xs'
                : 'bg-gray-100 text-gray-600 text-xs'
            }
          >
            {isConnected ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('googleCalendarConnected')}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {t('googleCalendarDisconnected')}
              </span>
            )}
          </Badge>
        </CardHeader>

        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {t('googleCalendarDescription')}
          </p>

          {/* ─── Not connected ─────────────────────────────────────── */}
          {!isConnected && (
            <Button
              onClick={handleConnect}
              loading={connectMutation.isPending}
              disabled={statusLoading}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {connectMutation.isPending
                ? t('googleCalendarConnecting')
                : t('googleCalendarConnect')}
            </Button>
          )}

          {/* ─── Connected ─────────────────────────────────────────── */}
          {isConnected && status && (
            <>
              {/* Account info + actions row */}
              <div className="rounded-xl bg-green-50/50 border border-green-200/60 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('googleCalendarAccount')}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {status.google_email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSync}
                      loading={syncMutation.isPending}
                      className="gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {syncMutation.isPending
                        ? t('googleCalendarSyncing')
                        : t('googleCalendarSyncNow')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDisconnectDialogOpen(true)}
                      className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      {t('googleCalendarDisconnect')}
                    </Button>
                  </div>
                </div>

                {/* Sync success toast */}
                {syncMutation.isSuccess && syncMutation.data && (
                  <div className="text-xs text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('googleCalendarSyncSuccess', {
                      count: syncMutation.data.synced_count,
                    })}
                  </div>
                )}

                {/* Last sync */}
                <p className="text-xs text-muted-foreground">
                  {t('googleCalendarLastSync')}:{' '}
                  <span className="font-medium text-gray-700">
                    {formatLastSync(status.last_sync_at)}
                  </span>
                </p>

                {/* Error banner */}
                {status.last_error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('googleCalendarError')}</p>
                      <p>{status.last_error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Configuration ─────────────────────────────────── */}
              <div className="space-y-4 pt-2">
                {/* Calendar selector */}
                {calendars && calendars.length > 0 && (
                  <Select
                    id="gcal-calendar"
                    label={t('googleCalendarSelectCalendar')}
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    options={[
                      {
                        value: '',
                        label: t('googleCalendarSelectCalendarPlaceholder'),
                      },
                      ...calendars.map((c) => ({
                        value: c.id,
                        label: `${c.summary}${c.primary ? ' (primary)' : ''}`,
                      })),
                    ]}
                  />
                )}

                {/* Sync toggles */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="sync-crm-to-google"
                      checked={syncCrmToGoogle}
                      onChange={(e) => setSyncCrmToGoogle(e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <div>
                      <label
                        htmlFor="sync-crm-to-google"
                        className="text-sm font-medium text-gray-700"
                      >
                        {t('googleCalendarSyncCrmToGoogle')}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {t('googleCalendarSyncCrmToGoogleDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="sync-google-to-crm"
                      checked={syncGoogleToCrm}
                      onChange={(e) => setSyncGoogleToCrm(e.target.checked)}
                      className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <div>
                      <label
                        htmlFor="sync-google-to-crm"
                        className="text-sm font-medium text-gray-700"
                      >
                        {t('googleCalendarSyncGoogleToCrm')}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {t('googleCalendarSyncGoogleToCrmDesc')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Keywords (only if Google→CRM is on) */}
                {syncGoogleToCrm && (
                  <div className="space-y-4 rounded-xl bg-muted/30 border border-border/50 p-4">
                    <Input
                      id="keywords-appointment"
                      label={t('googleCalendarKeywordsAppointment')}
                      value={keywordsAppointment}
                      onChange={(e) => setKeywordsAppointment(e.target.value)}
                      placeholder={t(
                        'googleCalendarKeywordsAppointmentPlaceholder',
                      )}
                    />
                    <p className="text-xs text-muted-foreground -mt-2">
                      {t('googleCalendarKeywordsAppointmentDesc')}
                    </p>

                    <Input
                      id="keywords-busy"
                      label={t('googleCalendarKeywordsBusy')}
                      value={keywordsBusy}
                      onChange={(e) => setKeywordsBusy(e.target.value)}
                      placeholder={t('googleCalendarKeywordsBusyPlaceholder')}
                    />
                    <p className="text-xs text-muted-foreground -mt-2">
                      {t('googleCalendarKeywordsBusyDesc')}
                    </p>

                    {/* AI toggle */}
                    <div className="flex items-start gap-3 pt-1">
                      <input
                        type="checkbox"
                        id="ai-enabled"
                        checked={aiEnabled}
                        onChange={(e) => setAiEnabled(e.target.checked)}
                        className="h-4 w-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <div>
                        <label
                          htmlFor="ai-enabled"
                          className="text-sm font-medium text-gray-700 flex items-center gap-1.5"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {t('googleCalendarAiEnabled')}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {t('googleCalendarAiEnabledDesc')}
                        </p>
                      </div>
                    </div>

                    {aiEnabled && (
                      <Textarea
                        id="ai-prompt"
                        label={t('googleCalendarAiPrompt')}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder={t('googleCalendarAiPromptPlaceholder')}
                        rows={3}
                      />
                    )}
                  </div>
                )}

                {/* Save button */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveConfig}
                    loading={updateConfigMutation.isPending}
                  >
                    {tc('save')}
                  </Button>
                  {configSaved && (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('googleCalendarConfigSaved')}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* ─── Disconnect Dialog ────────────────────────────────────── */}
      <Dialog
        open={disconnectDialogOpen}
        onClose={() => setDisconnectDialogOpen(false)}
        title={t('googleCalendarDisconnect')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t('googleCalendarDisconnectConfirm')}
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="ghost"
              onClick={() => setDisconnectDialogOpen(false)}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              loading={disconnectMutation.isPending}
            >
              <Unlink className="h-4 w-4" />
              {t('googleCalendarDisconnect')}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
