// ===========================================
// DAJANA AI - Body Types Constants
// ===========================================

import { BodyType } from '@/types/database';

export interface BodyTypeInfo {
  id: BodyType;
  sr: string;
  en: string;
  description: {
    sr: string;
    en: string;
  };
}

export const BODY_TYPES: Record<BodyType, BodyTypeInfo> = {
  hourglass: {
    id: 'hourglass',
    sr: 'Peščani sat',
    en: 'Hourglass',
    description: {
      sr: 'Grudi i kukovi su slični, struk je izraženo uži',
      en: 'Bust and hips are similar, waist is notably narrower',
    },
  },
  pear: {
    id: 'pear',
    sr: 'Kruška',
    en: 'Pear',
    description: {
      sr: 'Kukovi su širi od grudi',
      en: 'Hips are wider than bust',
    },
  },
  apple: {
    id: 'apple',
    sr: 'Jabuka',
    en: 'Apple',
    description: {
      sr: 'Struk je širi, manje definisan',
      en: 'Waist is wider, less defined',
    },
  },
  rectangle: {
    id: 'rectangle',
    sr: 'Pravougaonik',
    en: 'Rectangle',
    description: {
      sr: 'Grudi, struk i kukovi su slični',
      en: 'Bust, waist and hips are similar',
    },
  },
  inverted_triangle: {
    id: 'inverted_triangle',
    sr: 'Obrnuti trougao',
    en: 'Inverted Triangle',
    description: {
      sr: 'Grudi su šire od kukova',
      en: 'Bust is wider than hips',
    },
  },
};

// Helper za dropdown
export const BODY_TYPE_OPTIONS = Object.values(BODY_TYPES).map((bt) => ({
  value: bt.id,
  label: bt.sr,
  labelEn: bt.en,
}));

// ===========================================
// Body Type Calculator
// ===========================================

export function calculateBodyType(
  bustCm: number,
  waistCm: number,
  hipsCm: number
): BodyType {
  const waistToBust = waistCm / bustCm;
  const waistToHips = waistCm / hipsCm;
  const bustHipsDiff = Math.abs(bustCm - hipsCm);

  // PEŠČANI SAT: uzak struk, slične grudi/kukovi
  if (waistToBust <= 0.75 && waistToHips <= 0.75 && bustHipsDiff <= 5) {
    return 'hourglass';
  }

  // KRUŠKA: kukovi širi od grudi
  if (hipsCm > bustCm * 1.05) {
    return 'pear';
  }

  // OBRNUTI TROUGAO: grudi šire od kukova
  if (bustCm > hipsCm * 1.05) {
    return 'inverted_triangle';
  }

  // JABUKA: struk širok
  if (waistCm >= bustCm * 0.9 || waistCm >= hipsCm * 0.9) {
    return 'apple';
  }

  // PRAVOUGAONIK: default
  return 'rectangle';
}
