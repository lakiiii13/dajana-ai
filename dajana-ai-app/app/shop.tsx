// ===========================================
// DAJANA AI - Shop (Pretplata i plaćanje)
// Mesečna/godišnja pretplata + doplata 5€
// Plaćanje: Google Play / App Store (RevenueCat)
// ===========================================

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, ELEGANT_CTA } from '@/constants/theme';
import { t } from '@/lib/i18n';
import {
  SUBSCRIPTION_MONTHLY_EUR,
  SUBSCRIPTION_YEARLY_EUR,
  TOPUP_PACK,
  type ShopProductId,
} from '@/constants/subscription';
import { CREDIT_LIMITS } from '@/constants/credits';
import {
  getOfferings,
  getPriceForProduct,
  isPurchasesConfigured,
  purchaseProduct,
  restorePurchases,
} from '@/lib/purchaseService';
import { useAuthStore } from '@/stores/authStore';

const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const CARD_BG = '#FFFCF9';
const DARK = '#2C2A28';
const HAIRLINE_GOLD = 'rgba(207,143,90,0.30)';
const RADIUS = 22;

type ShopItem = {
  id: ShopProductId;
  type: 'subscription' | 'topup';
  nameKey: string;
  descKey: string;
  fallbackPrice: string;
  images: number;
  videos: number;
  analyses: number;
  popular?: boolean;
  ctaKey: string;
};

const SUBSCRIPTION_PLANS: ShopItem[] = [
  {
    id: 'monthly',
    type: 'subscription',
    nameKey: 'shop.plan_monthly',
    descKey: 'shop.plan_monthly_desc',
    fallbackPrice: `${SUBSCRIPTION_MONTHLY_EUR}€`,
    images: CREDIT_LIMITS.monthly.images,
    videos: CREDIT_LIMITS.monthly.videos,
    analyses: CREDIT_LIMITS.monthly.analyses,
    popular: true,
    ctaKey: 'shop.subscribe',
  },
  {
    id: 'yearly',
    type: 'subscription',
    nameKey: 'shop.plan_yearly',
    descKey: 'shop.plan_yearly_desc',
    fallbackPrice: `${SUBSCRIPTION_YEARLY_EUR}€`,
    images: CREDIT_LIMITS.monthly.images,
    videos: CREDIT_LIMITS.monthly.videos,
    analyses: CREDIT_LIMITS.monthly.analyses,
    ctaKey: 'shop.subscribe',
  },
];

const TOPUP_ITEM: ShopItem = {
  id: 'topup',
  type: 'topup',
  nameKey: 'shop.topup_name',
  descKey: 'shop.topup_desc',
  fallbackPrice: TOPUP_PACK.price_display,
  images: TOPUP_PACK.images,
  videos: TOPUP_PACK.videos,
  analyses: TOPUP_PACK.analyses,
  ctaKey: 'shop.buy',
};

export default function ShopScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const fetchCredits = useAuthStore((s) => s.fetchCredits);
  const fetchSubscription = useAuthStore((s) => s.fetchSubscription);

  const [storePrices, setStorePrices] = useState<Partial<Record<ShopProductId, string>>>({});
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [purchasingId, setPurchasingId] = useState<ShopProductId | null>(null);
  const [restoring, setRestoring] = useState(false);

  const bg = mode === 'dark' ? colors.background : CREAM;
  const surface = mode === 'dark' ? colors.surface : CARD_BG;
  const text = mode === 'dark' ? colors.text : DARK;
  const textMuted = mode === 'dark' ? colors.textSecondary : '#6F6A64';
  const border = mode === 'dark' ? 'rgba(232,226,218,0.16)' : 'rgba(13,67,38,0.12)';
  const borderGold = mode === 'dark' ? 'rgba(207,143,90,0.22)' : HAIRLINE_GOLD;

  const loadPrices = useCallback(async () => {
    setLoadingPrices(true);
    try {
      const offerings = await getOfferings();
      if (offerings) {
        setStorePrices({
          monthly: getPriceForProduct(offerings, 'monthly') ?? undefined,
          yearly: getPriceForProduct(offerings, 'yearly') ?? undefined,
          topup: getPriceForProduct(offerings, 'topup') ?? undefined,
        });
      }
    } finally {
      setLoadingPrices(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const refreshAccount = async () => {
    await fetchCredits();
    await fetchSubscription();
  };

  const handlePurchase = async (item: ShopItem) => {
    if (purchasingId) return;

    if (!isPurchasesConfigured()) {
      Alert.alert(t('shop.iap_not_ready_title'), t('shop.iap_not_ready_message'));
      return;
    }

    setPurchasingId(item.id);
    try {
      const result = await purchaseProduct(item.id);
      if (result.ok) {
        await new Promise((r) => setTimeout(r, 1500));
        await refreshAccount();
        Alert.alert(t('payment.success_title'), t('payment.success_message'));
      } else if (!result.cancelled && result.message) {
        Alert.alert(t('shop.purchase_error_title'), result.message);
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.ok) {
        await new Promise((r) => setTimeout(r, 1500));
        await refreshAccount();
        Alert.alert(t('shop.restore_success_title'), t('shop.restore_success_message'));
      } else if (result.message) {
        Alert.alert(t('shop.purchase_error_title'), result.message);
      }
    } finally {
      setRestoring(false);
    }
  };

  const priceFor = (item: ShopItem) => storePrices[item.id] ?? item.fallbackPrice;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Feather name="chevron-left" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: text }]}>{t('shop.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: textMuted }]}>{t('shop.subtitle')}</Text>

        <Text style={[styles.sectionTitle, { color: text }]}>{t('shop.section_subscription')}</Text>
        {SUBSCRIPTION_PLANS.map((item) => (
          <PlanCard
            key={item.id}
            item={item}
            priceDisplay={priceFor(item)}
            loadingPrice={loadingPrices && isPurchasesConfigured()}
            purchasing={purchasingId === item.id}
            surface={surface}
            border={border}
            borderGold={borderGold}
            text={text}
            textMuted={textMuted}
            mode={mode}
            onPress={() => handlePurchase(item)}
          />
        ))}

        <Text style={[styles.sectionTitle, { color: text }]}>{t('shop.section_topup')}</Text>
        <PlanCard
          item={TOPUP_ITEM}
          priceDisplay={priceFor(TOPUP_ITEM)}
          loadingPrice={loadingPrices && isPurchasesConfigured()}
          purchasing={purchasingId === TOPUP_ITEM.id}
          surface={surface}
          border={border}
          borderGold={borderGold}
          text={text}
          textMuted={textMuted}
          mode={mode}
          onPress={() => handlePurchase(TOPUP_ITEM)}
        />

        <Text style={[styles.paymentMethod, { color: textMuted }]}>{t('shop.payment_method')}</Text>
        <Text style={[styles.footerNote, { color: textMuted }]}>{t('shop.footer_note')}</Text>

        <TouchableOpacity
          style={[styles.restoreBtn, { borderColor: borderGold }]}
          onPress={handleRestore}
          disabled={restoring || !!purchasingId}
          activeOpacity={0.85}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={GOLD} />
          ) : (
            <Text style={[styles.restoreBtnText, { color: textMuted }]}>{t('shop.restore_purchases')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  item,
  priceDisplay,
  loadingPrice,
  purchasing,
  surface,
  border,
  borderGold,
  text,
  textMuted,
  mode,
  onPress,
}: {
  item: ShopItem;
  priceDisplay: string;
  loadingPrice: boolean;
  purchasing: boolean;
  surface: string;
  border: string;
  borderGold: string;
  text: string;
  textMuted: string;
  mode: 'light' | 'dark';
  onPress: () => void;
}) {
  return (
    <View style={styles.packWrap}>
      {item.popular && (
        <View style={[styles.popularBadge, { backgroundColor: surface, borderColor: borderGold }]}>
          <Text style={[styles.popularText, { color: GOLD }]}>{t('shop.popular')}</Text>
        </View>
      )}
      <View style={[styles.packCard, { backgroundColor: surface, borderColor: borderGold }]}>
        <LinearGradient
          colors={mode === 'dark' ? ['rgba(207,143,90,0.10)', 'rgba(207,143,90,0)'] : ['rgba(207,143,90,0.08)', 'rgba(207,143,90,0)']}
          locations={[0, 1]}
          style={styles.packGlow}
        />
        <Text style={[styles.packName, { color: text }]}>{t(item.nameKey)}</Text>
        <Text style={[styles.packDesc, { color: textMuted }]}>{t(item.descKey)}</Text>

        <View style={[styles.creditsRow, { borderTopColor: border }]}>
          <CreditRow icon="camera" count={item.images} labelKey="shop.images" textMuted={textMuted} />
          <CreditRow icon="video" count={item.videos} labelKey="shop.videos" textMuted={textMuted} />
          <CreditRow icon="message-circle" count={item.analyses} labelKey="shop.analyses" textMuted={textMuted} />
        </View>

        <View style={styles.packFooter}>
          {loadingPrice ? (
            <ActivityIndicator size="small" color={GOLD} />
          ) : (
            <Text style={[styles.price, { color: text }]}>{priceDisplay}</Text>
          )}
          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.04)' : CREAM, borderColor: borderGold }]}
            onPress={onPress}
            disabled={purchasing}
            activeOpacity={0.9}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={GOLD} />
            ) : (
              <>
                <Text style={[styles.buyBtnText, { color: text }]}>{t(item.ctaKey)}</Text>
                <Feather name="arrow-right" size={16} color={GOLD} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function CreditRow({
  icon,
  count,
  labelKey,
  textMuted,
}: {
  icon: 'camera' | 'video' | 'message-circle';
  count: number;
  labelKey: string;
  textMuted: string;
}) {
  return (
    <View style={styles.creditRow}>
      <View style={[styles.creditIconWrap, { backgroundColor: `${GOLD}18`, borderColor: HAIRLINE_GOLD }]}>
        <Feather name={icon} size={18} color={GOLD} />
      </View>
      <Text style={[styles.creditCount, { color: COLORS.primary }]}>{count}</Text>
      <Text style={[styles.creditLabel, { color: textMuted }]}>{t(labelKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontFamily: FONTS.heading.bold,
    fontSize: 22,
    letterSpacing: 1.2,
  },
  headerRight: { width: 44 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 120,
  },
  subtitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  packWrap: {
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: SPACING.md,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  popularText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  packCard: {
    borderRadius: RADIUS,
    padding: SPACING.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  packGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  packName: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.xl,
    letterSpacing: 0.3,
    marginBottom: SPACING.xs,
  },
  packDesc: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
  },
  creditRow: { alignItems: 'center', gap: 4 },
  creditIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  creditCount: {
    fontFamily: FONTS.heading.bold,
    fontSize: FONT_SIZES.lg,
  },
  creditLabel: {
    fontFamily: FONTS.primary.regular,
    fontSize: 11,
  },
  packFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    gap: SPACING.md,
  },
  price: {
    fontFamily: FONTS.heading.bold,
    fontSize: FONT_SIZES['2xl'],
    letterSpacing: 0.3,
  },
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...ELEGANT_CTA,
  },
  buyBtnText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.4,
  },
  paymentMethod: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  footerNote: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  restoreBtn: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1,
  },
  restoreBtnText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 0.3,
  },
});
