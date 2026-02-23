// ===========================================
// DAJANA AI - Video Generate
// Pick image, enter prompt, choose duration,
// generate video with luxury loading animation
// Source: gallery, existing try-on results, or outfits
// ===========================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  ScrollView,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { useVideoStore } from '@/stores/videoStore';
import { useTryOnStore } from '@/stores/tryOnStore';
import { startVideoGeneration } from '@/lib/videoService';
import { saveBackgroundJob } from '@/lib/backgroundVideoTask';
import { AppLogo } from '@/components/AppLogo';
import { getSavedTryOnImages, getSavedOutfits, type SavedTryOnImage, type SavedOutfit } from '@/lib/tryOnService';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';
const CARD_BG = '#FFFCF9';

const PICKER_THUMB = (W - SPACING.lg * 2 - 14 * 2) / 3;

export default function VideoGenerateScreen() {
  const insets = useSafeAreaInsets();
  const {
    sourceImageUrl,
    prompt,
    duration,
    status,
    error,
    setSource,
    setPrompt,
    setDuration,
    setStatus,
    setError,
    resetGeneration,
  } = useVideoStore();

  const tryOnItems = useTryOnStore((s) => s.outfitItems);
  const generatedImageUri = useTryOnStore((s) => s.generatedImageUri);

  // Source picker modal
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [tryOnImages, setTryOnImages] = useState<SavedTryOnImage[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  useEffect(() => {
    if (!sourceImageUrl) {
      if (generatedImageUri) {
        setSource(generatedImageUri);
      } else if (tryOnItems.length > 0) {
        setSource(tryOnItems[0].imageUrl);
      }
    }
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const [imgs, outfits] = await Promise.all([
        getSavedTryOnImages(),
        getSavedOutfits(),
      ]);
      setTryOnImages(imgs);
      setSavedOutfits(outfits);
    } catch (e) {
      console.error('[VideoGen] Load sources error', e);
    }
  }, []);

  const handleOpenSourcePicker = () => {
    loadSources();
    setShowSourcePicker(true);
  };

  const handlePickFromGallery = async () => {
    setShowSourcePicker(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setSource(result.assets[0].uri);
    }
  };

  const handleSelectTryOn = (img: SavedTryOnImage) => {
    setSource(img.uri);
    setShowSourcePicker(false);
  };

  const handleSelectOutfit = (outfit: SavedOutfit) => {
    const src = outfit.tryOnImageUri || (outfit.items[0]?.imageUrl);
    if (src) {
      setSource(src);
    }
    setShowSourcePicker(false);
  };

  const backgroundJob = useVideoStore((s) => s.backgroundJob);
  const startBgJob = useVideoStore((s) => s.startBackgroundJob);

  const handleGenerate = async () => {
    if (!sourceImageUrl) {
      Alert.alert('Slika', 'Izaberi sliku za video');
      return;
    }

    if (backgroundJob) {
      Alert.alert(
        'Video u toku',
        'Već se generiše jedan video. Sačekaj da se završi pre nego što pokreneš novi.',
      );
      return;
    }

    setError(null);
    setStatus('generating');

    try {
      const { jobId, publicImageUrl } = await startVideoGeneration(sourceImageUrl, prompt, duration);

      const jobMeta = {
        jobId,
        sourceImageUrl: publicImageUrl,
        publicImageUrl,
        prompt,
        duration,
        startedAt: new Date().toISOString(),
      };

      await saveBackgroundJob(jobMeta);
      startBgJob(jobMeta);
      setStatus('idle');
      // Ostajemo na ekranu – prikazuje se GeneratingOverlay; korisnik može da ostane ili da izađe dugmetom
    } catch (e: any) {
      console.error('[VideoGen]', e);
      setError(e.message || 'Greška pri generisanju videa');
      setStatus('error');
    }
  };

  const handleBack = () => {
    if (status === 'generating') return;
    resetGeneration();
    router.back();
  };

  const isStarting = status === 'generating' && !backgroundJob;
  const bgPollAttempt = useVideoStore((s) => s.bgPollAttempt);

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Novi Video</Text>
            <View style={styles.headerAccent} />
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Source Image */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={styles.sectionLabel}>IZVOR SLIKE</Text>
            <TouchableOpacity
              style={styles.imagePickerWrap}
              onPress={handleOpenSourcePicker}
              activeOpacity={0.85}
            >
              {sourceImageUrl ? (
                <Image
                  source={{ uri: sourceImageUrl }}
                  style={styles.sourceImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.imagePlaceholderCircle}>
                    <Ionicons name="image-outline" size={36} color={GOLD} />
                  </View>
                  <Text style={styles.imagePlaceholderText}>Izaberi fotografiju</Text>
                  <Text style={styles.imagePlaceholderSub}>
                    Try-on rezultat, outfit ili nova slika
                  </Text>
                </View>
              )}
              {sourceImageUrl && (
                <View style={styles.imageChangeBtn}>
                  <Ionicons name="camera-outline" size={16} color={COLORS.white} />
                  <Text style={styles.imageChangeBtnText}>Promeni</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Prompt */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Text style={styles.sectionLabel}>OPIS SCENE</Text>
            <View style={styles.promptWrap}>
              <TextInput
                style={styles.promptInput}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="npr. okret levo..."
                placeholderTextColor={COLORS.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.promptHints}>
              {['Okret levo', 'Okret desno', 'Stajanje u mestu'].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.hintChip, prompt.includes(h) && styles.hintChipActive]}
                  onPress={() => setPrompt(h)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.hintChipText, prompt.includes(h) && styles.hintChipTextActive]}
                  >
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Duration */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Text style={styles.sectionLabel}>TRAJANJE</Text>
            <View style={styles.durationRow}>
              <TouchableOpacity
                style={[styles.durationCard, duration === '5' && styles.durationCardActive]}
                onPress={() => setDuration('5')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={duration === '5' ? COLORS.white : GOLD}
                />
                <Text
                  style={[styles.durationValue, duration === '5' && styles.durationValueActive]}
                >
                  5s
                </Text>
                <Text
                  style={[styles.durationLabel, duration === '5' && styles.durationLabelActive]}
                >
                  10 kredita
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.durationCard, duration === '10' && styles.durationCardActive]}
                onPress={() => setDuration('10')}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={duration === '10' ? COLORS.white : GOLD}
                />
                <Text
                  style={[styles.durationValue, duration === '10' && styles.durationValueActive]}
                >
                  10s
                </Text>
                <Text
                  style={[styles.durationLabel, duration === '10' && styles.durationLabelActive]}
                >
                  20 kredita
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Error */}
          {error && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.errorWrap}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={[styles.bottomWrap, { paddingBottom: insets.bottom + 12 }]}
        >
          <TouchableOpacity
            style={[styles.ctaBtn, !sourceImageUrl && styles.ctaBtnDisabled]}
            onPress={handleGenerate}
            disabled={!sourceImageUrl}
            activeOpacity={0.85}
          >
            <Ionicons name="videocam" size={20} color={COLORS.white} />
            <Text style={styles.ctaText}>Generiši Video</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* ========== Source Picker Modal ========== */}
      <Modal
        visible={showSourcePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSourcePicker(false)}
      >
        <View style={pickerStyles.container}>
          <SafeAreaView style={pickerStyles.safe} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={pickerStyles.header}>
              <Text style={pickerStyles.headerTitle}>Izaberi sliku</Text>
              <TouchableOpacity onPress={() => setShowSourcePicker(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={DARK} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={pickerStyles.scrollContent}>
              {/* Gallery option */}
              <TouchableOpacity style={pickerStyles.optionCard} onPress={handlePickFromGallery} activeOpacity={0.85}>
                <View style={pickerStyles.optionIconWrap}>
                  <Ionicons name="images-outline" size={28} color={GOLD} />
                </View>
                <View style={pickerStyles.optionTextWrap}>
                  <Text style={pickerStyles.optionTitle}>Iz galerije</Text>
                  <Text style={pickerStyles.optionSub}>Upload novu fotografiju</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
              </TouchableOpacity>

              {/* Try-on results */}
              {tryOnImages.length > 0 && (
                <View style={pickerStyles.section}>
                  <Text style={pickerStyles.sectionTitle}>TRY-ON REZULTATI</Text>
                  <View style={pickerStyles.thumbGrid}>
                    {tryOnImages.slice(0, 9).map((img) => (
                      <TouchableOpacity
                        key={img.uri}
                        style={pickerStyles.thumbCard}
                        onPress={() => handleSelectTryOn(img)}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: img.uri }} style={pickerStyles.thumbImage} resizeMode="cover" />
                        <View style={pickerStyles.thumbBadge}>
                          <Ionicons name="sparkles" size={10} color={COLORS.white} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Saved outfits */}
              {savedOutfits.length > 0 && (
                <View style={pickerStyles.section}>
                  <Text style={pickerStyles.sectionTitle}>SAČUVANI OUTFITI</Text>
                  <View style={pickerStyles.thumbGrid}>
                    {savedOutfits.slice(0, 9).map((outfit) => {
                      const thumb = outfit.tryOnImageUri || outfit.items[0]?.imageUrl;
                      if (!thumb) return null;
                      return (
                        <TouchableOpacity
                          key={outfit.id}
                          style={pickerStyles.thumbCard}
                          onPress={() => handleSelectOutfit(outfit)}
                          activeOpacity={0.85}
                        >
                          <Image source={{ uri: thumb }} style={pickerStyles.thumbImage} resizeMode="cover" />
                          <View style={[pickerStyles.thumbBadge, { backgroundColor: GOLD }]}>
                            <Ionicons name="layers-outline" size={10} color={COLORS.white} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {tryOnImages.length === 0 && savedOutfits.length === 0 && (
                <View style={pickerStyles.emptyHint}>
                  <Ionicons name="shirt-outline" size={32} color={COLORS.gray[300]} />
                  <Text style={pickerStyles.emptyHintText}>
                    Napravi Try-On ili sačuvaj outfit{'\n'}pa ga koristi za video
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

/* ==========================================
   Starting overlay (brief, while initial API call runs)
   ========================================== */

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
  }, []);

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
    <View style={genStyles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={genStyles.safe} edges={['top', 'bottom']}>
        <View style={genStyles.center}>
          <View style={genStyles.ringsWrap}>
            <Animated.View style={[genStyles.ring, genStyles.ring2, ringStyle2]} />
            <Animated.View style={[genStyles.ring, genStyles.ring1, ringStyle1]} />
            <Animated.View style={[genStyles.iconCircle, iconStyle]}>
              <Ionicons name="videocam" size={36} color={COLORS.white} />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeIn.delay(200).duration(400)} style={genStyles.title}>
            Pokre{'ć'}emo generisanje...
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(400).duration(400)} style={genStyles.subtitle}>
            Samo trenutak
          </Animated.Text>
        </View>

        <View style={[genStyles.bottomRow, { paddingBottom: insets.bottom + 12 }]}>
          <AppLogo height={28} maxWidth={140} />
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ==========================================
   Full generating overlay – animacija + progress + opcija "Nastavi u pozadini"
   ========================================== */

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
  }, []);

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
    <View style={genStyles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={genStyles.safe} edges={['top', 'bottom']}>
        <View style={genStyles.center}>
          <View style={genStyles.ringsWrapLarge}>
            <Animated.View style={[genStyles.ring, genStyles.ring3, ringStyle3]} />
            <Animated.View style={[genStyles.ring, genStyles.ring2, ringStyle2]} />
            <Animated.View style={[genStyles.ring, genStyles.ring1, ringStyle1]} />
            <Animated.View style={[genStyles.iconCircle, iconStyle]}>
              <Ionicons name="videocam" size={36} color={COLORS.white} />
            </Animated.View>
          </View>

          <Animated.Text entering={FadeIn.delay(200).duration(400)} style={genStyles.title}>
            Stvaramo tvoj video
          </Animated.Text>
          <Animated.Text entering={FadeIn.delay(400).duration(400)} style={genStyles.subtitle}>
            AI magija u toku...
          </Animated.Text>

          <View style={genStyles.progressWrap}>
            <View style={genStyles.progressTrack}>
              <View style={[genStyles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={genStyles.progressText}>
              {attempt > 0 ? `~${minutes} min preostalo` : 'Priprema...'}
            </Text>
          </View>

          <Text style={genStyles.hint}>
            Možeš ostati ovde ili izaći – videćeš notifikaciju kada bude spreman.
          </Text>

          <TouchableOpacity
            style={genStyles.leaveBtn}
            onPress={onLeaveToBackground}
            activeOpacity={0.85}
          >
            <Ionicons name="exit-outline" size={18} color={GOLD} />
            <Text style={genStyles.leaveBtnText}>Nastavi u pozadini</Text>
          </TouchableOpacity>
        </View>

        <View style={[genStyles.bottomRow, { paddingBottom: insets.bottom + 12 }]}>
          <AppLogo height={28} maxWidth={140} />
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ==========================================
   Styles – Generate form
   ========================================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 22,
    color: DARK,
    letterSpacing: 1.5,
  },
  headerAccent: {
    width: 28,
    height: 2,
    backgroundColor: GOLD,
    marginTop: 6,
    borderRadius: 1,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  sectionLabel: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 11,
    color: COLORS.gray[500],
    letterSpacing: 2,
    marginBottom: 10,
    marginTop: 22,
  },

  imagePickerWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.12)',
    height: 220,
  },
  sourceImage: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GOLD + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  imagePlaceholderText: {
    fontFamily: FONTS.heading.medium,
    fontSize: 16,
    color: DARK,
    letterSpacing: 0.5,
  },
  imagePlaceholderSub: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 4,
  },
  imageChangeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  imageChangeBtnText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 12,
    color: COLORS.white,
  },

  promptWrap: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.12)',
    padding: 14,
  },
  promptInput: {
    fontFamily: FONTS.primary.regular,
    fontSize: 15,
    color: DARK,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  promptHints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  hintChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  hintChipActive: {
    backgroundColor: GOLD + '18',
    borderColor: GOLD,
  },
  hintChipText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: COLORS.gray[600],
  },
  hintChipTextActive: {
    color: GOLD,
    fontFamily: FONTS.primary.semibold,
  },

  durationRow: { flexDirection: 'row', gap: 14 },
  durationCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 22,
    borderRadius: 18,
    backgroundColor: CARD_BG,
    borderWidth: 1.5,
    borderColor: 'rgba(207,143,90,0.12)',
  },
  durationCardActive: {
    backgroundColor: GOLD,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  durationValue: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 26,
    color: DARK,
    marginTop: 6,
  },
  durationValueActive: { color: COLORS.white },
  durationLabel: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  durationLabelActive: { color: 'rgba(255,255,255,0.8)' },

  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.error + '10',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  errorText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: COLORS.error,
    flex: 1,
  },

  bottomWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(207,143,90,0.12)',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: GOLD,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaBtnDisabled: { opacity: 0.45 },
  ctaText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});

/* ==========================================
   Source Picker Modal styles
   ========================================== */

const pickerStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207,143,90,0.12)',
  },
  headerTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 20,
    color: DARK,
    letterSpacing: 1,
  },

  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.12)',
    marginBottom: 20,
  },
  optionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GOLD + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionTextWrap: { flex: 1 },
  optionTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 15,
    color: DARK,
  },
  optionSub: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 2,
  },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 11,
    color: COLORS.gray[500],
    letterSpacing: 2,
    marginBottom: 12,
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  thumbCard: {
    width: PICKER_THUMB,
    height: PICKER_THUMB,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F0EBE3',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyHint: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHintText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: COLORS.gray[400],
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
});

/* ==========================================
   Generating overlay styles
   ========================================== */

const genStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
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
    borderColor: GOLD,
  },
  ring1: { width: 100, height: 100 },
  ring2: { width: 130, height: 130 },
  ring3: { width: 160, height: 160 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },

  title: {
    fontFamily: FONTS.heading.medium,
    fontSize: 24,
    color: DARK,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.primary.light,
    fontSize: 15,
    color: COLORS.gray[500],
    marginTop: 8,
    letterSpacing: 0.5,
  },

  progressWrap: { width: '100%', marginTop: 32, alignItems: 'center' },
  progressTrack: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(207,143,90,0.15)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: GOLD, borderRadius: 2 },
  progressText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 10,
  },

  hint: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: COLORS.gray[400],
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
    borderColor: GOLD + '40',
    backgroundColor: GOLD + '08',
  },
  leaveBtnText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    color: GOLD,
    letterSpacing: 0.3,
  },

  bottomRow: { alignItems: 'center', paddingTop: 12 },
  brandText: {
    fontFamily: FONTS.heading.medium,
    fontSize: 14,
    color: GOLD,
    letterSpacing: 3,
    opacity: 0.5,
  },
});
