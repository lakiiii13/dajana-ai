// ===========================================
// DAJANA AI - Splash UI (OSB logo + animacija ulaska)
// Koristi se u root _layout pre Stack-a.
// ===========================================

import { useEffect } from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SPACING } from '@/constants/theme';

const ENTRANCE_DURATION = 1100;
const ENTRANCE_DELAY = 120;
// Outro: počinje ranije od kraja splasha (_layout SPLASH_DURATION_MS = 2000)
const OUTRO_START_MS = 900;
const OUTRO_DURATION = 1100;

export function SplashContent() {
  const { width } = useWindowDimensions();
  const scale = useSharedValue(0.58);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(22);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    opacity.value = withDelay(
      ENTRANCE_DELAY,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: ease })
    );
    scale.value = withDelay(
      ENTRANCE_DELAY,
      withTiming(1, { duration: ENTRANCE_DURATION, easing: ease })
    );
    translateY.value = withDelay(
      ENTRANCE_DELAY,
      withTiming(0, { duration: ENTRANCE_DURATION, easing: ease })
    );
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const easeOut = Easing.in(Easing.cubic);
      opacity.value = withTiming(0, { duration: OUTRO_DURATION, easing: easeOut });
      scale.value = withTiming(0.92, { duration: OUTRO_DURATION, easing: easeOut });
      translateY.value = withTiming(-20, { duration: OUTRO_DURATION, easing: easeOut });
    }, OUTRO_START_MS);
    return () => clearTimeout(t);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const logoSize = Math.min(width * 0.46, 220);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, animatedStyle]}>
        <Image
          source={require('@/assets/images/splash-logo.jpg')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: '#ffffff',
  },
  logoWrap: {},
  logo: {
    width: 220,
    height: 220,
  },
});
