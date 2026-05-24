// ===========================================
// DAJANA AI - RevenueCat / In-App Purchases
// Google Play + App Store (preko RevenueCat)
// ===========================================

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import { REVENUECAT_PRODUCT_IDS, type ShopProductId } from '@/constants/subscription';

const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '';
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '';

let configured = false;

export function isPurchasesConfigured(): boolean {
  const key = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
  return !!key.trim();
}

export async function initPurchases(userId?: string): Promise<void> {
  if (!isPurchasesConfigured()) {
    console.warn('[Purchases] RevenueCat API key nije podešen – IAP radi samo u production buildu sa ključem.');
    return;
  }

  const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;

  if (!configured) {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    await Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
    return;
  }

  if (userId) {
    await Purchases.logIn(userId);
  }
}

export async function logOutPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (e) {
    console.warn('[Purchases] logOut:', e);
  }
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isPurchasesConfigured()) return null;
  try {
    return await Purchases.getOfferings();
  } catch (e) {
    console.warn('[Purchases] getOfferings failed:', e);
    return null;
  }
}

export function findPackageForProduct(
  packages: PurchasesPackage[] | undefined,
  productId: string
): PurchasesPackage | undefined {
  return packages?.find((p) => p.product.identifier === productId);
}

export function getPriceForProduct(
  offerings: PurchasesOfferings | null,
  shopItemId: ShopProductId
): string | null {
  const productId = REVENUECAT_PRODUCT_IDS[shopItemId];
  const pkg = findPackageForProduct(offerings?.current?.availablePackages, productId);
  return pkg?.product.priceString ?? null;
}

export type PurchaseResult =
  | { ok: true }
  | { ok: false; cancelled: boolean; message: string };

export async function purchaseProduct(shopItemId: ShopProductId): Promise<PurchaseResult> {
  if (!isPurchasesConfigured()) {
    return {
      ok: false,
      cancelled: false,
      message: 'RevenueCat nije podešen. Dodaj API ključ u .env i napravi novi EAS build.',
    };
  }

  const productId = REVENUECAT_PRODUCT_IDS[shopItemId];
  const offerings = await Purchases.getOfferings();
  const pkg = findPackageForProduct(offerings.current?.availablePackages, productId);

  if (!pkg) {
    return {
      ok: false,
      cancelled: false,
      message: `Proizvod "${productId}" nije pronađen u RevenueCat Offering-u. Proveri dashboard.`,
    };
  }

  try {
    await Purchases.purchasePackage(pkg);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; userCancelled?: boolean };
    const cancelled =
      err.userCancelled === true ||
      err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
    return {
      ok: false,
      cancelled,
      message: cancelled ? '' : (err.message ?? 'Kupovina nije uspela.'),
    };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isPurchasesConfigured()) {
    return {
      ok: false,
      cancelled: false,
      message: 'RevenueCat nije podešen.',
    };
  }

  try {
    await Purchases.restorePurchases();
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { ok: false, cancelled: false, message: err.message ?? 'Obnova kupovina nije uspela.' };
  }
}
