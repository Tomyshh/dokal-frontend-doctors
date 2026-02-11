'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default function SignupPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/${locale}`,
        },
      });
      if (authError) setError(authError.message);
    } catch {
      setError(t('signupError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/login`,
          data: {
            role: 'practitioner',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If session already exists (email confirmation disabled), go straight to profile completion.
      if (data.session) {
        router.push(`/${locale}/complete-profile`);
        router.refresh();
        return;
      }

      // Email confirmation required → go to OTP page
      try {
        sessionStorage.setItem('signup_email', email);
      } catch {
        // ignore
      }
      router.push(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError(t('signupError'));
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
        <h1 className="text-2xl font-bold text-gray-900">{t('signupTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t('signupMinimalSubtitle')}</p>
      </div>

      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full h-12"
          onClick={handleGoogle}
          loading={loading}
        >
          {t('continueWithGoogle')}
        </Button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] text-gray-400 font-medium">{t('or')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
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
            autoComplete="new-password"
          />

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full rounded-full h-12" loading={loading}>
            {t('createAccount')}
          </Button>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              {t('alreadyHaveAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('signIn')}
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
