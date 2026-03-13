// ===========================================
// DAJANA AI - Try-On Generating Screen
// Elegant staged loading with animated text
// ===========================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTryOnStore } from '@/stores/tryOnStore';
import { useAuthStore } from '@/stores/authStore';
import { generateTryOn, saveTryOnImage, saveOutfitComposition } from '@/lib/tryOnService';
import { hasImageCredits, deductImageCredit } from '@/lib/creditService';
import { logImageGeneration } from '@/lib/generationLog';
import { FONTS, COLORS } from '@/constants/theme';
import { AppLogo } from '@/components/AppLogo';
import { t } from '@/lib/i18n';

const { width: SW } = Dimensions.get('window');
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';

function getStages() {
  return [
    { label: t('try_on.generating_step1'), icon: '✦' },
    { label: t('try_on.generating_step2'), icon: '◇' },
    { label: t('try_on.generating_step3'), icon: '✧' },
    { label: t('try_on.generating_step4'), icon: '❋' },
    { label: t('try_on.generating_step5'), icon: '♡' },
  ];
}

const STAGE_DURATION = 5500; // ms per stage

export default function TryOnGeneratingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    faceImageBase64, outfitImageUrl, outfitTitle, outfitId, outfitItems,
    setGeneratedImage, setError, setGenerating,
  } = useTryOnStore();

  const [stageIndex, setStageIndex] = useState(0);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(12)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const STAGES = getStages();
  const dotAnims = useRef(STAGES.map(() => new Animated.Value(0))).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Screen fade in
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();
  }, []);

  // Shimmer loop on the progress bar
  useEffect(() => {
    const s = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true,
      })
    );
    s.start();
    return () => s.stop();
  }, []);

  // Pulse on icon
  useEffect(() => {
    const p = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    p.start();
    return () => p.stop();
  }, []);

  // Stage cycling: samo 1 → 5, bez ponavljanja
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev >= STAGES.length - 1) return prev;
        return prev + 1;
      });
    }, STAGE_DURATION);
    return () => clearInterval(interval);
  }, []);

  // Animate text on stage change
  useEffect(() => {
    // Reset
    textFade.setValue(0);
    textSlide.setValue(12);

    // Animate in
    Animated.parallel([
      Animated.timing(textFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(textSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    // Activate dot
    Animated.timing(dotAnims[stageIndex], {
      toValue: 1, duration: 400, useNativeDriver: false,
    }).start();

    // Progress
    Animated.timing(progressAnim, {
      toValue: (stageIndex + 1) / STAGES.length,
      duration: 600,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [stageIndex]);

  // --- Generation logic ---
  const runGeneration = useCallback(async () => {
    const hasItems = outfitItems.length > 0;
    const hasSingle = outfitId && outfitImageUrl;
    if (!faceImageBase64) {
      setError(t('try_on.error_no_face'));
      router.replace('/try-on/upload');
      return;
    }
    if (!hasItems && !hasSingle) {
      setError('Nedostaje outfit. Izaberi outfit u Kapsuli ili Ormaru.');
      router.replace('/try-on/upload');
      return;
    }
    if (!user?.id) {
      setError('Morate biti prijavljeni.');
      router.replace('/try-on/upload');
      return;
    }
    const hasCredits = await hasImageCredits(user.id);
    if (!hasCredits) {
      setError('Nemate dovoljno kredita za slike. Kupite više u Profilu.');
      router.replace('/try-on/upload');
      return;
    }
    const effectiveOutfitId = hasItems ? outfitItems[0].id : outfitId!;
    setGenerating(true);
    setError(null);
    try {
      const items = hasItems
        ? outfitItems.map((i) => ({ imageUrl: i.imageUrl, title: i.title }))
        : [{ imageUrl: outfitImageUrl!, title: outfitTitle || null }];

      const result = await generateTryOn(faceImageBase64, items);
      await deductImageCredit(user.id);
      useAuthStore.getState().fetchCredits();
      const savedUri = await saveTryOnImage(result.imageBase64, effectiveOutfitId);

      await logImageGeneration(user.id, effectiveOutfitId ?? null, savedUri ?? null);

      // Sačuvaj outfit sa tryOnImageUri → na Home ide u OUTFIT/Ormar sekciju (ne u Kapsula)
      const compositionItems = hasItems
        ? outfitItems.map((i) => ({ id: i.id, imageUrl: i.imageUrl, title: i.title, zoneId: i.zoneId }))
        : [{ id: outfitId!, imageUrl: outfitImageUrl!, title: outfitTitle || null }];
      await saveOutfitComposition(compositionItems, savedUri).catch(() => {});

      setGeneratedImage(result.imageBase64, savedUri);
      setGenerating(false);
      router.replace('/try-on/result');
    } catch (err: any) {
      console.error('[TryOn] Generation error:', err);
      setGenerating(false);
      setError(err.message || 'Generation failed');
      router.replace('/try-on/result');
    }
  }, [faceImageBase64, outfitImageUrl, outfitId, outfitTitle, outfitItems, user?.id]);

  useEffect(() => { runGeneration(); }, [runGeneration]);

  // --- Derived values ---
  const pw = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-SW, SW],
  });

  const stage = STAGES[stageIndex];

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {/* Top section — logo */}
      <View style={styles.topSection}>
        <AppLogo height={36} maxWidth={160} />
        <Text style={styles.brandSub}>AI STILISTA</Text>
      </View>

      {/* Center — animated stage icon + text */}
      <View style={styles.centerSection}>
        <Animated.Text style={[styles.stageIcon, { transform: [{ scale: pulseAnim }] }]}>
          {stage.icon}
        </Animated.Text>

        <Animated.View style={{ opacity: textFade, transform: [{ translateY: textSlide }] }}>
          <Text style={styles.stageText}>{stage.label}</Text>
        </Animated.View>
      </View>

      {/* Bottom — stage dots + progress */}
      <View style={styles.bottomSection}>
        {/* Stage dots */}
        <View style={styles.dotsRow}>
          {STAGES.map((_, idx) => {
            const dotScale = dotAnims[idx].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1],
            });
            const dotBg = dotAnims[idx].interpolate({
              inputRange: [0, 1],
              outputRange: ['#D8D3CC', COLORS.primary],
            });
            const isActive = idx <= stageIndex;
            return (
              <Animated.View
                key={idx}
                style={[
                  styles.dot,
                  idx === stageIndex && styles.dotActive,
                  {
                    backgroundColor: isActive ? COLORS.primary : '#D8D3CC',
                    transform: [{ scale: dotScale }],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: pw }]}>
            {/* Shimmer */}
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />
          </Animated.View>
        </View>

        {/* Stage counter */}
        <Text style={styles.stageCounter}>
          {stageIndex + 1} / {STAGES.length}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },

  // Top
  topSection: {
    alignItems: 'center',
    gap: 4,
  },
  brandText: {
    fontFamily: FONTS.logo || FONTS.heading.bold,
    fontSize: 18,
    letterSpacing: 8,
    color: DARK,
  },
  brandSub: {
    fontFamily: FONTS.primary.light,
    fontSize: 11,
    letterSpacing: 4,
    color: '#A09A92',
  },

  // Center
  centerSection: {
    alignItems: 'center',
    gap: 20,
  },
  stageIcon: {
    fontSize: 42,
    color: COLORS.primary,
    marginBottom: 4,
  },
  stageText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 17,
    color: DARK,
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Bottom
  bottomSection: {
    alignItems: 'center',
    gap: 18,
    width: '100%',
    paddingHorizontal: 50,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(207,143,90,0.2)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 1,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  stageCounter: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: '#A09A92',
    letterSpacing: 1,
  },
});
