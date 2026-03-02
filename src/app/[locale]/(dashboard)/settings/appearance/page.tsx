'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Palette, Moon, Sun } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { THEME_PALETTES } from '@/lib/themePalettes';
import { useThemePalette } from '@/providers/ThemePaletteProvider';

export default function AppearancePage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const { mode, setMode, paletteId, setPaletteId } = useThemePalette();

  const appearanceTitle = locale === 'fr' ? 'Apparence' : locale === 'he' ? 'מראה' : locale === 'ru' ? 'Оформление' : 'Appearance';
  const appearanceHint = locale === 'fr'
    ? 'Passez entre thème clair et dark.'
    : locale === 'he' ? 'מעבר בין ערכת נושא בהירה לכהה.'
    : locale === 'ru' ? 'Переключение между светлой и тёмной темой.'
    : 'Switch between light and dark theme.';

  const paletteSectionTitle = locale === 'fr' ? 'Palette de couleurs' : locale === 'he' ? 'לוח צבעים' : locale === 'ru' ? 'Цветовая палитра' : 'Color palette';
  const paletteSectionHint = locale === 'fr'
    ? 'Choisissez le style visuel de votre CRM. Modifiable à tout moment.'
    : locale === 'he' ? 'בחרו את הסגנון החזותי של ה-CRM שלכם. ניתן לשנות בכל עת.'
    : locale === 'ru' ? 'Выберите визуальный стиль CRM. Можно изменить в любое время.'
    : 'Choose your CRM visual style. You can change it anytime.';
  const paletteSavedHint = locale === 'fr'
    ? 'Préférence enregistrée sur cet appareil.'
    : locale === 'he' ? 'ההעדפה נשמרה במכשיר זה.'
    : locale === 'ru' ? 'Предпочтение сохранено на этом устройстве.'
    : 'Preference saved on this device.';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Palette className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('appearancePageTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('appearancePageSubtitle')}</p>
        </div>
      </div>

      {/* Theme mode */}
      <Card className="settings-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {mode === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            {appearanceTitle}
          </CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('light')}
              className={cn(
                'rounded-xl border p-3 flex items-center gap-2.5 text-sm font-medium transition-colors',
                mode === 'light'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <Sun className="h-4 w-4" />
              {locale === 'fr' ? 'Clair' : locale === 'he' ? 'בהיר' : locale === 'ru' ? 'Светлая' : 'Light'}
            </button>
            <button
              type="button"
              onClick={() => setMode('dark')}
              className={cn(
                'rounded-xl border p-3 flex items-center gap-2.5 text-sm font-medium transition-colors',
                mode === 'dark'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:bg-muted'
              )}
            >
              <Moon className="h-4 w-4" />
              {locale === 'fr' ? 'Sombre' : locale === 'he' ? 'כהה' : locale === 'ru' ? 'Тёмная' : 'Dark'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{appearanceHint}</p>
        </div>
      </Card>

      {/* Color palette */}
      <Card className="settings-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-4 w-4" />
            </div>
            {paletteSectionTitle}
          </CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {THEME_PALETTES.map((palette) => {
              const isActive = paletteId === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => setPaletteId(palette.id)}
                  className={cn(
                    'rounded-xl border text-left p-3 transition-colors',
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    {palette.swatches.map((color) => (
                      <span
                        key={color}
                        className="h-5 w-5 rounded-full border border-white/80 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className={cn('text-sm font-semibold', isActive ? 'text-primary' : 'text-gray-800')}>
                    {palette.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{palette.description}</p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{paletteSectionHint}</p>
          <p className="text-xs text-primary">{paletteSavedHint}</p>
        </div>
      </Card>
    </div>
  );
}
