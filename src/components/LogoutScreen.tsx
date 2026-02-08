'use client';

import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export function LogoutScreen() {
  const t = useTranslations('landing');

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-900 via-primary to-primary-700">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-300/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        <Image
          src="/branding/fulllogo_transparent_nobuffer.png"
          alt="Dokal"
          width={160}
          height={53}
          className="brightness-0 invert"
        />

        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-lg font-medium text-white">{t('loggingOut')}</p>
          <p className="text-sm text-primary-200">{t('loggingOutMessage')}</p>
        </div>
      </div>
    </div>
  );
}
