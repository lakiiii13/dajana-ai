import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS } from '@/constants/theme';
import { useVideoStore } from '@/stores/videoStore';
import { useTryOnStore } from '@/stores/tryOnStore';
import { getSavedTryOnImages, type SavedTryOnImage } from '@/lib/tryOnService';
import { VideoWizardShell } from '@/components/video/VideoWizardShell';

const DARK_GREEN = '#0D4326';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';
const { width: W } = Dimensions.get('window');

const CREAM = '#F8F4EF';

function EmptyState({ onGallery }: { onGallery: () => void }) {
  return (
    <View style={styles.emptyHero}>
      <Text style={styles.emptyTitle}>Nema try-on slika</Text>
      <Text style={styles.emptySub}>Napravi try-on ili izaberi iz galerije</Text>
      <TouchableOpacity style={styles.galleryButton} onPress={onGallery} activeOpacity={0.88}>
        <Ionicons name="images-outline" size={22} color={COLORS.white} />
        <Text style={styles.galleryButtonText}>Iz galerije</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function VideoGenerateSourceScreen() {
  const router = useRouter();
  const setSource = useVideoStore((s) => s.setSource);
  const resetGeneration = useVideoStore((s) => s.resetGeneration);
  const sourceImageUrl = useVideoStore((s) => s.sourceImageUrl);
  const tryOnItems = useTryOnStore((s) => s.outfitItems);
  const generatedImageUri = useTryOnStore((s) => s.generatedImageUri);

  const [tryOnImages, setTryOnImages] = useState<SavedTryOnImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!sourceImageUrl && generatedImageUri) setSource(generatedImageUri);
    else if (!sourceImageUrl && tryOnItems.length > 0) setSource(tryOnItems[0].imageUrl);
  }, [generatedImageUri, tryOnItems, sourceImageUrl, setSource]);

  const loadTryOnImages = useCallback(async () => {
    try {
      const imgs = await getSavedTryOnImages();
      setTryOnImages(imgs);
    } catch (e) {
      console.error('[VideoWizard] Load try-on images error', e);
    }
  }, []);

  useEffect(() => {
    if (!sourceImageUrl) loadTryOnImages();
  }, [sourceImageUrl, loadTryOnImages]);

  const handleClose = useCallback(() => {
    resetGeneration();
    router.back();
  }, [resetGeneration, router]);

  const handlePickFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) setSource(result.assets[0].uri);
  }, [setSource]);

  const handleSelectCurrent = useCallback(() => {
    if (tryOnImages.length > 0 && tryOnImages[currentIndex]) {
      setSource(tryOnImages[currentIndex].uri);
      router.replace('/video-generate/prompt');
    }
  }, [tryOnImages, currentIndex, setSource, router]);

  const handleContinue = useCallback(() => {
    if (!sourceImageUrl) {
      Alert.alert('Slika', 'Prvo izaberi jednu sliku.');
      return;
    }
    router.replace('/video-generate/prompt');
  }, [router, sourceImageUrl]);

  const handleChangeImage = useCallback(() => {
    setSource(null);
  }, [setSource]);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => tryOnImages.length > 0 ? (i + 1) % tryOnImages.length : 0);
  }, [tryOnImages.length]);

  const hasTryOnImages = tryOnImages.length > 0;
  const currentImage = hasTryOnImages ? tryOnImages[currentIndex] : null;

  return (
    <VideoWizardShell
      stepIndex={0}
      totalSteps={4}
      nextRoute="/video-generate/prompt"
      canGoNext={Boolean(sourceImageUrl)}
      onInvalidNext={() => Alert.alert('Slika', 'Prvo izaberi jednu sliku.')}
      onClose={handleClose}
      backgroundColor="#000"
      hideStepIndicator
    >
      <View style={styles.container}>
        {sourceImageUrl ? (
          <>
            <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(400)}>
              <Image source={{ uri: sourceImageUrl }} style={styles.fullImage} resizeMode="cover" />
              <View style={styles.overlay} />
            </Animated.View>
            <Animated.View style={styles.bottomPanel} entering={FadeInDown.duration(300).delay(100)}>
              <View style={styles.bottomRow}>
                <TouchableOpacity style={styles.primaryButtonCompact} onPress={handleChangeImage} activeOpacity={0.88}>
                  <Ionicons name="sync-outline" size={20} color={COLORS.white} />
                  <Text style={styles.primaryButtonText}>Promeni sliku</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomPillGhost} onPress={handleContinue} activeOpacity={0.88}>
                  <Text style={styles.bottomPillText}>Dalje</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        ) : hasTryOnImages && currentImage ? (
          <>
            <View style={carouselStyles.slideWrap} key={currentIndex}>
              <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(220)}>
                <Image source={{ uri: currentImage.uri }} style={carouselStyles.slideImage} resizeMode="cover" />
              </Animated.View>
            </View>
            {tryOnImages.length > 1 && (
              <View style={carouselStyles.dots}>
                {tryOnImages.map((_, i) => (
                  <View key={i} style={[carouselStyles.dot, i === currentIndex && carouselStyles.dotActive]} />
                ))}
              </View>
            )}
            <Animated.View style={styles.bottomPanel} entering={FadeInDown.duration(300).delay(100)}>
              <View style={[styles.bottomRow, styles.bottomRowCompact]}>
                <TouchableOpacity style={[styles.bottomPill, styles.bottomPillCompact]} onPress={handlePickFromGallery} activeOpacity={0.88}>
                  <Ionicons name="images-outline" size={16} color={COLORS.white} />
                  <Text style={[styles.bottomPillText, styles.bottomPillTextCompact]}>Galerija</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bottomPill, styles.bottomPillPrimary, styles.bottomPillCompact, styles.bottomPillPrimaryCompact]} onPress={handleSelectCurrent} activeOpacity={0.88}>
                  <Text style={[styles.bottomPillTextPrimary, styles.bottomPillTextPrimaryCompact]}>Izaberi</Text>
                </TouchableOpacity>
                {tryOnImages.length > 1 && (
                  <TouchableOpacity style={[styles.bottomPill, styles.bottomPillCompact]} onPress={goToNext} activeOpacity={0.88}>
                    <Text style={[styles.bottomPillText, styles.bottomPillTextCompact]}>Sledeca</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </>
        ) : (
          <>
            <EmptyState onGallery={handlePickFromGallery} />
          </>
        )}
      </View>
    </VideoWizardShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  emptyHero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: CREAM,
  },
  emptyTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 22,
    color: DARK,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    backgroundColor: DARK_GREEN,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  galleryButtonText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    gap: 12,
  },
  bottomRowCompact: {
    justifyContent: 'space-between',
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  bottomPillCompact: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
  bottomPillPrimary: {
    backgroundColor: GOLD,
    borderColor: GOLD,
    paddingVertical: 15,
    paddingHorizontal: 22,
  },
  bottomPillPrimaryCompact: {
    paddingVertical: 13,
    paddingHorizontal: 10,
  },
  bottomPillGhost: {
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
  bottomPillText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 13,
    color: COLORS.white,
  },
  bottomPillTextCompact: {
    fontSize: 12,
    flexShrink: 1,
  },
  bottomPillTextPrimary: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 16,
    color: COLORS.white,
  },
  bottomPillTextPrimaryCompact: {
    fontSize: 14,
  },
  primaryButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 15,
    color: COLORS.white,
  },
});

const carouselStyles = StyleSheet.create({
  slideWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
  },
  dots: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: COLORS.white,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
