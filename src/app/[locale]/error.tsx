'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();

  useEffect(() => {
    console.error('Locale error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center rounded-2xl border border-border bg-card p-10 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xl font-bold">
          !
        </div>
        <h1 className="text-lg font-semibold text-foreground mb-2">
          {locale === 'fr'
            ? 'Une erreur est survenue'
            : locale === 'he'
              ? 'אירעה שגיאה'
              : locale === 'es'
                ? 'Ocurrió un error'
                : locale === 'ru'
                  ? 'Произошла ошибка'
                  : 'Something went wrong'}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {locale === 'fr'
            ? 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
            : locale === 'he'
              ? 'אירעה שגיאה בלתי צפויה. אנא נסה שנית.'
              : locale === 'es'
                ? 'Ocurrió un error inesperado. Por favor, inténtelo de nuevo.'
                : locale === 'ru'
                  ? 'Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.'
                  : 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            {locale === 'fr'
              ? 'Réessayer'
              : locale === 'he'
                ? 'נסה שנית'
                : locale === 'es'
                  ? 'Reintentar'
                  : locale === 'ru'
                    ? 'Попробовать снова'
                    : 'Try again'}
          </button>
          <button
            onClick={() => {
              window.location.href = `/${locale}`;
            }}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {locale === 'fr'
              ? 'Accueil'
              : locale === 'he'
                ? 'דף הבית'
                : locale === 'es'
                  ? 'Inicio'
                  : locale === 'ru'
                    ? 'На главную'
                    : 'Go home'}
          </button>
        </div>
      </div>
    </div>
  );
}
