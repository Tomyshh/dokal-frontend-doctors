'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/login`,
      });
      setSent(true);
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
        <h1 className="text-2xl font-bold text-gray-900">{t('resetPassword')}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t('loginSubtitle')}</p>
      </div>

      {sent ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            {t('resetSent')}
          </div>
          <Link href="/login" className="flex items-center gap-2 text-sm text-primary hover:underline justify-center">
            <ArrowLeft className="h-4 w-4" />
            {t('backToLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email"
            type="email"
            label={t('email')}
            placeholder="docteur@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full rounded-full h-12" loading={loading}>
            {t('sendResetLink')}
          </Button>
          <Link href="/login" className="flex items-center gap-2 text-sm text-primary hover:underline justify-center">
            <ArrowLeft className="h-4 w-4" />
            {t('backToLogin')}
          </Link>
        </form>
      )}
    </div>
  );
}
