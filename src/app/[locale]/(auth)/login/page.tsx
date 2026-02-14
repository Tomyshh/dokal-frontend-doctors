'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const loading = passwordLoading || googleLoading;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(t('invalidCredentials'));
        return;
      }

      router.push(`/${locale}`);
      router.refresh();
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/${locale}`,
        },
      });
      if (authError) setError(authError.message);
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/welcome"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip-arrow" />
        {t('backToLanding')}
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          {t('loginTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('loginSubtitle')}</p>
      </div>

      {searchParams.get('checkEmail') === '1' && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 mb-6">
          {t('checkEmail')}
        </div>
      )}

      {searchParams.get('signup') === '1' && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 mb-6">
          {t('accountCreated')}
        </div>
      )}

      {searchParams.get('error') === 'auth_code' && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-6">
          {t('authCodeError')}
        </div>
      )}

      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center bg-white/90 hover:bg-white"
          onClick={handleGoogle}
          loading={googleLoading}
          disabled={passwordLoading}
        >
          <Image
            src="/logo/google_logo.png"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] shrink-0"
            aria-hidden
          />
          <span>{t('continueWithGoogle')}</span>
        </Button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] text-gray-400 font-medium">{t('or')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
        <Input
          id="email"
          type="email"
          label={t('email')}
          placeholder="docteur@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
        <Input
          id="password"
          type="password"
          label={t('password')}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={loading}
        />

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={passwordLoading} disabled={googleLoading}>
          {t('login')}
        </Button>

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            {t('forgotPassword')}
          </Link>
          <Link href="/signup" className="text-sm text-primary hover:underline">
            {t('signup')}
          </Link>
        </div>
        </form>
      </div>
    </div>
  );
}
