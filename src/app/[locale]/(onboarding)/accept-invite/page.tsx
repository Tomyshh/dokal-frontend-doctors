'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Lock, Check } from 'lucide-react';

export default function AcceptInvitePage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    router.replace(`/${locale}/login`);
    return null;
  }

  const firstName =
    (user.user_metadata?.first_name as string) ??
    (user.user_metadata?.full_name as string)?.split(' ')[0] ??
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
