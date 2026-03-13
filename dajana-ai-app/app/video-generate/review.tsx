import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppLogo } from '@/components/AppLogo';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useVideoStore } from '@/stores/videoStore';
import { useAuthStore } from '@/stores/authStore';
import { startVideoGeneration } from '@/lib/videoService';
import { saveBackgroundJob } from '@/lib/backgroundVideoTask';
import { hasVideoCredits, deductVideoCredit } from '@/lib/creditService';
import { VideoWizardShell } from '@/components/video/VideoWizardShell';
import { t } from '@/lib/i18n';

const DARK_GREEN = '#0D4326';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';
const VIDEO_MOTION_LABELS: Record<string, string> = {
  'The model walks very slowly forward in a controlled way while staying fully centered in frame. The camera gently zooms out only a little, keeping the full body and face clearly visible at all times. Do not let the model leave the frame. Do not widen beyond the original background.': 'Hod napred + zoom out',
  'The model stands in place, slowly turns to the left side profile, and then stops and holds the pose. Keep the movement minimal, elegant, and centered. Keep the full body visible and do not change the background framing.': 'Levi bok',
  'The model stands in place, slowly turns to the right side profile, and then stops and holds the pose. Keep the movement minimal, elegant, and centered. Keep the full body visible and do not change the background framing.': 'Desni bok',
  'The model remains facing front and makes only a subtle elegant movement while keeping the full front side clearly visible. The pose should stay centered, stable, and fully in frame, with no major camera movement or background expansion.': 'Front poza',
};

export default function VideoGenerateReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const sourceImageUrl = useVideoStore((s) => s.sourceImageUrl);
  const prompt = useVideoStore((s) => s.prompt);
  const duration = useVideoStore((s) => s.duration);
  const status = useVideoStore((s) => s.status);
  const error = useVideoStore((s) => s.error);
  const backgroundJob = useVideoStore((s) => s.backgroundJob);
  const bgPollAttempt = useVideoStore((s) => s.bgPollAttempt);
  const setStatus = useVideoStore((s) => s.setStatus);
  const setError = useVideoStore((s) => s.setError);
  const resetGeneration = useVideoStore((s) => s.resetGeneration);
  const startBgJob = useVideoStore((s) => s.startBackgroundJob);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);

  const isStarting = status === 'generating' && !backgroundJob;

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
    if (status === 'generating') return;
    resetGeneration();
    router.back();
  }, [status, resetGeneration, router]);

  const handleGenerate = useCallback(async () => {
    if (!sourceImageUrl) {
      Alert.alert('Slika', 'Izaberi sliku za video.');
      return;
    }

    if (!prompt.trim()) {
      Alert.alert('Opis scene', 'Unesi opis scene.');
      return;
    }

    if (backgroundJob) {
      Alert.alert(
        'Video u toku',
        'Već se generiše jedan video. Sačekaj da se završi pre nego što pokreneš novi.'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Prijava', 'Morate biti prijavljeni da biste generisali video.');
      return;
    }

    try {
      const hasCredits = await hasVideoCredits(user.id);
      if (!hasCredits) {
        setShowNoCreditsModal(true);
        return;
      }
    } catch {
      Alert.alert(t('error'), 'Nije moguće proveriti kredite.');
      return;
    }

    setError(null);
    setStatus('generating');

    try {
      const { jobId, publicImageUrl } = await startVideoGeneration(sourceImageUrl, prompt, duration);
      await deductVideoCredit(user.id);
      useAuthStore.getState().fetchCredits();

      const jobMeta = {
        jobId,
        userId: user.id,
        sourceImageUrl: publicImageUrl,
        publicImageUrl,
        prompt,
        duration,
        startedAt: new Date().toISOString(),
      };

      await saveBackgroundJob(jobMeta);
      startBgJob(jobMeta);
      setStatus('idle');
    } catch (e: any) {
      console.error('[VideoWizard]', e);
      setError(e.message || 'Greška pri generisanju videa');
      setStatus('error');
    }
  }, [sourceImageUrl, prompt, duration, backgroundJob, user?.id, setError, setStatus, startBgJob, router]);

  if (backgroundJob) {
    return (
      <GeneratingOverlay
        attempt={bgPollAttempt}
        duration={backgroundJob.duration}
        onLeaveToBackground={() => router.replace('/(tabs)/videos' as any)}
      />
    );
  }

  if (isStarting) {
    return <StartingOverlay />;
  }

  const selectedMotionLabel = VIDEO_MOTION_LABELS[prompt] ?? 'Izabrani pokret';

  return (
    <VideoWizardShell
      stepIndex={3}
      totalSteps={4}
      prevRoute="/video-generate/duration"
      onClose={handleClose}
      backgroundColor="#000"
    >
      <ImageBackground
        source={sourceImageUrl ? { uri: sourceImageUrl } : undefined}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.content}>
          <Text style={styles.title}>Pregled</Text>
          <Text style={styles.description}>Proveri i pokreni.</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pokret</Text>
            <Text style={styles.summaryPrompt} numberOfLines={2}>{selectedMotionLabel}</Text>
            <View style={styles.summaryMetaRow}>
              <View style={styles.summaryMetaBlock}>
                <Text style={styles.summaryLabel}>Trajanje</Text>
                <Text style={styles.summaryMetaValue}>{duration}s</Text>
              </View>
              <View style={[styles.summaryMetaBlock, styles.metaRight]}>
                <Text style={styles.summaryLabel}>Krediti</Text>
                <Text style={styles.summaryMetaValue}>{duration === '5' ? '10' : '20'}</Text>
              </View>
            </View>
          </View>

          {error ? (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} activeOpacity={0.88}>
            <Ionicons name="videocam" size={20} color={COLORS.white} />
            <Text style={styles.generateBtnText}>Generiši</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showNoCreditsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNoCreditsModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowNoCreditsModal(false)}>
            <View style={styles.noCreditsCard}>
              <View style={styles.noCreditsIconWrap}>
                <Ionicons name="wallet-outline" size={28} color={GOLD} />
              </View>
              <Text style={styles.noCreditsTitle}>Nemate više video kredita</Text>
              <Text style={styles.noCreditsText}>
                Obnovi pretplatu ili kupi dopunu u Shopu da nastaviš generisanje videa.
              </Text>
              <View style={styles.noCreditsActions}>
                <TouchableOpacity
                  style={styles.noCreditsSecondaryBtn}
                  onPress={() => setShowNoCreditsModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.noCreditsSecondaryText}>Kasnije</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.noCreditsPrimaryBtn}
                  onPress={() => {
                    setShowNoCreditsModal(false);
                    router.replace('/shop');
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.noCreditsPrimaryText}>Idi u Shop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </ImageBackground>
    </VideoWizardShell>
  );
}

function StartingOverlay() {
  const insets = useSafeAreaInsets();
  const ring1 = useSharedValue(0.6);
  const ring2 = useSharedValue(0.4);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    ring1.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    ring2.value = withRepeat(
      withDelay(300, withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })),
      -1,
      true
    );
    iconScale.value = withRepeat(
      withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [iconScale, ring1, ring2]);

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring1.value * 0.6 }],
    opacity: 1 - ring1.value * 0.7,
  }));
  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring2.value * 0.9 }],
    opacity: 1 - ring2.value * 0.8,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <View style={overlayStyles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={overlayStyles.safe} edges={['top', 'bottom']}>
        <View style={overlayStyles.center}>
          <View style={overlayStyles.ringsWrap}>
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring2, ringStyle2]} />
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring1, ringStyle1]} />
            <Animated.View style={[overlayStyles.iconCircle, iconStyle]}>
              <Ionicons name="videocam" size={36} color={DARK_GREEN} />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeIn.delay(200).duration(400)} style={overlayStyles.title}>
            Krećemo
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(400).duration(400)} style={overlayStyles.subtitle}>
            Samo trenutak
          </Animated.Text>
        </View>

        <View style={[overlayStyles.bottomRow, { paddingBottom: insets.bottom + 12 }]}>
          <AppLogo height={28} maxWidth={140} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function GeneratingOverlay({
  attempt,
  duration,
  onLeaveToBackground,
}: {
  attempt: number;
  duration: '5' | '10';
  onLeaveToBackground: () => void;
}) {
  const insets = useSafeAreaInsets();
  const ring1 = useSharedValue(0.6);
  const ring2 = useSharedValue(0.4);
  const ring3 = useSharedValue(0.2);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    ring1.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    ring2.value = withRepeat(
      withDelay(300, withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })),
      -1,
      true
    );
    ring3.value = withRepeat(
      withDelay(600, withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })),
      -1,
      true
    );
    iconScale.value = withRepeat(
      withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [iconScale, ring1, ring2, ring3]);

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring1.value * 0.6 }],
    opacity: 1 - ring1.value * 0.7,
  }));
  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring2.value * 0.9 }],
    opacity: 1 - ring2.value * 0.8,
  }));
  const ringStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring3.value * 1.2 }],
    opacity: 1 - ring3.value * 0.9,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const estimatedTotal = duration === '5' ? 18 : 30;
  const progress = Math.min(attempt / estimatedTotal, 0.95);
  const minutes = Math.max(1, Math.ceil((estimatedTotal - attempt) * 10 / 60));

  return (
    <View style={overlayStyles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={overlayStyles.safe} edges={['top', 'bottom']}>
        <View style={overlayStyles.center}>
          <View style={overlayStyles.ringsWrapLarge}>
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring3, ringStyle3]} />
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring2, ringStyle2]} />
            <Animated.View style={[overlayStyles.ring, overlayStyles.ring1, ringStyle1]} />
            <Animated.View style={[overlayStyles.iconCircle, iconStyle]}>
              <Ionicons name="videocam" size={36} color={DARK_GREEN} />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeIn.delay(200).duration(400)} style={overlayStyles.title}>
            Kreiramo tvoj video
          </Animated.Text>

          <View style={overlayStyles.progressWrap}>
            <View style={overlayStyles.progressTrack}>
              <View style={[overlayStyles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={overlayStyles.progressText}>
              {attempt > 0 ? `~${minutes} min preostalo` : 'Priprema...'}
            </Text>
          </View>

          <Text style={overlayStyles.hint}>
            Možeš ostati ovde ili izaći. Videćeš notifikaciju kada video bude spreman.
          </Text>

          <TouchableOpacity
            style={overlayStyles.leaveBtn}
            onPress={onLeaveToBackground}
            activeOpacity={0.85}
          >
            <Ionicons name="exit-outline" size={18} color={COLORS.white} />
            <Text style={overlayStyles.leaveBtnText}>{t('video.continue_in_background')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[overlayStyles.bottomRow, { paddingBottom: insets.bottom + 12 }]}>
          <AppLogo height={28} maxWidth={140} />
        </View>
      </SafeAreaView>
    </View>
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
    paddingTop: 40,
    paddingBottom: 44,
  },
  title: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 28,
    color: COLORS.white,
    marginBottom: 8,
  },
  description: {
    fontFamily: FONTS.primary.regular,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 20,
  },
  summaryPrompt: {
    fontFamily: FONTS.primary.regular,
    fontSize: 15,
    lineHeight: 22,
    color: DARK,
    marginBottom: 16,
  },
  summaryLabel: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 11,
    color: COLORS.gray[500],
    letterSpacing: 1.2,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryMetaBlock: {},
  metaRight: {
    alignItems: 'flex-end',
  },
  summaryMetaValue: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 22,
    color: DARK_GREEN,
    marginTop: 4,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: DARK_GREEN,
    borderRadius: 28,
    paddingVertical: 16,
    marginBottom: 12,
  },
  generateBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.4,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(214,79,79,0.14)',
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: '#FFD2D2',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noCreditsCard: {
    backgroundColor: '#F8F4EF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.24)',
  },
  noCreditsIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(207,143,90,0.12)',
    marginBottom: 16,
    alignSelf: 'center',
  },
  noCreditsTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 22,
    color: DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  noCreditsText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
    lineHeight: 21,
    color: '#6F6A64',
    textAlign: 'center',
  },
  noCreditsActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  noCreditsSecondaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(44,42,40,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  noCreditsSecondaryText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    color: DARK,
  },
  noCreditsPrimaryBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD,
  },
  noCreditsPrimaryText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 14,
    color: COLORS.white,
  },
});

const overlayStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK_GREEN },
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  ringsWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  ringsWrapLarge: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ring1: { width: 100, height: 100 },
  ring2: { width: 130, height: 130 },
  ring3: { width: 160, height: 160 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  title: {
    fontFamily: FONTS.heading.medium,
    fontSize: 24,
    color: COLORS.white,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.primary.light,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  progressWrap: { width: '100%', marginTop: 32, alignItems: 'center' },
  progressTrack: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 2 },
  progressText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 10,
  },
  hint: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  leaveBtnText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  bottomRow: { alignItems: 'center', paddingTop: 12 },
});
