// ===========================================
// DAJANA AI - Theme Store (light / dark)
// ===========================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'dajana_theme_mode';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleMode: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  isHydrated: false,

  setMode: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      set({ mode });
    } catch {
      set({ mode });
    }
  },

  toggleMode: async () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    await get().setMode(next);
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const mode = stored === 'dark' ? 'dark' : 'light';
      set({ mode, isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
}));
