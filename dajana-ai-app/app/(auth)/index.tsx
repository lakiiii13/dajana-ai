// ===========================================
// DAJANA AI - Welcome Screen
// Matches reference design: WELCOME top-left, SRP/ENG top-right,
// DAJANA huge centered, model overlaps, AI gold inside frame, tagline, swipe.
// ===========================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t, getLanguage, setLanguage } from '@/lib/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_TRACK_HEIGHT = 56;
const SWIPE_THUMB_SIZE = 48;
const SWIPE_THRESHOLD = 0.82;

const WELCOME_BG = '#0D4326';
const ACCENT_GOLD = '#CF8F5A';
const FRAME_BORDER = 'rgba(255,255,255,0.18)';

const WELCOME_VIDEO = require('@/assets/videos/welcome-dajana-wave.mp4');

export default function WelcomeScreen() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const [currentLang, setCurrentLang] = useState<'sr' | 'en'>(getLanguage());
  const [, setRefresh] = useState(0);

  const trackWidth = SCREEN_WIDTH - SPACING.lg * 2;
  const maxThumbX = trackWidth - SWIPE_THUMB_SIZE - SPACING.xs;
  const thumbX = useRef(new Animated.Value(0)).current;
  const [hasCompletedSwipe, setHasCompletedSwipe] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;

  // Language switcher - underline animation
  const langUnderline = useRef(new Animated.Value(currentLang === 'sr' ? 0 : 1)).current;

  const handleLangSwitch = useCallback(
    (lang: 'sr' | 'en') => {
      setLanguage(lang);
      setCurrentLang(lang);
      setRefresh((p) => p + 1);
      Animated.spring(langUnderline, {
        toValue: lang === 'sr' ? 0 : 1,
        useNativeDriver: false,
        friction: 8,
      }).start();
    },
    [langUnderline]
  );

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

  // Animacije pri povlačenju swipa
  const thumbScale = thumbX.interpolate({
    inputRange: [0, maxThumbX],
    outputRange: [1, 1.1],
  });
  const overlayOpacity = thumbX.interpolate({
    inputRange: [0, maxThumbX * 0.5, maxThumbX],
    outputRange: [0.5, 0.8, 1],
  });
  const labelOpacity = thumbX.interpolate({
    inputRange: [0, maxThumbX * 0.6],
    outputRange: [1, 0.35],
  });

  // Video: loop, bez zvuka, bez kontrole
  const welcomePlayer = useVideoPlayer(WELCOME_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Frame dimensions - responsive (malo manji frame da DAJANA ostane iznad)
  const frameWidth = Math.round(SCREEN_WIDTH * 0.76);
  const frameHeight = Math.round(windowHeight * 0.48);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          {/* SRP / ENG text switcher */}
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

        {/* ===== MAIN CONTENT ===== */}
        <View style={styles.content}>
          {/* DAJANA text - behind model */}
          <View style={styles.dajanaWrap}>
            <Text style={styles.dajanaText} numberOfLines={1} adjustsFontSizeToFit>
              DAJANA
            </Text>
          </View>

          {/* Frame + Model + AI */}
          <View style={[styles.frameContainer, { width: frameWidth, height: frameHeight }]}>
            {/* Rounded border */}
            <View style={styles.frameBorder} />
            {/* Video: Dajana maše (MP4, loop, mute) */}
            <View
              style={[
                styles.frameImage,
                {
                  width: frameWidth - 4,
                  height: frameHeight - 4,
                  top: 2,
                  left: 2,
                },
              ]}
              pointerEvents="none"
            >
              <VideoView
                player={welcomePlayer}
                style={styles.frameVideoInner}
                contentFit="cover"
                nativeControls={false}
                allowsFullscreen={false}
              />
            </View>
            {/* Blagi gradient na dnu da "AI" ostane čitljiv */}
            <LinearGradient
              colors={['transparent', 'rgba(13,67,38,0.85)']}
              style={styles.frameImageOverlay}
              pointerEvents="none"
            />
            {/* AI text inside frame at bottom */}
            <Text style={styles.aiText}>AI</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>{t('auth.your_personal_ai_stylist')}</Text>
        </View>

        {/* ===== SWIPE SECTION ===== */}
        <View style={styles.swipeSection}>
          <View style={styles.swipeBoxWrap}>
            <View
              style={[styles.swipeTrack, { width: trackWidth, height: SWIPE_TRACK_HEIGHT }]}
              {...panResponder.panHandlers}
            >
              {/* Label – blago nestaje pri povlačenju (opacity) / pulse (scale) razdvojeni da ne mešamo native i JS driver */}
              <View style={styles.trackInner} pointerEvents="none">
                <Animated.View style={{ opacity: labelOpacity }}>
                  <Animated.Text style={[styles.trackLabel, { transform: [{ scale: pulseAnim }] }]}>
                    {t('auth.get_started')}
                  </Animated.Text>
                </Animated.View>
              </View>

              {/* Overlay behind thumb – jači pri povlačenju */}
              <Animated.View
                style={[
                  styles.trackOverlay,
                  {
                    width: thumbX.interpolate({
                      inputRange: [0, maxThumbX],
                      outputRange: [0, maxThumbX],
                    }),
                    opacity: overlayOpacity,
                  },
                ]}
              />

              {/* Thumb – lagano se uvećava pri povlačenju */}
              <Animated.View
                style={[
                  styles.thumb,
                  {
                    width: SWIPE_THUMB_SIZE,
                    height: SWIPE_THUMB_SIZE,
                    transform: [
                      { translateX: thumbX },
                      { scale: thumbScale },
                    ],
                  },
                ]}
              >
                <Feather name="arrow-right" size={22} color={COLORS.white} />
              </Animated.View>

              {/* Animated arrows hint on right */}
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
    backgroundColor: WELCOME_BG,
  },
  safeArea: {
    flex: 1,
  },

  // ===== HEADER =====
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
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.5,
  },
  langTextActive: {
    color: ACCENT_GOLD,
    fontFamily: FONTS.primary.bold,
  },
  langSlash: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    marginHorizontal: 4,
    fontFamily: FONTS.primary.regular,
  },

  // ===== CONTENT =====
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dajanaWrap: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    zIndex: 1,
    marginBottom: 4,
  },
  dajanaText: {
    fontSize: 68,
    fontFamily: FONTS.heading.bold,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  frameContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 2,
  },
  frameBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1.5,
    borderColor: FRAME_BORDER,
    borderRadius: 20,
    zIndex: 0,
  },
  frameImage: {
    position: 'absolute',
    borderRadius: 18,
    zIndex: 1,
    overflow: 'hidden',
  },
  frameVideoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  frameImageOverlay: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 2,
    height: '42%',
    borderRadius: 18,
    zIndex: 2,
  },
  aiText: {
    position: 'absolute',
    bottom: 4,
    fontSize: 48,
    fontFamily: FONTS.heading.bold,
    fontWeight: '700',
    color: ACCENT_GOLD,
    letterSpacing: 16,
    zIndex: 3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.heading.italic,
    color: COLORS.white,
    opacity: 0.94,
    marginTop: SPACING.xl,
    letterSpacing: 1,
  },

  // ===== SWIPE =====
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: SWIPE_TRACK_HEIGHT / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(207,143,90,0.32)',
    borderTopLeftRadius: SWIPE_TRACK_HEIGHT / 2,
    borderBottomLeftRadius: SWIPE_TRACK_HEIGHT / 2,
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
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  thumb: {
    position: 'absolute',
    left: 4,
    top: (SWIPE_TRACK_HEIGHT - SWIPE_THUMB_SIZE) / 2,
    borderRadius: SWIPE_THUMB_SIZE / 2,
    backgroundColor: ACCENT_GOLD,
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
