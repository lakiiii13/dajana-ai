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
import { FONTS } from '@/constants/theme';
import { AppLogo } from '@/components/AppLogo';

const { width: SW } = Dimensions.get('window');

// --- Stage definitions ---
const STAGES = [
  { label: 'Analiziram tvoj stil...', icon: '✦' },
  { label: 'Biram savršeni kroj...', icon: '◇' },
  { label: 'Kreiram tvoj outfit...', icon: '✧' },
  { label: 'Dodajem završne detalje...', icon: '❋' },
  { label: 'Gotovo za tebe...', icon: '♡' },
];

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

  // Stage cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = (prev + 1) % STAGES.length;
        return next;
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
      setError('Nedostaje slika lica. Vrati se i izaberi fotografiju.');
      router.replace('/try-on/upload');
      return;
    }
    if (!hasItems && !hasSingle) {
      setError('Nedostaje outfit. Izaberi outfit u Kapsuli ili Ormaru.');
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
      const savedUri = await saveTryOnImage(result.imageBase64, effectiveOutfitId);

      const compositionItems = hasItems
        ? outfitItems.map((i) => ({ id: i.id, imageUrl: i.imageUrl, title: i.title }))
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
  }, [faceImageBase64, outfitImageUrl, outfitId, outfitTitle, outfitItems]);

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
              outputRange: ['#D8D3CC', '#3C3C3C'],
            });
            const isActive = idx <= stageIndex;
            return (
              <Animated.View
                key={idx}
                style={[
                  styles.dot,
                  idx === stageIndex && styles.dotActive,
                  {
                    backgroundColor: isActive ? '#3C3C3C' : '#D8D3CC',
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
    backgroundColor: '#FDFBF8',
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
    color: '#3C3C3C',
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
    color: '#C9A962',
    marginBottom: 4,
  },
  stageText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 17,
    color: '#3C3C3C',
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
    backgroundColor: '#E8E4E0',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3C3C3C',
    borderRadius: 1,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  stageCounter: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: '#A09A92',
    letterSpacing: 1,
  },
});
