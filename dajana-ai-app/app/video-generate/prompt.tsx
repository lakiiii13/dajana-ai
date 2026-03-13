import React, { useCallback, useEffect } from 'react';
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/constants/theme';
import { useVideoStore } from '@/stores/videoStore';
import { VideoWizardShell } from '@/components/video/VideoWizardShell';

const GOLD = '#CF8F5A';
const PROMPT_OPTIONS = [
  {
    id: 'walk-forward',
    title: 'Hod napred + zoom out',
    prompt: 'The model walks very slowly forward in a controlled way while staying fully centered in frame. The camera gently zooms out only a little, keeping the full body and face clearly visible at all times. Do not let the model leave the frame. Do not widen beyond the original background.',
  },
  {
    id: 'left-side',
    title: 'Levi bok',
    prompt: 'The model stands in place, slowly turns to the left side profile, and then stops and holds the pose. Keep the movement minimal, elegant, and centered. Keep the full body visible and do not change the background framing.',
  },
  {
    id: 'right-side',
    title: 'Desni bok',
    prompt: 'The model stands in place, slowly turns to the right side profile, and then stops and holds the pose. Keep the movement minimal, elegant, and centered. Keep the full body visible and do not change the background framing.',
  },
  {
    id: 'front-pose',
    title: 'Front poza',
    prompt: 'The model remains facing front and makes only a subtle elegant movement while keeping the full front side clearly visible. The pose should stay centered, stable, and fully in frame, with no major camera movement or background expansion.',
  },
] as const;

export default function VideoGeneratePromptScreen() {
  const router = useRouter();
  const prompt = useVideoStore((s) => s.prompt);
  const setPrompt = useVideoStore((s) => s.setPrompt);
  const sourceImageUrl = useVideoStore((s) => s.sourceImageUrl);
  const resetGeneration = useVideoStore((s) => s.resetGeneration);

  useEffect(() => {
    if (!sourceImageUrl) {
      router.replace('/video-generate/source');
    }
  }, [sourceImageUrl, router]);

  const handleClose = useCallback(() => {
    resetGeneration();
    router.back();
  }, [resetGeneration, router]);

  const handleNext = useCallback(() => {
    if (!prompt.trim()) {
      Alert.alert('Pokret', 'Izaberi jedan pokret pre sledeceg koraka.');
      return;
    }
    router.replace('/video-generate/duration');
  }, [prompt, router]);

  return (
    <VideoWizardShell
      stepIndex={1}
      totalSteps={4}
      prevRoute="/video-generate/source"
      nextRoute="/video-generate/duration"
      canGoNext={Boolean(prompt.trim())}
      onInvalidNext={() => Alert.alert('Pokret', 'Izaberi pokret pre sledeceg koraka.')}
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
          <Text style={styles.title}>Pokret</Text>

          <View style={styles.optionsWrap}>
            {PROMPT_OPTIONS.map((option) => {
              const active = prompt === option.prompt;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionCard, active && styles.optionCardActive]}
                  onPress={() => setPrompt(option.prompt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionTitle, active && styles.optionTitleActive]}>
                    {option.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.nextBtnWrap} pointerEvents="box-none">
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
            <Text style={styles.nextBtnText}>Dalje</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
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
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  title: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 26,
    color: '#F8F4EF',
    marginBottom: 20,
    letterSpacing: 0.6,
  },
  optionsWrap: {
    gap: 14,
  },
  optionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 62,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(248,244,239,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,244,239,0.24)',
  },
  optionCardActive: {
    borderColor: GOLD,
    backgroundColor: 'rgba(248,244,239,0.18)',
  },
  optionTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 15,
    color: '#F8F4EF',
    letterSpacing: 0.2,
  },
  optionTitleActive: {
    color: GOLD,
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
});
