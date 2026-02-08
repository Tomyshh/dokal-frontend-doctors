'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
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
    <Card>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('loginTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('loginSubtitle')}</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          {t('login')}
        </Button>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            {t('forgotPassword')}
          </Link>
        </div>
      </form>
    </Card>
  );
}
