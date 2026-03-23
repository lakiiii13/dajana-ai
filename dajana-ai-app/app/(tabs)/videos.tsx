// ===========================================
// DAJANA AI - Video Studio (Quiet Luxury / Editorial)
// Box slika, Kreiraj video, linija do Kolekcije, galerija videa
// ===========================================

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t, getLanguage } from '@/lib/i18n';
import { useVideoStore } from '@/stores/videoStore';
import { getSavedVideos, deleteSavedVideo, type SavedVideo } from '@/lib/videoService';
import { clearBackgroundJob as clearBgJobStorage } from '@/lib/backgroundVideoTask';
import { getSavedTryOnImages, type SavedTryOnImage } from '@/lib/tryOnService';
import { useAuthStore } from '@/stores/authStore';
import { ensureLocalImageUri, isRemoteUri } from '@/lib/imageCache';

const PRELOAD_IMAGE_COUNT = 12;
const PRELOAD_VIDEO_THUMB_COUNT = 8;
const PRELOAD_BATCH_MS = 80;

const PROMPT_TO_LABEL_KEY: Record<string, string> = {
  'The model walks very slowly forward in a controlled way while staying fully centered in frame. The camera gently zooms out only a little, keeping the full body and face clearly visible at all times. Do not let the model leave the frame. Do not widen beyond the original background.': 'video.motion_walk',
  'The model stands in place, slowly turns to the left side profile, and then stops and holds the pose. Keep the movement minimal, elegant, and centered. Keep the full body visible and do not change the background framing.': 'video.motion_left',
  'The model stands in place, slowly turns to the right side profile, and then stops and holds the pose. Keep the movement minimal, elegant, and centered. Keep the full body visible and do not change the background framing.': 'video.motion_right',
  'The model remains facing front and makes only a subtle elegant movement while keeping the full front side clearly visible. The pose should stay centered, stable, and fully in frame, with no major camera movement or background expansion.': 'video.motion_front',
};

function preloadToLocal(
  uris: string[],
  setPreloadedLocalUri: (remote: string, local: string) => void
) {
  uris.forEach((uri) => {
    if (!uri || !isRemoteUri(uri)) return;
    ensureLocalImageUri(uri)
      .then((local) => {
        if (local !== uri) setPreloadedLocalUri(uri, local);
      })
      .catch(() => {});
  });
}
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const DARK = '#1A1A1A';
const PASSEPARTOUT = '#F2EEE8';
const FRAME_MARGIN = 24;
const LINE_COLOR = 'rgba(44,42,40,0.3)';
const LINE_COLOR_STRONG = 'rgba(44,42,40,0.5)';

function GeneratingBanner({
  attempt,
  duration,
  onCancel,
}: {
  attempt: number;
  duration: '5' | '10';
  onCancel?: () => void;
}) {
  const est = duration === '5' ? 18 : 30;
  const min = Math.max(1, Math.ceil((est - attempt) * 10 / 60));
  return (
    <View style={bannerStyles.wrap}>
      <Ionicons name="videocam" size={18} color={GOLD} />
      <Text style={bannerStyles.text}>{t('video.generating_min', { min })}</Text>
      {onCancel && (
        <TouchableOpacity onPress={onCancel} style={bannerStyles.cancelBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={bannerStyles.cancelText}>{t('video.stop')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(207,143,90,0.12)',
    marginHorizontal: FRAME_MARGIN,
    marginTop: SPACING.sm,
    borderRadius: 12,
  },
  text: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
    color: DARK,
  },
  cancelBtn: { marginLeft: 'auto', paddingVertical: 4, paddingHorizontal: 8 },
  cancelText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
    color: DARK,
    textDecorationLine: 'underline',
  },
});

export default function VideosScreen() {
  const insets = useSafeAreaInsets();
  const savedVideos = useVideoStore((s) => s.savedVideos);
  const setSavedVideos = useVideoStore((s) => s.setSavedVideos);
  const backgroundJob = useVideoStore((s) => s.backgroundJob);
  const bgPollAttempt = useVideoStore((s) => s.bgPollAttempt);
  const clearBgJob = useVideoStore((s) => s.clearBackgroundJob);
  const [loading, setLoading] = React.useState(true);

  const handleCancelGeneration = useCallback(() => {
    Alert.alert(
      t('video.cancel_generation_title'),
      t('video.cancel_generation_message'),
      [
        { text: t('video.cancel'), style: 'cancel' },
        {
          text: t('video.abort'),
          style: 'destructive',
          onPress: async () => {
            await clearBgJobStorage();
            clearBgJob();
          },
        },
      ]
    );
  }, [clearBgJob]);
  const [refreshing, setRefreshing] = React.useState(false);

  const currentUserId = useAuthStore((s) => s.user?.id ?? s.profile?.id ?? '');
  const userGeneratedImages = useVideoStore((s) => s.userGeneratedImages);
  const setUserGeneratedImages = useVideoStore((s) => s.setUserGeneratedImages);
  const setPreloadedTryOnImages = useVideoStore((s) => s.setPreloadedTryOnImages);
  const setPreloadedLocalUri = useVideoStore((s) => s.setPreloadedLocalUri);
  const setPreloadedLocalUrisBatch = useVideoStore((s) => s.setPreloadedLocalUrisBatch);
  const clearPreloadedLocalUris = useVideoStore((s) => s.clearPreloadedLocalUris);
  const preloadedLocalUris = useVideoStore((s) => s.preloadedLocalUris);

  /** Jedinstvene slike: po generationId (garantovano jedinstveno) + URL deduplikacija. */
  const uniqueImages = useMemo(() => {
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    return userGeneratedImages.filter((img) => {
      const id = img.generationId || '';
      const baseUri = (img.uri || '').split('?')[0].trim().toLowerCase();
      if (seenIds.has(id) || (baseUri && seenUrls.has(baseUri))) return false;
      seenIds.add(id);
      if (baseUri) seenUrls.add(baseUri);
      return true;
    });
  }, [userGeneratedImages]);

  const preloadBatchRef = useRef<Record<string, string>>({});
  const preloadFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const batchedSetPreloaded = useCallback(
    (remote: string, local: string) => {
      preloadBatchRef.current[remote] = local;
      if (preloadFlushTimerRef.current != null) return;
      preloadFlushTimerRef.current = setTimeout(() => {
        preloadFlushTimerRef.current = null;
        const batch = { ...preloadBatchRef.current };
        preloadBatchRef.current = {};
        setPreloadedLocalUrisBatch(batch);
      }, PRELOAD_BATCH_MS);
    },
    [setPreloadedLocalUrisBatch]
  );

  const loadVideosOnly = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const vids = await getSavedVideos(currentUserId);
      setSavedVideos(vids);
    } catch (e) {
      console.error('[Videos] Load videos error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);
  const loadImagesForBox = useCallback(async () => {
    if (!currentUserId) return;
    try {
      clearPreloadedLocalUris();
      const imgs = await getSavedTryOnImages(currentUserId);
      setUserGeneratedImages(imgs);
      setPreloadedTryOnImages(imgs);
      preloadToLocal(imgs.slice(0, PRELOAD_IMAGE_COUNT).map((i) => i.uri), batchedSetPreloaded);
    } catch (e) {
      console.error('[Videos] Load images error', e);
    }
  }, [currentUserId, setUserGeneratedImages, batchedSetPreloaded, clearPreloadedLocalUris]);

  useFocusEffect(
    useCallback(() => {
      if (savedVideos.length === 0) setLoading(true);
      loadVideosOnly();
      loadImagesForBox();
    }, [loadVideosOnly, loadImagesForBox])
  );

  useEffect(() => {
    if (savedVideos.length === 0) return;
    preloadToLocal(
      savedVideos.slice(0, PRELOAD_VIDEO_THUMB_COUNT).map((v) => v.sourceImageUrl).filter(Boolean),
      batchedSetPreloaded
    );
  }, [savedVideos, batchedSetPreloaded]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    clearPreloadedLocalUris();
    Promise.all([
      currentUserId ? getSavedVideos(currentUserId) : Promise.resolve([]),
      currentUserId ? getSavedTryOnImages(currentUserId) : Promise.resolve([]),
    ])
      .then(([vids, imgs]) => {
        setSavedVideos(vids);
        const list = imgs as SavedTryOnImage[];
        setUserGeneratedImages(list);
        setPreloadedTryOnImages(list);
        preloadToLocal(list.slice(0, PRELOAD_IMAGE_COUNT).map((i) => i.uri), batchedSetPreloaded);
        preloadToLocal(
          (vids as SavedVideo[]).slice(0, PRELOAD_VIDEO_THUMB_COUNT).map((v) => v.sourceImageUrl).filter(Boolean),
          batchedSetPreloaded
        );
      })
      .catch((e) => console.error('[Videos] Refresh error', e))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [currentUserId, batchedSetPreloaded, setUserGeneratedImages, clearPreloadedLocalUris]);

  const handleNewVideo = () => {
    useVideoStore.getState().resetGeneration();
    router.push('/video-generate/source' as any);
  };

  const handleOpenVideo = (vid: SavedVideo) => {
    useVideoStore.getState().setResultVideo(vid.uri);
    useVideoStore.getState().setSource(vid.sourceImageUrl);
    useVideoStore.getState().setPrompt(vid.prompt);
    router.push('/video-result' as any);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('video.delete_video_title'),
      t('video.delete_video_message'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: async () => {
          await deleteSavedVideo(id);
          loadVideosOnly();
        }},
      ]
    );
  };

  const videoCount = savedVideos.length;

  const handleImagePress = (img: SavedTryOnImage) => {
    useVideoStore.getState().resetGeneration();
    useVideoStore.getState().setSource(img.uri);
    router.push('/video-generate/source' as any);
  };

  const BTN_HEIGHT_APPROX = 38;
  const GAP_TO_KOLEKCIJA = SPACING.md + 8;

  const renderFrameAndButton = () => {
    const images = uniqueImages;
    const hasImages = images.length > 0;
    const boxW = W * 0.48;
    const boxH = boxW * 1.05;
    const lineStartTop = boxH * 0.45;
    const curveW = 88;
    const curveH = 72;
    const pathD = `M 0 0 Q ${curveW * 0.55} ${curveH * 0.35} ${curveW} ${curveH}`;
    const btnTop = lineStartTop + curveH;
    const btnLeft = boxW + curveW - 52;
    const frameRowMinH = boxH + curveH + 60;
    return (
      <Animated.View entering={FadeIn.duration(220)} style={styles.frameBlock}>
        <View style={[styles.frameRow, { minHeight: frameRowMinH }]}>
          <View style={[styles.imagesBox, { width: boxW, height: boxH }]}>
            {hasImages ? (
              <FlatList
                data={images.slice(0, 8)}
                keyExtractor={(item) => item.generationId}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesBoxScroll}
                initialNumToRender={8}
                windowSize={3}
                removeClippedSubviews={false}
                renderItem={({ item: img }) => (
                  <TouchableOpacity activeOpacity={0.9} onPress={() => handleImagePress(img)} style={styles.imagesBoxThumb}>
                    <Image source={{ uri: preloadedLocalUris[img.uri] ?? img.uri }} style={styles.imagesBoxThumbImg} resizeMode="cover" />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.imagesBoxPlaceholder}>
                <Ionicons name="images-outline" size={36} color={GOLD} />
                <Text style={styles.imagesBoxPlaceholderText}>{t('video.generated_images')}</Text>
                <Text style={styles.imagesBoxPlaceholderSub}>{t('video.will_appear_here')}</Text>
              </View>
            )}
          </View>
          <View style={[styles.curveLineWrap, { left: boxW - 2, top: lineStartTop, width: curveW, height: curveH }]} pointerEvents="none">
            <Svg width={curveW} height={curveH} style={StyleSheet.absoluteFill}>
              <Path d={pathD} stroke={LINE_COLOR} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <TouchableOpacity style={[styles.createVideoBtn, { position: 'absolute', left: btnLeft, top: btnTop }]} onPress={handleNewVideo} activeOpacity={0.88}>
            <Text style={styles.createVideoBtnText}>{t('video.create_video')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderHeader = () => {
    const boxW = W * 0.48;
    const boxH = boxW * 1.05;
    const curveW = 88;
    const curveH = 72;
    const frameRowMinH = boxH + curveH + 60;
    const btnTop = boxH * 0.45 + curveH;
    const btnLeft = boxW + curveW - 52;
    const btnCenterX = FRAME_MARGIN + btnLeft + 58;
    const lineWrapTop = SPACING.lg + btnTop + BTN_HEIGHT_APPROX + 14;
    const lineWrapHeight = frameRowMinH + GAP_TO_KOLEKCIJA - btnTop - BTN_HEIGHT_APPROX - 14;
    const connectPathD = `M ${btnCenterX} 0 L ${btnCenterX} ${lineWrapHeight}`;
    return (
      <View>
        <View style={styles.headerTopWrapper}>
          {renderFrameAndButton()}
          <View style={[styles.connectingLineWrap, { top: lineWrapTop, height: lineWrapHeight, width: W }]} pointerEvents="none">
            <Svg width={W} height={lineWrapHeight} style={StyleSheet.absoluteFill}>
              <Path d={connectPathD} stroke={LINE_COLOR_STRONG} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </View>
        {backgroundJob && (
          <GeneratingBanner
            attempt={bgPollAttempt}
            duration={backgroundJob.duration}
            onCancel={handleCancelGeneration}
          />
        )}
        <Animated.View entering={FadeInDown.delay(120).duration(280)} style={styles.gallerySectionHeader}>
          <View style={styles.gallerySectionLine} />
          <Text style={styles.gallerySectionTitle}>{t('video.collection')}</Text>
          <View style={styles.gallerySectionLine} />
        </Animated.View>
      </View>
    );
  };

  const renderGalleryItem = ({ item, index }: { item: SavedVideo; index: number }) => {
    const labelKey = item.prompt ? PROMPT_TO_LABEL_KEY[item.prompt] : null;
    const title = labelKey ? t(labelKey) : `${t('video.creation_title')} ${index + 1}`;
    const dateStr = new Date(item.createdAt).toLocaleDateString(getLanguage() === 'en' ? 'en-US' : 'sr-RS', { day: 'numeric', month: 'long' });
    return (
      <Animated.View entering={FadeInUp.delay(60 + index * 35).duration(280)} style={styles.galleryItem}>
        <TouchableOpacity activeOpacity={0.92} onPress={() => handleOpenVideo(item)} onLongPress={() => handleDelete(item.id)} style={styles.galleryTouch}>
          <View style={styles.frameOuter}>
            <View style={styles.frameInner}>
              <Image source={{ uri: preloadedLocalUris[item.sourceImageUrl] ?? item.sourceImageUrl }} style={styles.galleryImage} resizeMode="cover" />
              <View style={styles.galleryOverlay}>
                <View style={styles.galleryPlayCircle}>
                  <Ionicons name="play" size={20} color={COLORS.white} style={{ marginLeft: 2 }} />
                </View>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration}s</Text>
              </View>
            </View>
          </View>
          <View style={styles.galleryInfo}>
            <Text style={styles.galleryTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.galleryDate}>{dateStr}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyText}>{t('video.no_videos_yet')}</Text>
    </View>
  );

  const listEmpty = loading && savedVideos.length === 0
    ? (
        <View style={styles.emptyWrap}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      )
    : renderEmpty();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={savedVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderGalleryItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[styles.listContent, savedVideos.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={6}
        removeClippedSubviews={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={GOLD} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl + 16,
    paddingBottom: SPACING.xl,
    paddingHorizontal: FRAME_MARGIN,
  },
  emptyText: {
    fontFamily: FONTS.primary.light,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: { paddingBottom: 120 },
  listEmpty: { flexGrow: 1 },

  headerTopWrapper: { position: 'relative' },
  connectingLineWrap: { position: 'absolute', left: 0 },

  frameBlock: { paddingHorizontal: FRAME_MARGIN, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  frameRow: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start' },
  curveLineWrap: { position: 'absolute' },
  imagesBox: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: LINE_COLOR, backgroundColor: PASSEPARTOUT },
  imagesBoxScroll: { padding: 10, gap: 10, flexDirection: 'row', alignItems: 'center', flexGrow: 1 },
  imagesBoxThumb: { width: 72, height: 96, borderRadius: 10, overflow: 'hidden', backgroundColor: PASSEPARTOUT },
  imagesBoxThumbImg: { width: '100%', height: '100%' },
  imagesBoxPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  imagesBoxPlaceholderText: { fontFamily: FONTS.heading.semibold, fontSize: FONT_SIZES.sm, color: DARK, letterSpacing: 0.3, marginTop: SPACING.sm },
  imagesBoxPlaceholderSub: { fontFamily: FONTS.primary.regular, fontSize: FONT_SIZES.xs, color: COLORS.gray[500], marginTop: 2 },
  createVideoBtn: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    borderWidth: 0,
    backgroundColor: COLORS.primary,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  createVideoBtnText: { fontFamily: FONTS.heading.semibold, fontSize: FONT_SIZES.sm, color: '#FFFFFF', letterSpacing: 0.8 },

  gallerySectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: FRAME_MARGIN, marginTop: SPACING.sm, marginBottom: SPACING.md },
  gallerySectionLine: { flex: 1, height: 1, backgroundColor: LINE_COLOR },
  gallerySectionTitle: { fontFamily: FONTS.heading.semibold, fontSize: FONT_SIZES.sm, color: DARK, marginHorizontal: SPACING.md, letterSpacing: 0.5 },

  galleryItem: { marginHorizontal: FRAME_MARGIN, marginBottom: SPACING.lg },
  galleryTouch: {},
  frameOuter: { borderWidth: 1.5, borderColor: LINE_COLOR, borderRadius: 16, padding: 6, backgroundColor: PASSEPARTOUT },
  frameInner: { borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.gray[100] },
  galleryImage: { width: '100%', aspectRatio: 3 / 4 },
  galleryOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  galleryPlayCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  durationText: { fontFamily: FONTS.primary.semibold, fontSize: 12, color: '#FFF' },
  galleryInfo: { marginTop: SPACING.sm },
  galleryTitle: { fontFamily: FONTS.primary.semibold, fontSize: FONT_SIZES.sm, color: DARK },
  galleryDate: { fontFamily: FONTS.primary.regular, fontSize: FONT_SIZES.xs, color: COLORS.gray[500], marginTop: 2 },
});
