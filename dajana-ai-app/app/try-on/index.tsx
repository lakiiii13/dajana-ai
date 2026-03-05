// ===========================================
// DAJANA AI - Try-On Welcome (prvi korak)
// Fullscreen, krem, luksuzne animacije → Dalje → upload
// ===========================================

import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { t } from '@/lib/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CREAM = '#F8F4EF';

const TRYON_IMAGE = require('@/assets/images/tryon.png');

export default function TryOnWelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    router.push('/try-on/upload');
  };

  const handleClose = () => {
    router.dismissAll();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />
      {/* Zatvori – gore desno */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.closeWrap, { top: insets.top + SPACING.sm }]}
      >
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          activeOpacity={0.85}
        >
          <Feather name="x" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* Sadržaj – naslov, ilustracija (tryon.png), tekst, dugmad – zeleno-krem kao na referenci */}
      <View style={styles.content}>
        <Animated.Text
          entering={FadeInDown.delay(120).duration(480)}
          style={styles.title}
        >
          {t('try_on.welcome_title')}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.imageWrap}>
          <Image source={TRYON_IMAGE} style={styles.heroImage} resizeMode="contain" />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(320).duration(480)}
          style={styles.subtitle}
        >
          {t('try_on.welcome_subtitle')}
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInUp.delay(420).duration(500)}
        style={styles.footer}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNext}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryButtonText}>{t('try_on.welcome_next')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    paddingHorizontal: SPACING.lg,
  },
  closeWrap: {
    position: 'absolute',
    right: SPACING.lg,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,252,249,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SCREEN_HEIGHT * 0.06,
  },
  title: {
    fontFamily: FONTS.heading.bold,
    fontSize: 26,
    letterSpacing: 1.2,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  imageWrap: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.52,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: SCREEN_WIDTH - SPACING.lg * 2,
    height: SCREEN_HEIGHT * 0.48,
  },
  subtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
    color: COLORS.gray[600],
    textAlign: 'center',
    maxWidth: SCREEN_WIDTH - SPACING.lg * 4,
  },
  footer: {
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    width: '100%',
    maxWidth: 320,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
});
