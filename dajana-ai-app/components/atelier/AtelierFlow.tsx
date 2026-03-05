// ===========================================
// DAJANA AI – Entering Dajana's Atelier
// 3-screen luxury flow before Chat (Intro → Occasion → Dajana Preview)
// Smooth, premium UX; existing brand colors (dark green + neutrals)
// ===========================================

import React, { useEffect, useCallback } from 'react';
import { t } from '@/lib/i18n';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DURATION = 320;
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

// Brand / luxury palette (krem baza + tamno zelena + zlato)
const BG_CREAM = COLORS.onboarding_cream; // #F8F4EF
const BG_OFFWHITE = COLORS.offWhite; // #FDFCFB
const BRAND_GREEN = COLORS.primary; // #0D4326
const GOLD = COLORS.secondary; // #CF8F5A
const TEXT_DARK = '#2C2A28';
const TEXT_MUTED = '#6F6A64';
const CARD_BG = 'rgba(255, 255, 255, 0.82)';
const CARD_BORDER = 'rgba(13, 67, 38, 0.10)';
const HAIRLINE_GOLD = 'rgba(207, 143, 90, 0.55)';
const SHINE = 'rgba(255, 255, 255, 0.55)';
const BUTTON_RADIUS = 26;

const OCCASIONS = [
  { id: 'evening', labelKey: 'atelier.occasion_evening', icon: 'moon-outline' as const },
  { id: 'business', labelKey: 'atelier.occasion_business', icon: 'briefcase-outline' as const },
  { id: 'travel', labelKey: 'atelier.occasion_travel', icon: 'airplane-outline' as const },
  { id: 'casual', labelKey: 'atelier.occasion_casual', icon: 'sunny-outline' as const },
];

interface AtelierFlowProps {
  userName?: string | null;
  step: 1 | 2 | 3;
  onNext: (nextStep: 2 | 3) => void;
  onComplete: () => void;
}

export function AtelierFlow({ userName, step, onNext, onComplete }: AtelierFlowProps) {
  const displayName = userName?.trim() || t('atelier.default_name');
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);
  const buttonGlow = useSharedValue(0.25);
  const sheen = useSharedValue(0);
  const screenOpacity = useSharedValue(1);
  const screenTranslateX = useSharedValue(0);
  const card0Y = useSharedValue(40);
  const card1Y = useSharedValue(40);
  const card2Y = useSharedValue(40);
  const card3Y = useSharedValue(40);
  const card0Scale = useSharedValue(1);
  const card1Scale = useSharedValue(1);
  const card2Scale = useSharedValue(1);
  const card3Scale = useSharedValue(1);
  const previewOpacity = useSharedValue(0);
  const previewTranslateX = useSharedValue(20);
  const screen2Opacity = useSharedValue(0);
  const screen2TranslateY = useSharedValue(10);
  const cardOffsets = [card0Y, card1Y, card2Y, card3Y];
  const cardScales = [card0Scale, card1Scale, card2Scale, card3Scale];

  // Premium button sheen (very subtle, always running)
  useEffect(() => {
    sheen.value = 0;
    sheen.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
  }, []);

  // Screen 1: fade in content
  useEffect(() => {
    if (step === 1) {
      contentOpacity.value = 0;
      contentTranslateY.value = 24;
      contentOpacity.value = withTiming(1, { duration: 360, easing: EASE });
      contentTranslateY.value = withTiming(0, { duration: 360, easing: EASE });
    }
  }, [step]);

  // Subtle button glow loop (Screen 1)
  useEffect(() => {
    if (step !== 1) return;
    const loop = () => {
      buttonGlow.value = withSequence(
        withTiming(0.42, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.25, { duration: 1700, easing: Easing.inOut(Easing.ease) })
      );
    };
    const t = setTimeout(loop, 400);
    return () => clearTimeout(t);
  }, [step]);

  // Screen 2: cards slide up stagger
  useEffect(() => {
    if (step === 2) {
      screen2Opacity.value = 0;
      screen2TranslateY.value = 10;
      screen2Opacity.value = withTiming(1, { duration: 320, easing: EASE });
      screen2TranslateY.value = withTiming(0, { duration: 320, easing: EASE });
      cardOffsets.forEach((v, i) => {
        v.value = 40;
        v.value = withDelay(i * 60, withTiming(0, { duration: 380, easing: EASE }));
      });
    }
  }, [step]);

  // Screen 3: fade in
  useEffect(() => {
    if (step === 3) {
      previewOpacity.value = 0;
      previewTranslateX.value = 20;
      previewOpacity.value = withTiming(1, { duration: 340, easing: EASE });
      previewTranslateX.value = withTiming(0, { duration: 340, easing: EASE });
    }
  }, [step]);

  const handleScreen1CTA = useCallback(() => {
    screenOpacity.value = withTiming(0, { duration: DURATION, easing: EASE });
    screenTranslateX.value = withTiming(-SCREEN_WIDTH * 0.08, { duration: DURATION, easing: EASE });
    setTimeout(() => onNext(2), DURATION + 20);
  }, [onNext]);

  const handleOccasionPress = useCallback(
    (index: number) => {
      const scale = cardScales[index];
      scale.value = withSequence(
        withTiming(1.03, { duration: 120, easing: EASE }),
        withTiming(1, { duration: 120, easing: EASE })
      );
      screen2Opacity.value = withTiming(0, { duration: 260, easing: EASE });
      screen2TranslateY.value = withTiming(-6, { duration: 260, easing: EASE });
      setTimeout(() => onNext(3), 280);
    },
    [onNext, cardScales]
  );

  const handleStartChat = useCallback(() => {
    previewOpacity.value = withTiming(0, { duration: 280, easing: EASE });
    setTimeout(onComplete, 300);
  }, [onComplete]);

  const screen1ContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const screen1ButtonStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(buttonGlow.value, [0.25, 0.42], [0.08, 0.18]),
    shadowRadius: interpolate(buttonGlow.value, [0.25, 0.42], [10, 16]),
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: 0.55,
    transform: [
      {
        translateX: interpolate(sheen.value, [0, 1], [-SCREEN_WIDTH * 0.7, SCREEN_WIDTH * 0.7]),
      },
      { rotateZ: '-16deg' },
    ],
  }));

  const screen1ExitStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateX: screenTranslateX.value }],
  }));

  const card0Style = useAnimatedStyle(() => ({
    transform: [{ translateY: card0Y.value }, { scale: card0Scale.value }],
  }));
  const card1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: card1Y.value }, { scale: card1Scale.value }],
  }));
  const card2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: card2Y.value }, { scale: card2Scale.value }],
  }));
  const card3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: card3Y.value }, { scale: card3Scale.value }],
  }));
  const cardStyles = [card0Style, card1Style, card2Style, card3Style];

  const screen3Style = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [{ translateX: previewTranslateX.value }],
  }));

  const screen2ContainerStyle = useAnimatedStyle(() => ({
    opacity: screen2Opacity.value,
    transform: [{ translateY: screen2TranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Screen 1 – Intro (krem premium) */}
      <Animated.View style={[styles.screen, styles.screen1, screen1ExitStyle]}>
        <LinearGradient
          colors={[BG_CREAM, BG_OFFWHITE, '#FFFFFF']}
          locations={[0, 0.7, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(13,67,38,0.06)', 'rgba(13,67,38,0.00)']}
          locations={[0, 1]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.screen1Inner} edges={['top', 'bottom']}>
          <Animated.View style={[styles.screen1Content, screen1ContentStyle]}>
            <Text style={styles.headline}>Dobrodošla, {displayName}.</Text>
            <Text style={styles.subheadline}>
              Dajana je spremna da kreira tvoj savršeni outfit.
            </Text>
            <Animated.View style={screen1ButtonStyle}>
              <Pressable
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
                onPress={handleScreen1CTA}
              >
                <Animated.View pointerEvents="none" style={[styles.buttonSheen, sheenStyle]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', SHINE, 'rgba(255,255,255,0)']}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                <Text style={styles.ctaButtonText}>Započni stil iskustvo</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* Screen 2 – Occasion selection */}
      {step === 2 && (
        <View style={[styles.screen, styles.screen2]}>
          <LinearGradient
            colors={[BG_CREAM, BG_OFFWHITE, '#FFFFFF']}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(13,67,38,0.06)', 'rgba(13,67,38,0.00)']}
            locations={[0, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.screen2Inner} edges={['top', 'bottom']}>
            <Animated.View style={screen2ContainerStyle}>
              <Text style={styles.screen2Header}>Za koju priliku danas biraš outfit?</Text>
              <View style={styles.cardsContainer}>
                {OCCASIONS.map((occ, i) => (
                  <Animated.View key={occ.id} style={[styles.cardWrap, cardStyles[i]]}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.card,
                        pressed && styles.cardPressed,
                      ]}
                      onPress={() => handleOccasionPress(i)}
                    >
                      <View style={styles.cardIconWrap}>
                        <Ionicons name={occ.icon} size={22} color={BRAND_GREEN} />
                      </View>
                      <Text style={styles.cardLabel}>{t(occ.labelKey)}</Text>
                      <Ionicons name="chevron-forward" size={18} color="rgba(13,67,38,0.55)" />
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      )}

      {/* Screen 3 – Dajana preview */}
      {step === 3 && (
        <View style={[styles.screen, styles.screen3]}>
          <LinearGradient
            colors={[BG_CREAM, BG_OFFWHITE, '#FFFFFF']}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(13,67,38,0.06)', 'rgba(13,67,38,0.00)']}
            locations={[0, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView style={styles.screen3Inner} edges={['top', 'bottom']}>
            <Animated.View style={[styles.screen3Content, screen3Style]}>
              <View style={styles.screen3Left}>
                <Text style={styles.previewTitle}>Spremna sam.</Text>
                <Text style={styles.previewSubtitle}>
                  Hajde da zajedno kreiramo tvoj izgled.
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.startChatBtn,
                    pressed && styles.startChatBtnPressed,
                  ]}
                  onPress={handleStartChat}
                >
                  <Animated.View pointerEvents="none" style={[styles.buttonSheen, sheenStyle]}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0)', SHINE, 'rgba(255,255,255,0)']}
                      locations={[0, 0.5, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                  <Text style={styles.startChatBtnText}>Započni razgovor</Text>
                </Pressable>
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG_CREAM,
  },
  screen: {
    ...StyleSheet.absoluteFillObject,
  },
  screen1: {},
  screen1Inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  screen1Content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  headline: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES['4xl'],
    color: BRAND_GREEN,
    textAlign: 'center',
    letterSpacing: 0.6,
    marginBottom: SPACING.md,
  },
  subheadline: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.lg,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.xxl,
  },
  ctaButton: {
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xl + 8,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: BRAND_GREEN,
    borderWidth: 1,
    borderColor: HAIRLINE_GOLD,
    overflow: 'hidden',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  ctaButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.97,
  },
  buttonSheen: {
    position: 'absolute',
    top: -24,
    bottom: -24,
    left: -120,
    width: 120,
  },
  ctaButtonText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    color: BG_OFFWHITE,
    letterSpacing: 0.4,
  },

  screen2: {},
  screen2Inner: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SCREEN_HEIGHT * 0.12,
  },
  screen2Header: {
    fontFamily: FONTS.heading.medium,
    fontSize: FONT_SIZES.xl,
    color: BRAND_GREEN,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.sm,
  },
  cardsContainer: {
    gap: SPACING.md,
  },
  cardWrap: {
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 22,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
    justifyContent: 'space-between',
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.98,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13,67,38,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(13,67,38,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.md,
    color: TEXT_DARK,
    flex: 1,
  },

  screen3: {},
  screen3Inner: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  screen3Content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  screen3Left: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  previewTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES['2xl'],
    color: BRAND_GREEN,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  previewSubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    color: TEXT_MUTED,
    lineHeight: 24,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  startChatBtn: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: BRAND_GREEN,
    borderWidth: 1,
    borderColor: HAIRLINE_GOLD,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 2,
  },
  startChatBtnPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.97,
  },
  startChatBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    color: BG_OFFWHITE,
    letterSpacing: 0.3,
  },
});
