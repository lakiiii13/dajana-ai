// ===========================================
// DAJANA AI - Theme Constants (klijent: DIZAJN)
// Boje: primary #0D4326 (tamno zelena), secondary #CF8F5A (zlatna), black, white
// Fontovi: Arquitecta (primarni), Canela (naslovi) – učitavaju se u _layout (alias ili iz .ttf)
// ===========================================

export type ColorSet = {
  primary: string;
  secondary: string;
  black: string;
  white: string;
  offWhite: string;
  /** Krem pozadina kao na Home / Login / Onboarding */
  onboarding_cream: string;
  gray: Record<number, string>;
  success: string;
  error: string;
  warning: string;
  info: string;
  // Za toggle / pozadine
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
};

const ONBOARDING_CREAM = '#F8F4EF';

const lightColors: ColorSet = {
  primary: '#0D4326',
  secondary: '#CF8F5A',
  black: '#000000',
  white: '#FFFFFF',
  offWhite: '#FDFCFB',
  onboarding_cream: ONBOARDING_CREAM,
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#FDFCFB',
  surface: '#FFFFFF',
  text: '#171717',
  textSecondary: '#525252',
};

const darkColors: ColorSet = {
  ...lightColors,
  offWhite: '#0F1419',
  onboarding_cream: ONBOARDING_CREAM,
  gray: {
    50: '#1C2128',
    100: '#22272E',
    200: '#373E47',
    300: '#4C5564',
    400: '#6B7280',
    500: '#9CA3AF',
    600: '#D1D5DB',
    700: '#E5E7EB',
    800: '#F3F4F6',
    900: '#FDFCFB',
  },
  background: '#0F1419',
  surface: '#1C2128',
  text: '#FDFCFB',
  textSecondary: '#9CA3AF',
};

export const COLORS = lightColors;

export function getColors(mode: 'light' | 'dark'): ColorSet {
  return mode === 'dark' ? darkColors : lightColors;
}

// ─────────────────────────────────────────────────────────────────────────────
// FONTOVI
//  Primarni:  Arquitecta  → sav UI tekst, labele, dugmad, opisi, forme
//  Sekundarni: Canela     → naslovi ekrana, section headeri, hero display tekst
//  Pomoćni:   Licorice    → dekorativni akcenti, kategorije, sezonski naslovi
//             RetroSignature → brand/potpis stil, logo elementi
//             Allura      → skript/kursiv akcenti
// ─────────────────────────────────────────────────────────────────────────────
export const FONTS = {
  // Primarni (Arquitecta) – sav funkcionalni tekst
  primary: {
    thin:     'ArquitectaThin',
    light:    'ArquitectaLight',
    regular:  'ArquitectaRegular',
    medium:   'ArquitectaMedium',
    semibold: 'ArquitectaSemibold',
    bold:     'ArquitectaBold',
  },
  // Sekundarni (Canela) – naslovi i display tekst
  heading: {
    thin:     'CanelaThin',
    light:    'CanelaLight',
    regular:  'CanelaRegular',
    medium:   'CanelaMedium',
    semibold: 'CanelaSemibold',
    bold:     'CanelaBold',
    italic:   'CanelaItalic',
  },
  // Pomoćni – dekorativni i branding
  script: {
    regular: 'Allura_400Regular',
    retro:   'RetroSignature',
    licorice: 'LicoriceRegular',
  },
  logo: 'TGValtica',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
};

// Premium / Indyx-style button (asymmetric radius, gold border, soft shadow)
export const PREMIUM_BUTTON = {
  borderRadius: 30,
  borderTopLeftRadius: 30,
  borderBottomLeftRadius: 30,
  borderTopRightRadius: 30,
  borderBottomRightRadius: 2,
  borderWidth: 0.5,
  borderColor: COLORS.secondary,
  shadowColor: COLORS.black,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

// Elegant CTA – outline, asymmetric corner, no solid fill (boutique / editorial look)
export const ELEGANT_CTA = {
  borderWidth: 1,
  borderColor: COLORS.secondary,
  borderRadius: 20,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  borderBottomRightRadius: 20,
  borderBottomLeftRadius: 6,
  paddingVertical: SPACING.md,
  paddingHorizontal: SPACING.lg,
  shadowColor: COLORS.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 1,
};
