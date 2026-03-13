// ===========================================
// DAJANA AI - Welcome Screen
// Fullscreen video pozadina, SRP/ENG, Dajana AI tvoj lični stilista, swipe.
// Ako je korisnik već ulogovan – odmah redirect na (tabs), bez prikaza welcome (izbegava „bljesak” pri reloadu).
// ===========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t, getLanguage, setLanguage } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_TRACK_HEIGHT = 56;
const SWIPE_THUMB_SIZE = 48;
const SWIPE_THRESHOLD = 0.82;


const WELCOME_VIDEO = require('@/assets/videos/welcome-dajana-wave.mp4');

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isGuest, isInitialized } = useAuth();

  // Već ulogovan / gost – ne prikazuj welcome, odmah prebaci na app (uklanja „bljesak” welcome-a pri reloadu)
  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated || isGuest) {
      router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated, isGuest, router]);

  const [currentLang, setCurrentLang] = useState<'sr' | 'en'>(getLanguage());
  const [, setRefresh] = useState(0);
  const trackWidth = SCREEN_WIDTH - SPACING.lg * 2;
  const maxThumbX = trackWidth - SWIPE_THUMB_SIZE - SPACING.xs;
  const thumbX = useRef(new Animated.Value(0)).current;
  const [hasCompletedSwipe, setHasCompletedSwipe] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;

  const handleLangSwitch = useCallback((lang: 'sr' | 'en') => {
    setLanguage(lang);
    setCurrentLang(lang);
    setRefresh((p) => p + 1);
  }, []);

  const navigateToIntro = useCallback(() => {
    if (hasCompletedSwipe) return;
    setHasCompletedSwipe(true);
    router.push('/(auth)/intro');
  }, [hasCompletedSwipe, router]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        const dx = Math.max(0, Math.min(maxThumbX, g.dx));
        thumbX.setValue(dx);
      },
      onPanResponderRelease: (_, g) => {
        const dx = Math.max(0, g.dx);
        if (dx >= maxThumbX * SWIPE_THRESHOLD) {
          Animated.timing(thumbX, {
            toValue: maxThumbX,
            duration: 200,
            useNativeDriver: false,
          }).start(navigateToIntro);
        } else {
          Animated.spring(thumbX, {
            toValue: 0,
            useNativeDriver: false,
            friction: 9,
            tension: 80,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounce, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(arrowBounce, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, [arrowBounce]);

  const arrowTranslateX = arrowBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });

  const labelOpacity = thumbX.interpolate({
    inputRange: [0, maxThumbX * 0.6],
    outputRange: [1, 0.35],
  });

  const welcomePlayer = useVideoPlayer(WELCOME_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  if (isInitialized && (isAuthenticated || isGuest)) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff' }]} />;
  }

  return (
    <View style={styles.container}>
      {/* Fullscreen video pozadina */}
      <View style={styles.videoWrap} pointerEvents="none">
        <VideoView
          player={welcomePlayer}
          style={[styles.videoFullscreen, styles.videoZoomUp]}
          contentFit="cover"
          nativeControls={false}
          fullscreenOptions={{ enable: false }}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.75)']}
          style={styles.videoOverlay}
          pointerEvents="none"
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* SRP / ENG */}
        <View style={styles.header}>
          <View style={styles.langSwitcher}>
            <TouchableOpacity onPress={() => handleLangSwitch('sr')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.langText, currentLang === 'sr' && styles.langTextActive]}>SRP</Text>
            </TouchableOpacity>
            <Text style={styles.langSlash}>/</Text>
            <TouchableOpacity onPress={() => handleLangSwitch('en')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.langText, currentLang === 'en' && styles.langTextActive]}>ENG</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dajana AI + tvoj lični stilista – jedno uz drugo, u fazonu aplikacije */}
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <Text style={styles.dajanaText} numberOfLines={1} adjustsFontSizeToFit>
              DAJANA
            </Text>
            <Text style={styles.aiText}>AI</Text>
          </View>
          <Text style={styles.tagline}>{t('auth.your_personal_ai_stylist')}</Text>
        </View>

        {/* Swipe */}
        <View style={styles.swipeSection}>
          <View style={styles.swipeBoxWrap}>
            <View
              style={[styles.swipeTrack, { width: trackWidth, height: SWIPE_TRACK_HEIGHT }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.trackInner} pointerEvents="none">
                <Animated.View style={{ opacity: labelOpacity }}>
                  <Animated.Text style={[styles.trackLabel, { transform: [{ scale: pulseAnim }] }]}>
                    {t('auth.get_started')}
                  </Animated.Text>
                </Animated.View>
              </View>

              <Animated.View
                style={[
                  styles.thumb,
                  {
                    width: SWIPE_THUMB_SIZE,
                    height: SWIPE_THUMB_SIZE,
                    transform: [{ translateX: thumbX }],
                  },
                ]}
              >
                <Feather name="arrow-right" size={22} color={COLORS.white} />
              </Animated.View>

              <View style={styles.swipeArrowsWrap} pointerEvents="none">
                <Animated.View style={[styles.swipeArrows, { transform: [{ translateX: arrowTranslateX }] }]}>
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
                  <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.25)" style={{ marginLeft: -8 }} />
                </Animated.View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D4326',
  },
  videoWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  videoFullscreen: {
    width: '100%',
    height: '100%',
  },
  videoZoomUp: {
    transform: [{ scale: 1.14 }, { translateY: -32 }],
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  langSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langText: {
    fontSize: 13,
    fontFamily: FONTS.primary.medium,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  langTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.primary.bold,
  },
  langSlash: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
    fontFamily: FONTS.primary.regular,
  },

  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  dajanaText: {
    fontSize: 56,
    fontFamily: FONTS.heading.bold,
    color: COLORS.white,
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  aiText: {
    fontSize: 36,
    fontFamily: FONTS.heading.semibold,
    color: COLORS.primary,
    letterSpacing: 4,
    marginLeft: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.heading.italic,
    color: 'rgba(255,255,255,0.95)',
    marginTop: SPACING.md,
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  swipeSection: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  swipeBoxWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeTrack: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: SWIPE_TRACK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackInner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    top: (SWIPE_TRACK_HEIGHT - SWIPE_THUMB_SIZE) / 2,
    borderRadius: SWIPE_THUMB_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  swipeArrowsWrap: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  swipeArrows: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
