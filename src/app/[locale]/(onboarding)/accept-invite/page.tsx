'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Lock, Check, AlertTriangle } from 'lucide-react';

function AcceptInviteContent() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  const [verifying, setVerifying] = useState(!!tokenHash);
  const [verifyError, setVerifyError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sessionUser, setSessionUser] = useState(user);

  useEffect(() => {
    if (user) setSessionUser(user);
  }, [user]);

  const verifyToken = useCallback(async () => {
    if (!tokenHash) return;
    setVerifying(true);
    try {
      const supabase = createClient();
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: (type as 'invite') || 'invite',
      });

      if (verifyErr) {
        setVerifyError(verifyErr.message);
        setVerifying(false);
        return;
      }

      if (data?.user) {
        setSessionUser(data.user);
      }

      const url = new URL(window.location.href);
      url.searchParams.delete('token_hash');
      url.searchParams.delete('type');
      window.history.replaceState({}, '', url.toString());
    } catch {
      setVerifyError(t('inviteGenericError'));
    }
    setVerifying(false);
  }, [tokenHash, type, t]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (verifying || (authLoading && !sessionUser)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{t('inviteVerifying')}</p>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('inviteExpiredTitle')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('inviteExpiredMessage')}
        </p>
      </div>
    );
  }

  const activeUser = sessionUser ?? user;

  if (!activeUser) {
    router.replace(`/${locale}/login`);
    return null;
  }

  const firstName =
    (activeUser.user_metadata?.first_name as string) ??
    (activeUser.user_metadata?.full_name as string)?.split(' ')[0] ??
    '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('invitePasswordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setDone(true);
      setTimeout(() => {
        router.push(`/${locale}`);
        router.refresh();
      }, 1500);
    } catch {
      setError(t('inviteGenericError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('inviteSuccessTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('inviteSuccessRedirect')}
        </p>
        <Spinner size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          {firstName
            ? t('inviteWelcomeWithName', { name: firstName })
            : t('inviteWelcome')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('inviteSetPasswordSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="password"
          type="password"
          label={t('password')}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={submitting}
          autoFocus
        />

        <Input
          id="confirmPassword"
          type="password"
          label={t('confirmPassword')}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={submitting}
        />

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={submitting}
        >
          {t('inviteSetPasswordButton')}
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
