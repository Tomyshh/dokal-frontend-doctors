export const THEME_PALETTE_STORAGE_KEY = 'dokal-theme-palette';
export const THEME_PALETTE_ATTRIBUTE = 'data-theme-palette';
export const THEME_MODE_STORAGE_KEY = 'dokal-theme-mode';
export const THEME_MODE_ATTRIBUTE = 'data-theme-mode';

export const THEME_PALETTES = [
  {
    id: 'mint' as const,
    label: 'Mint Pro',
    description: 'Style moderne et frais (teal/menthe).',
    swatches: ['#0B8F78', '#10B981', '#E7F7F0'],
  },
  {
    id: 'ocean' as const,
    label: 'Ocean Blue',
    description: 'Professionnel, rassurant, ton clinique.',
    swatches: ['#3B82F6', '#60A5FA', '#EAF4FF'],
  },
  {
    id: 'violet' as const,
    label: 'Violet Pulse',
    description: 'Premium et moderne, plus contrasté.',
    swatches: ['#8B5CF6', '#A78BFA', '#F4F0FF'],
  },
  {
    id: 'sunset' as const,
    label: 'Sunset Coral',
    description: 'Chaleureux, humain, orienté accueil.',
    swatches: ['#E85D3A', '#F17059', '#FEF1EE'],
  },
] as const;

export type ThemePaletteId = (typeof THEME_PALETTES)[number]['id'];
export type ThemeMode = 'light' | 'dark';

export const DEFAULT_THEME_PALETTE_ID: ThemePaletteId = 'mint';
export const DEFAULT_THEME_MODE: ThemeMode = 'light';

export function isThemePaletteId(value: string | null | undefined): value is ThemePaletteId {
  if (!value) return false;
  return THEME_PALETTES.some((palette) => palette.id === value);
}

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === 'light' || value === 'dark';
}
