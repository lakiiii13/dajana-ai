// ===========================================
// DAJANA AI - Light/Dark toggle (neumorphic, sun/moon)
// ===========================================

import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';

const TRACK_WIDTH = 72;
const TRACK_HEIGHT = 36;
const THUMB_SIZE = 30;
const PADDING = 3;
const THUMB_RANGE = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

const springConfig = { damping: 20, stiffness: 200 };

export function ThemeToggle() {
  const { mode, toggleMode, colors } = useTheme();
  const progress = useSharedValue(mode === 'dark' ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(mode === 'dark' ? 1 : 0, springConfig);
  }, [mode]);

  const lightBg = getColors('light').background;
  const darkBg = getColors('dark').background;

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [lightBg, darkBg]),
    shadowColor: progress.value > 0.5 ? '#000' : '#999',
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: PADDING + progress.value * THUMB_RANGE }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={toggleMode}
      style={styles.wrap}
      accessibilityRole="switch"
      accessibilityState={{ checked: mode === 'dark' }}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]}>
          {mode === 'light' ? (
            <Feather name="sun" size={18} color="#B8860B" />
          ) : (
            <Feather name="moon" size={18} color={colors.white} />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
    padding: PADDING,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
});
