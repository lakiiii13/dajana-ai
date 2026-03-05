// ===========================================
// DAJANA AI - Subscription & Payment
// ===========================================
// Cene: mesečna 15–19€, godišnja sa popustom, doplata 5€

/** Mesečna pretplata (€). Opseg 15–19; za prikaz koristimo srednju vrednost. */
export const SUBSCRIPTION_MONTHLY_EUR = 17;

/** Popust na godišnju pretplatu (0–1). npr. 0.2 = 20% jeftinije. */
export const SUBSCRIPTION_YEARLY_DISCOUNT = 0.2;

/** Godišnja cena = 12 meseci × mesečna, minus popust (zaokruženo). */
export const SUBSCRIPTION_YEARLY_EUR = Math.round(
  SUBSCRIPTION_MONTHLY_EUR * 12 * (1 - SUBSCRIPTION_YEARLY_DISCOUNT)
);

/** Doplata za prekoračenje – paket kredita (5€). */
export const TOPUP_PACK = {
  price_eur: 5,
  price_display: '5€',
  images: 10,
  videos: 1,
  analyses: 2,
} as const;

/** Način plaćanja: Stripe (kartice, Apple Pay, Google Pay). PayPal nije uključen. */
export const PAYMENT_METHOD = 'stripe' as const;
