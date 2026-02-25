'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_THEME_MODE,
  DEFAULT_THEME_PALETTE_ID,
  isThemeMode,
  isThemePaletteId,
  THEME_MODE_ATTRIBUTE,
  THEME_MODE_STORAGE_KEY,
  THEME_PALETTE_ATTRIBUTE,
  THEME_PALETTE_STORAGE_KEY,
  type ThemeMode,
  type ThemePaletteId,
} from '@/lib/themePalettes';

interface ThemePaletteContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  paletteId: ThemePaletteId;
  setPaletteId: (paletteId: ThemePaletteId) => void;
}

const ThemePaletteContext = createContext<ThemePaletteContextValue | undefined>(undefined);

export default function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_THEME_MODE);
  const [paletteId, setPaletteIdState] = useState<ThemePaletteId>(DEFAULT_THEME_PALETTE_ID);

  const applyMode = useCallback((nextMode: ThemeMode) => {
    const root = document.documentElement;
    root.setAttribute(THEME_MODE_ATTRIBUTE, nextMode);
    root.classList.toggle('dark', nextMode === 'dark');
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
  }, []);

  const applyPalette = useCallback((nextPalette: ThemePaletteId) => {
    document.documentElement.setAttribute(THEME_PALETTE_ATTRIBUTE, nextPalette);
    window.localStorage.setItem(THEME_PALETTE_STORAGE_KEY, nextPalette);
  }, []);

  useEffect(() => {
    const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    const initialMode = isThemeMode(storedMode) ? storedMode : DEFAULT_THEME_MODE;
    setModeState(initialMode);
    applyMode(initialMode);

    const stored = window.localStorage.getItem(THEME_PALETTE_STORAGE_KEY);
    const initialPalette = isThemePaletteId(stored) ? stored : DEFAULT_THEME_PALETTE_ID;
    setPaletteIdState(initialPalette);
    applyPalette(initialPalette);
  }, [applyMode, applyPalette]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
    applyMode(nextMode);
  }, [applyMode]);

  const toggleMode = useCallback(() => {
    setModeState((prevMode) => {
      const nextMode: ThemeMode = prevMode === 'dark' ? 'light' : 'dark';
      applyMode(nextMode);
      return nextMode;
    });
  }, [applyMode]);

  const setPaletteId = useCallback((nextPalette: ThemePaletteId) => {
    setPaletteIdState(nextPalette);
    applyPalette(nextPalette);
  }, [applyPalette]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
      paletteId,
      setPaletteId,
    }),
    [mode, setMode, toggleMode, paletteId, setPaletteId]
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
