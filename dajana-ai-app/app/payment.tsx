// ===========================================
// DAJANA AI - Payment (legacy redirect)
// Plaćanje ide preko Shop → Google Play / App Store
// ===========================================

import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';

export default function PaymentScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const bg = mode === 'dark' ? colors.background : '#F8F4EF';
  const text = mode === 'dark' ? colors.text : '#2C2A28';

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/shop'), 300);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.wrap}>
        <ActivityIndicator size="large" color="#CF8F5A" />
        <Text style={[styles.text, { color: text }]}>{t('shop.payment_method')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  text: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
});
