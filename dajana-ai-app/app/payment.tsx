// ===========================================
// DAJANA AI - Payment (Stripe-style simulacija)
// Forma kartice + simulacija uspeha. Kasnije zameniti pravim Stripe Payment Sheet.
// ===========================================

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, ELEGANT_CTA } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { CREDIT_LIMITS } from '@/constants/credits';

const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const CARD_BG = '#FFFCF9';
const DARK = '#2C2A28';
const HAIRLINE_GOLD = 'rgba(207,143,90,0.30)';
const RADIUS = 18;

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; itemId?: string; itemName?: string }>();
  const { colors, mode } = useTheme();

  const amount = params.amount ?? '0';
  const amountDisplay = amount.includes('€') ? amount : `${amount}€`;
  const itemName = params.itemName || (params.itemId === 'topup' ? t('shop.topup_name') : t('shop.plan_monthly'));

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const bg = mode === 'dark' ? colors.background : CREAM;
  const surface = mode === 'dark' ? colors.surface : CARD_BG;
  const text = mode === 'dark' ? colors.text : DARK;
  const textMuted = mode === 'dark' ? colors.textSecondary : '#6F6A64';
  const border = mode === 'dark' ? 'rgba(232,226,218,0.16)' : 'rgba(13,67,38,0.12)';
  const borderGold = mode === 'dark' ? 'rgba(207,143,90,0.22)' : HAIRLINE_GOLD;

  const applyTopupCredits = async (userId: string) => {
    await supabase.rpc('add_bonus_credits', { p_user_id: userId });
  };

  const applySubscriptionPurchase = async (userId: string, planType: 'monthly' | 'yearly') => {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + (planType === 'yearly' ? 365 : 31));

    await supabase
      .from('user_credits')
      .upsert(
        {
          user_id: userId,
          image_credits_used: 0,
          image_credits_limit: CREDIT_LIMITS.monthly.images,
          video_credits_used: 0,
          video_credits_limit: CREDIT_LIMITS.monthly.videos,
          analysis_credits_used: 0,
          analysis_credits_limit: CREDIT_LIMITS.monthly.analyses,
          bonus_image_credits: 0,
          bonus_video_credits: 0,
          bonus_analysis_credits: 0,
          last_reset_date: now.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'user_id' }
      );

    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSubscription?.id) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          plan_type: planType,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          canceled_at: null,
        })
        .eq('id', existingSubscription.id);
    } else {
      await supabase.from('subscriptions').insert({
        user_id: userId,
        status: 'active',
        plan_type: planType,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    // Simulacija obrade plaćanja (Stripe bi ovde pozvao Payment Sheet ili Confirm Payment)
    await new Promise((r) => setTimeout(r, 2200));

    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      try {
        if (params.itemId === 'topup') {
          await applyTopupCredits(userId);
        } else if (params.itemId === 'monthly' || params.itemId === 'yearly') {
          await applySubscriptionPurchase(userId, params.itemId);
        }
        await useAuthStore.getState().fetchCredits();
        await useAuthStore.getState().fetchSubscription();
      } catch (e) {
        console.warn('[Payment] credit/subscription update failed (simulation still succeeds):', e);
      }
    }

    setProcessing(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIconWrap, { backgroundColor: `${COLORS.success}18`, borderColor: `${COLORS.success}40` }]}>
            <Feather name="check" size={48} color={COLORS.success} />
          </View>
          <Text style={[styles.successTitle, { color: text }]}>{t('payment.success_title')}</Text>
          <Text style={[styles.successMessage, { color: textMuted }]}>{t('payment.success_message')}</Text>
          <TouchableOpacity
            style={[styles.backBtnLarge, { backgroundColor: surface, borderColor: borderGold }]}
            onPress={() => router.back()}
            activeOpacity={0.9}
          >
            <Text style={[styles.backBtnLargeText, { color: text }]}>{t('payment.back_to_shop')}</Text>
            <Feather name="arrow-right" size={18} color={GOLD} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}
          onPress={() => router.back()}
          activeOpacity={0.85}
          disabled={processing}
        >
          <Feather name="chevron-left" size={24} color={GOLD} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: text }]}>{t('payment.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Pregled porudžbine */}
          <View style={[styles.summaryCard, { backgroundColor: surface, borderColor: borderGold }]}>
            <Text style={[styles.summaryLabel, { color: textMuted }]}>{t('payment.order_summary')}</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryItem, { color: text }]} numberOfLines={1}>{itemName}</Text>
              <Text style={[styles.summaryAmount, { color: text }]}>{amountDisplay}</Text>
            </View>
          </View>

          {/* Kartica - Stripe-like */}
          <View style={[styles.formCard, { backgroundColor: surface, borderColor: borderGold }]}>
            <Text style={[styles.inputLabel, { color: textMuted }]}>{t('payment.card_number')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: bg, borderColor: border, color: text }]}
              placeholder={t('payment.card_placeholder')}
              placeholderTextColor={textMuted}
              value={cardNumber}
              onChangeText={(v) => setCardNumber(v.replace(/\D/g, '').slice(0, 16))}
              keyboardType="number-pad"
              maxLength={19}
              editable={!processing}
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={[styles.inputLabel, { color: textMuted }]}>{t('payment.expiry')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: bg, borderColor: border, color: text }]}
                  placeholder={t('payment.expiry_placeholder')}
                  placeholderTextColor={textMuted}
                  value={expiry}
                  onChangeText={(v) => {
                    const n = v.replace(/\D/g, '').slice(0, 4);
                    if (n.length >= 2) setExpiry(`${n.slice(0, 2)}/${n.slice(2)}`);
                    else setExpiry(n);
                  }}
                  keyboardType="number-pad"
                  maxLength={5}
                  editable={!processing}
                />
              </View>
              <View style={styles.half}>
                <Text style={[styles.inputLabel, { color: textMuted }]}>{t('payment.cvc')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: bg, borderColor: border, color: text }]}
                  placeholder={t('payment.cvc_placeholder')}
                  placeholderTextColor={textMuted}
                  value={cvc}
                  onChangeText={(v) => setCvc(v.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  editable={!processing}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.payButton,
              { backgroundColor: processing ? colors.gray[300] : COLORS.primary, borderColor: borderGold },
            ]}
            onPress={handlePay}
            disabled={processing}
            activeOpacity={0.9}
          >
            {processing ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.payButtonText}>{t('payment.processing')}</Text>
              </>
            ) : (
              <Text style={styles.payButtonText}>{t('payment.pay_btn', { amount: amountDisplay })}</Text>
            )}
          </TouchableOpacity>

          <View style={[styles.secureNote, { backgroundColor: surface, borderColor: border }]}>
            <Feather name="lock" size={14} color={textMuted} />
            <Text style={[styles.secureNoteText, { color: textMuted }]}>{t('payment.secure_note')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    fontFamily: FONTS.heading.semibold,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  headerRight: { width: 44 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 80,
  },
  summaryCard: {
    borderRadius: RADIUS,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.xs,
    letterSpacing: 0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.md,
    flex: 1,
    marginRight: SPACING.sm,
  },
  summaryAmount: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.lg,
  },
  formCard: {
    borderRadius: RADIUS,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.xs,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    marginBottom: SPACING.md,
  },
  row: { flexDirection: 'row', gap: SPACING.md },
  half: { flex: 1 },
  payButton: {
    ...ELEGANT_CTA,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  payButtonText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  secureNoteText: {
    flex: 1,
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
  },
  // Success
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: SPACING.xl,
  },
  successTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES['2xl'],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successMessage: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  backBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  backBtnLargeText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.3,
  },
});
