// ===========================================
// DAJANA AI - Credits Constants
// ===========================================

/** Broj dana u periodu – krediti se obnavljaju 31 dan od dana uplate, ne kalendarski mesec. */
export const CREDIT_PERIOD_DAYS = 31;

export const CREDIT_LIMITS = {
  // Limiti po periodu (obnova 31 dana od last_reset_date / uplate)
  monthly: {
    images: 50,
    videos: 2,
    analyses: 2,
  },

  // Bonus pack (5 EUR)
  bonus_pack: {
    images: 10,
    videos: 1,
    analyses: 2,
    price_cents: 500,
    price_display: '5€',
  },
};

// Credit type display names
export const CREDIT_TYPE_NAMES = {
  image: {
    sr: 'Slika',
    en: 'Image',
    plural_sr: 'Slika',
    plural_en: 'Images',
  },
  video: {
    sr: 'Video',
    en: 'Video',
    plural_sr: 'Videa',
    plural_en: 'Videos',
  },
  analysis: {
    sr: 'AI analiza',
    en: 'AI Analysis',
    plural_sr: 'AI analize',
    plural_en: 'AI Analyses',
  },
};
