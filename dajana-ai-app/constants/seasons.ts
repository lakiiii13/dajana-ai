// ===========================================
// DAJANA AI - 12 Seasons Constants
// ===========================================

import { Season } from '@/types/database';
import { getSeasonPalette } from './seasonPalettes';

export interface SeasonInfo {
  id: Season;
  sr: string;
  en: string;
  /** HEX boje palete (iz client-materijal) */
  colors?: string[];
}

export const SEASONS: Record<Season, SeasonInfo> = {
  // PROLECE
  light_spring: {
    id: 'light_spring',
    sr: 'Svetlo proleće',
    en: 'Light Spring',
  },
  warm_spring: {
    id: 'warm_spring',
    sr: 'Toplo proleće',
    en: 'Warm Spring',
  },
  clear_spring: {
    id: 'clear_spring',
    sr: 'Čisto proleće',
    en: 'Clear Spring',
  },

  // LETO
  light_summer: {
    id: 'light_summer',
    sr: 'Svetlo leto',
    en: 'Light Summer',
  },
  cool_summer: {
    id: 'cool_summer',
    sr: 'Hladno leto',
    en: 'Cool Summer',
  },
  soft_summer: {
    id: 'soft_summer',
    sr: 'Meko leto',
    en: 'Soft Summer',
  },

  // JESEN
  soft_autumn: {
    id: 'soft_autumn',
    sr: 'Meka jesen',
    en: 'Soft Autumn',
  },
  warm_autumn: {
    id: 'warm_autumn',
    sr: 'Topla jesen',
    en: 'Warm Autumn',
  },
  deep_autumn: {
    id: 'deep_autumn',
    sr: 'Duboka jesen',
    en: 'Deep Autumn',
  },

  // ZIMA
  deep_winter: {
    id: 'deep_winter',
    sr: 'Duboka zima',
    en: 'Deep Winter',
  },
  cool_winter: {
    id: 'cool_winter',
    sr: 'Hladna zima',
    en: 'Cool Winter',
  },
  clear_winter: {
    id: 'clear_winter',
    sr: 'Čista zima',
    en: 'Clear Winter',
  },
};

// Popuni HEX palete iz seasonPalettes (client-materijal)
for (const id of Object.keys(SEASONS) as Season[]) {
  SEASONS[id].colors = getSeasonPalette(id).colors;
}

// Helper za dropdown
export const SEASON_OPTIONS = Object.values(SEASONS).map((s) => ({
  value: s.id,
  label: s.sr, // Default srpski
  labelEn: s.en,
}));
