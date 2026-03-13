import React, { useCallback, useEffect } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '@/constants/theme';
import { useVideoStore } from '@/stores/videoStore';
import { VideoWizardShell } from '@/components/video/VideoWizardShell';

const DARK = '#2C2A28';
const DARK_GREEN = '#0D4326';
const CREAM = '#F8F4EF';

const springConfig = { damping: 14, stiffness: 180 };

function DurationCard({
  text,
  isActive,
  onPress,
}: {
  text: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(isActive ? 1.02 : 1);

  useEffect(() => {
    if (!isActive) scale.value = withSpring(1, springConfig);
    else scale.value = withSpring(1.02, springConfig);
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    onPress();
    scale.value = withSequence(
      withSpring(1.04, springConfig),
      withSpring(1.02, springConfig)
    );
  }, [onPress, scale]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View style={[styles.card, isActive && styles.cardActive, animatedStyle]}>
        <Text style={[styles.cardText, isActive && styles.cardTextActive]}>{text}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function VideoGenerateDurationScreen() {
  const router = useRouter();
  const sourceImageUrl = useVideoStore((s) => s.sourceImageUrl);
  const prompt = useVideoStore((s) => s.prompt);
  const duration = useVideoStore((s) => s.duration);
  const setDuration = useVideoStore((s) => s.setDuration);
  const resetGeneration = useVideoStore((s) => s.resetGeneration);

  useEffect(() => {
    if (!sourceImageUrl) {
      router.replace('/video-generate/source');
      return;
    }
    if (!prompt.trim()) {
      router.replace('/video-generate/prompt');
    }
  }, [sourceImageUrl, prompt, router]);

  const handleClose = useCallback(() => {
    resetGeneration();
    router.back();
  }, [resetGeneration, router]);

  const handleNext = useCallback(() => {
    router.replace('/video-generate/review');
  }, [router]);

  return (
    <VideoWizardShell
      stepIndex={2}
      totalSteps={4}
      prevRoute="/video-generate/prompt"
      nextRoute="/video-generate/review"
      onClose={handleClose}
      backgroundColor="#111"
    >
      <ImageBackground
        source={sourceImageUrl ? { uri: sourceImageUrl } : undefined}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <Text style={styles.title}>Trajanje</Text>
          <Text style={styles.description}>Izaberi trajanje videa</Text>

          <View style={styles.cardsWrap}>
            <DurationCard
              text="5s · 10 kredita"
              isActive={duration === '5'}
              onPress={() => setDuration('5')}
            />
            <DurationCard
              text="10s · 20 kredita"
              isActive={duration === '10'}
              onPress={() => setDuration('10')}
            />
          </View>
        </View>

        <View style={styles.nextBtnWrap} pointerEvents="box-none">
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
            <Text style={styles.nextBtnText}>Dalje</Text>
            <Animated.View>
              <Text style={styles.nextArrow}>{'>'}</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </VideoWizardShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.56)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 28,
    color: COLORS.white,
    marginBottom: 8,
  },
  description: {
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  cardsWrap: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardActive: {
    borderColor: DARK_GREEN,
    backgroundColor: CREAM,
    shadowColor: DARK_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  cardTextActive: {
    fontFamily: FONTS.primary.semibold,
    color: DARK_GREEN,
  },
  nextBtnWrap: {
    position: 'absolute',
    right: 24,
    bottom: 32,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  nextBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 14,
    color: COLORS.white,
  },
  nextArrow: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
});
