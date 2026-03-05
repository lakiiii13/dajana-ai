// ===========================================
// DAJANA AI - Credit Display Component
// Elegant credit pills for Home & Profile
// Minimal, premium look (no "tech/AI" vibe)
// ===========================================

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { t } from '@/lib/i18n';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { AllCredits } from '@/lib/creditService';

interface CreditDisplayProps {
  credits: AllCredits | null;
  compact?: boolean; // For profile — smaller version
}

interface CreditItemData {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  limit: number;
  remaining: number;
}

export function CreditDisplay({ credits, compact = false }: CreditDisplayProps) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!credits) return null;

  const items: CreditItemData[] = [
    {
      icon: 'camera-outline',
      label: t('home.images'),
      limit: credits.image.limit,
      remaining: credits.image.remaining,
    },
    {
      icon: 'videocam-outline',
      label: t('home.videos'),
      limit: credits.video.limit,
      remaining: credits.video.remaining,
    },
    {
      icon: 'chatbubble-ellipses-outline',
      label: t('home.analyses'),
      limit: credits.analysis.limit,
      remaining: credits.analysis.remaining,
    },
  ];

  const getResetText = () => t('credits_renewal');

  if (compact) {
    return (
      <Animated.View style={[styles.compactContainer, { opacity: fadeAnim }]}>
        {items.map((item) => (
          <CompactCreditItem key={item.label} item={item} colors={colors} />
        ))}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.credits')}</Text>
        </View>
        <Text style={[styles.resetText, { color: colors.gray[400] }]}>{getResetText()}</Text>
      </View>

      {/* Credit pills */}
      <View style={styles.pillsRow}>
        {items.map((item, idx) => (
          <CreditPill key={item.label} item={item} colors={colors} index={idx} isLast={idx === 2} />
        ))}
      </View>
    </Animated.View>
  );
}

// ---- Individual Credit Pill ----
function CreditPill({ item, colors, index, isLast }: { item: CreditItemData; colors: any; index: number; isLast?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        delay: index * 100,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 300 + index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isLow = item.remaining <= 2 && item.limit >= 6;
  const isEmpty = item.remaining <= 0;
  const accent = isEmpty ? COLORS.error : isLow ? COLORS.warning : COLORS.secondary;

  // Poslednji box (Analize): tekst "Analize" i "ovaj mesec" u sredini
  const centerText = isLast;

  return (
    <Animated.View
      style={[
        styles.pill,
        centerText && styles.pillCenterContent,
        {
          backgroundColor: colors.surface,
          borderColor: isEmpty ? `${COLORS.error}30` : `${COLORS.secondary}22`,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.pillLeft, centerText && styles.pillLeftCenter]}>
        <View style={[styles.pillIconWrap, { backgroundColor: `${accent}10`, borderColor: `${accent}22` }]}>
          <Ionicons name={item.icon} size={16} color={accent} />
        </View>
        <View style={[styles.pillText, centerText && styles.pillTextCenter]}>
          <Text style={[styles.pillLabel, { color: colors.textSecondary }, centerText && styles.pillLabelCenter]}>{item.label}</Text>
          <Text style={[styles.pillHint, { color: colors.gray[400] }, centerText && styles.pillHintCenter]}>na 31 dana</Text>
        </View>
      </View>

      <Text style={[styles.pillCount, { color: isEmpty ? COLORS.error : colors.text }]}>
        {item.remaining}
        <Text style={[styles.pillCountTotal, { color: colors.gray[400] }]}>/{item.limit}</Text>
      </Text>
    </Animated.View>
  );
}

// ---- Compact Credit Item (for Profile) ----
function CompactCreditItem({ item, colors }: { item: CreditItemData; colors: any }) {
  const isEmpty = item.remaining <= 0;
  const isLow = item.remaining <= 2 && item.limit >= 6;
  const accent = isEmpty ? COLORS.error : isLow ? COLORS.warning : COLORS.secondary;

  return (
    <View style={[styles.compactItem, { borderColor: `${COLORS.secondary}18`, backgroundColor: colors.surface }]}>
      <View style={[styles.compactIcon, { backgroundColor: `${accent}10`, borderColor: `${accent}22` }]}>
        <Ionicons name={item.icon} size={16} color={accent} />
      </View>
      <View style={styles.compactInfo}>
        <View style={styles.compactTop}>
          <Text style={[styles.compactLabel, { color: colors.textSecondary }]}>{item.label}</Text>
          <Text style={[styles.compactCount, { color: isEmpty ? COLORS.error : colors.text }]}>
            {item.remaining}/{item.limit}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ---- Full (Home) ----
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.2,
  },
  resetText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 11,
  },

  // Pills row
  pillsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pill: {
    flexGrow: 1,
    flexBasis: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  pillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  pillIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    minWidth: 0,
  },
  pillLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  pillHint: {
    fontFamily: FONTS.primary.regular,
    fontSize: 10,
    marginTop: 1,
  },
  // Samo za poslednji box (Analize): "Analize" i "ovaj mesec" u sredini
  pillCenterContent: {},
  pillLeftCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  pillTextCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabelCenter: {
    textAlign: 'center',
  },
  pillHintCenter: {
    textAlign: 'center',
  },
  pillCount: {
    fontFamily: FONTS.heading.bold,
    fontSize: 18,
    letterSpacing: 0.2,
  },
  pillCountTotal: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
  },

  // ---- Compact (Profile) ----
  compactContainer: {
    gap: SPACING.sm,
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
  },
  compactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  compactInfo: {
    flex: 1,
  },
  compactTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
  },
  compactCount: {
    fontFamily: FONTS.heading.bold,
    fontSize: FONT_SIZES.sm,
  },
});
