'use client';

import { useTranslations } from 'next-intl';
import { Palette, Moon, Sun } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { THEME_PALETTES } from '@/lib/themePalettes';
import { useThemePalette } from '@/providers/ThemePaletteProvider';

export default function AppearancePage() {
  const t = useTranslations('settings');
  const { mode, setMode, paletteId, setPaletteId } = useThemePalette();

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
            {t('appearanceThemeSectionTitle')}
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
              {t('appearanceThemeLight')}
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
              {t('appearanceThemeDark')}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{t('appearanceThemeHint')}</p>
        </div>
      </Card>

      {/* Color palette */}
      <Card className="settings-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-4 w-4" />
            </div>
            {t('appearancePaletteSectionTitle')}
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
                    'rounded-xl border text-start p-3 transition-colors',
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
                    {t(`themePalettes.${palette.id}.label` as Parameters<typeof t>[0])}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t(`themePalettes.${palette.id}.description` as Parameters<typeof t>[0])}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">{t('appearancePaletteSectionHint')}</p>
          <p className="text-xs text-primary">{t('appearancePaletteSavedHint')}</p>
        </div>
      </Card>
    </div>
  );
}
