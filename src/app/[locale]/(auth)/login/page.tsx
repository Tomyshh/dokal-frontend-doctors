'use client';

import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/welcome"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToLanding')}
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('loginTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t('loginSubtitle')}</p>
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
        />

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full rounded-full h-12" loading={loading}>
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
  );
}
