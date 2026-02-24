'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_THEME_PALETTE_ID,
  isThemePaletteId,
  THEME_PALETTE_ATTRIBUTE,
  THEME_PALETTE_STORAGE_KEY,
  type ThemePaletteId,
} from '@/lib/themePalettes';

interface ThemePaletteContextValue {
  paletteId: ThemePaletteId;
  setPaletteId: (paletteId: ThemePaletteId) => void;
}

const ThemePaletteContext = createContext<ThemePaletteContextValue | undefined>(undefined);

export default function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const [paletteId, setPaletteIdState] = useState<ThemePaletteId>(DEFAULT_THEME_PALETTE_ID);

  const applyPalette = useCallback((nextPalette: ThemePaletteId) => {
    document.documentElement.setAttribute(THEME_PALETTE_ATTRIBUTE, nextPalette);
    window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, nextPalette);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_PALETTE_STORAGE_KEY);
    const initialPalette = isThemePaletteId(stored) ? stored : DEFAULT_THEME_PALETTE_ID;
    setPaletteIdState(initialPalette);
    document.documentElement.setAttribute(THEME_PALETTE_ATTRIBUTE, initialPalette);
  }, []);

  const setPaletteId = useCallback((nextPalette: ThemePaletteId) => {
    setPaletteIdState(nextPalette);
    applyPalette(nextPalette);
  }, [applyPalette]);

  const value = useMemo(
    () => ({
      paletteId,
      setPaletteId,
    }),
    [paletteId, setPaletteId]
  );

  return (
    <ThemePaletteContext.Provider value={value}>
      {children}
    </ThemePaletteContext.Provider>
  );
}

export function useThemePalette() {
  const context = useContext(ThemePaletteContext);
  if (!context) {
    throw new Error('useThemePalette must be used inside ThemePaletteProvider');
  }
  return context;
}
