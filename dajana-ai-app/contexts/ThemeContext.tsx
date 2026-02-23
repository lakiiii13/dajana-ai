// ===========================================
// DAJANA AI - Theme Context (boje po light/dark)
// ===========================================

import React, { createContext, useContext, useEffect } from 'react';
import { getColors, ColorSet } from '@/constants/theme';
import { useThemeStore, ThemeMode } from '@/stores/themeStore';

export type ThemeContextValue = {
  mode: ThemeMode;
  colors: ColorSet;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode, setMode, toggleMode, hydrate, isHydrated } = useThemeStore();
  const colors = getColors(mode);

  useEffect(() => {
    hydrate();
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
