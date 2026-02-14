'use client';

import { useState } from 'react';
import Image from 'next/image';
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
  const [signupLoading, setSignupLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const loading = signupLoading || googleLoading;

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/complete-profile`,
        },
      });
      if (authError) setError(authError.message);
    } catch {
      setError(t('signupError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSignupLoading(true);

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
      setSignupLoading(false);
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
          {t('signupTitle')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('signupMinimalSubtitle')}</p>
      </div>

      <div className="space-y-5">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full justify-center bg-white/90 hover:bg-white"
          onClick={handleGoogle}
          loading={googleLoading}
          disabled={signupLoading}
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
            autoComplete="new-password"
            disabled={loading}
          />

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={signupLoading} disabled={googleLoading}>
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
