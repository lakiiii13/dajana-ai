import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS } from '@/constants/theme';
import { useVideoStore } from '@/stores/videoStore';
import { useTryOnStore } from '@/stores/tryOnStore';
import { getSavedTryOnImages, type SavedTryOnImage } from '@/lib/tryOnService';
import { useAuthStore } from '@/stores/authStore';
import { ensureLocalImageUri, isRemoteUri } from '@/lib/imageCache';
import { VideoWizardShell } from '@/components/video/VideoWizardShell';
import { t } from '@/lib/i18n';

const DARK_GREEN = '#0D4326';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';
const { width: W } = Dimensions.get('window');

const CREAM = '#F8F4EF';

function EmptyState({ onGallery }: { onGallery: () => void }) {
  return (
    <View style={styles.emptyHero}>
      <Text style={styles.emptyTitle}>{t('video.no_tryon_images')}</Text>
      <Text style={styles.emptySub}>{t('video.no_tryon_gallery_hint')}</Text>
      <TouchableOpacity style={styles.galleryButton} onPress={onGallery} activeOpacity={0.88}>
        <Ionicons name="images-outline" size={22} color={COLORS.white} />
        <Text style={styles.galleryButtonText}>{t('video.from_gallery')}</Text>
      </TouchableOpacity>
    </View>
  );
}

function getInitialTryOnImages(): SavedTryOnImage[] {
  const preloaded = useVideoStore.getState().preloadedTryOnImages;
  return preloaded && preloaded.length > 0 ? preloaded : [];
}

export default function VideoGenerateSourceScreen() {
  const router = useRouter();
  const setSource = useVideoStore((s) => s.setSource);
  const resetGeneration = useVideoStore((s) => s.resetGeneration);
  const sourceImageUrl = useVideoStore((s) => s.sourceImageUrl);
  const tryOnItems = useTryOnStore((s) => s.outfitItems);
  const generatedImageUri = useTryOnStore((s) => s.generatedImageUri);

  const [tryOnImages, setTryOnImages] = useState<SavedTryOnImage[]>(getInitialTryOnImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [localUriByIndex, setLocalUriByIndex] = useState<Record<number, string>>({});

  const downloadStartedRef = useRef<Set<number>>(new Set());
  const didAutoRestore = React.useRef(false);
  const userClearedSource = React.useRef(false);
  useEffect(() => {
    if (userClearedSource.current) return;
    if (didAutoRestore.current) return;
    if (!sourceImageUrl && generatedImageUri) {
      didAutoRestore.current = true;
      setSource(generatedImageUri);
    } else if (!sourceImageUrl && tryOnItems.length > 0) {
      didAutoRestore.current = true;
      setSource(tryOnItems[0].imageUrl);
    }
  }, [generatedImageUri, tryOnItems, sourceImageUrl, setSource]);

  const loadTryOnImages = useCallback(async () => {
    try {
      const uid = useAuthStore.getState().user?.id ?? useAuthStore.getState().profile?.id;
      if (!uid) return;
      const imgs = await getSavedTryOnImages(uid);
      setTryOnImages(imgs);
    } catch (e) {
      console.error('[VideoWizard] Load try-on images error', e);
    }
  }, []);

  useEffect(() => {
    if (!sourceImageUrl) {
      loadTryOnImages();
    }
  }, [sourceImageUrl, loadTryOnImages]);

  useEffect(() => {
    if (sourceImageUrl && isRemoteUri(sourceImageUrl)) {
      ensureLocalImageUri(sourceImageUrl).then((localUri) => {
        if (localUri !== sourceImageUrl) setSource(localUri);
      }).catch(() => {});
    }
  }, [sourceImageUrl, setSource]);

  const preloadedLocalUris = useVideoStore((s) => s.preloadedLocalUris);

  useEffect(() => {
    const initial: Record<number, string> = {};
    tryOnImages.forEach((img, i) => {
      const local = preloadedLocalUris[img.uri];
      if (local) initial[i] = local;
    });
    setLocalUriByIndex(initial);
    downloadStartedRef.current = new Set();
  }, [tryOnImages, preloadedLocalUris]);

  // Download images to local cache so "Sledeca" is instant (no 30s network wait)
  useEffect(() => {
    if (tryOnImages.length === 0) return;
    const n = tryOnImages.length;
    const preloaded = useVideoStore.getState().preloadedLocalUris;
    const indicesToLoad = new Set<number>([
      0, 1, 2, 3, 4,
      currentIndex,
      (currentIndex + 1) % n,
      (currentIndex - 1 + n) % n,
    ]);
    indicesToLoad.forEach((i) => {
      if (i >= n) return;
      if (downloadStartedRef.current.has(i)) return;
      const uri = tryOnImages[i].uri;
      if (!isRemoteUri(uri)) return;
      if (preloaded[uri]) {
        downloadStartedRef.current.add(i);
        return;
      }
      downloadStartedRef.current.add(i);
      ensureLocalImageUri(uri).then((local) => {
        setLocalUriByIndex((prev) => (prev[i] === local ? prev : { ...prev, [i]: local }));
      }).catch(() => {});
    });
  }, [tryOnImages, currentIndex]);

  const handleClose = useCallback(() => {
    resetGeneration();
    router.back();
  }, [resetGeneration, router]);

  const handlePickFromGallery = useCallback(async () => {
    userClearedSource.current = false;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) setSource(result.assets[0].uri);
  }, [setSource]);

  const downloadAndNavigate = useCallback(async (uri: string) => {
    if (!uri) return;
    const alreadyLocal = !isRemoteUri(uri);
    if (alreadyLocal) {
      setNavigating(true);
      setSource(uri);
      router.replace('/video-generate/prompt' as any);
      setNavigating(false);
      return;
    }
    setNavigating(true);
    try {
      const localUri = await ensureLocalImageUri(uri);
      setSource(localUri);
      router.replace('/video-generate/prompt' as any);
    } finally {
      setNavigating(false);
    }
  }, [router, setSource]);

  const handleSelectCurrent = useCallback(async () => {
    if (tryOnImages.length === 0 || !tryOnImages[currentIndex]) return;
    userClearedSource.current = false;
    const img = tryOnImages[currentIndex];
    const alreadyLocal = localUriByIndex[currentIndex];
    if (alreadyLocal) {
      setNavigating(true);
      setSource(alreadyLocal);
      router.replace('/video-generate/prompt' as any);
      setNavigating(false);
      return;
    }
    await downloadAndNavigate(img.uri);
  }, [tryOnImages, currentIndex, localUriByIndex, downloadAndNavigate, setSource, router]);

  const handleContinue = useCallback(async () => {
    if (!sourceImageUrl) {
      Alert.alert(t('video.alert_image'), t('video.select_image_first'));
      return;
    }
    await downloadAndNavigate(sourceImageUrl);
  }, [sourceImageUrl, downloadAndNavigate]);

  const handleChangeImage = useCallback(() => {
    userClearedSource.current = true;
    useTryOnStore.getState().setGeneratedImage('', undefined);
    setSource(null);
  }, [setSource]);

  const hasTryOnImages = tryOnImages.length > 0;
  const currentImage = hasTryOnImages ? tryOnImages[currentIndex] : null;
  const canChangeImage = tryOnImages.length > 1;

  const goToNextIndex = useCallback(() => {
    if (tryOnImages.length === 0) return;
    setCurrentIndex((i) => (i + 1) % tryOnImages.length);
  }, [tryOnImages.length]);

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
                {canChangeImage && (
                  <TouchableOpacity style={styles.primaryButtonCompact} onPress={handleChangeImage} activeOpacity={0.88}>
                    <Ionicons name="sync-outline" size={20} color={COLORS.white} />
                    <Text style={styles.primaryButtonText}>{t('video.change_image')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.bottomPillGhost} onPress={handleContinue} activeOpacity={0.88} disabled={navigating}>
                  {navigating ? <ActivityIndicator size="small" color={COLORS.white} /> : <><Text style={styles.bottomPillText}>{t('video.next')}</Text><Ionicons name="chevron-forward" size={18} color={COLORS.white} /></>}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        ) : hasTryOnImages && currentImage ? (
          <>
            <View style={carouselStyles.slideWrap} key={currentIndex}>
              <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(180)}>
                <Image
                  source={{ uri: localUriByIndex[currentIndex] ?? currentImage.uri }}
                  style={carouselStyles.slideImage}
                  resizeMode="cover"
                />
              </Animated.View>
              {/* Hidden: preload next so when local is ready it's already in memory */}
              {tryOnImages.length > 1 && (
                <View style={carouselStyles.hiddenPreload} pointerEvents="none">
                  <Image
                    source={{ uri: localUriByIndex[(currentIndex + 1) % tryOnImages.length] ?? tryOnImages[(currentIndex + 1) % tryOnImages.length].uri }}
                    style={carouselStyles.slideImage}
                    resizeMode="cover"
                  />
                </View>
              )}
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
                  <Text style={[styles.bottomPillText, styles.bottomPillTextCompact]}>{t('video.gallery')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bottomPill, styles.bottomPillPrimary, styles.bottomPillCompact, styles.bottomPillPrimaryCompact]} onPress={handleSelectCurrent} activeOpacity={0.88} disabled={navigating}>
                  {navigating ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={[styles.bottomPillTextPrimary, styles.bottomPillTextPrimaryCompact]}>{t('video.select')}</Text>}
                </TouchableOpacity>
                {tryOnImages.length > 1 && (
                  <TouchableOpacity style={[styles.bottomPill, styles.bottomPillCompact]} onPress={goToNextIndex} activeOpacity={0.88}>
                    <Text style={[styles.bottomPillText, styles.bottomPillTextCompact]}>{t('video.next')}</Text>
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
  hiddenPreload: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
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
