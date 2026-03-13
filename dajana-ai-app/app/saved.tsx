// ===========================================
// DAJANA AI - Sačuvano (saved outfits, images, videos)
// Pristup iz Profila → Sačuvano
// ===========================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getSavedOutfits,
  getSavedTryOnImages,
  deleteTryOnImage,
  deleteOutfitComposition,
  type SavedOutfit,
  type SavedTryOnImage,
} from '@/lib/tryOnService';
import { getSavedVideos, deleteSavedVideo, type SavedVideo } from '@/lib/videoService';
import { useVideoStore } from '@/stores/videoStore';
import { OutfitCompositionCard } from '@/components/OutfitCompositionCard';

const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const IMAGE_GRID_COLS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - GRID_GAP) / IMAGE_GRID_COLS;
const CARD_HEIGHT = CARD_WIDTH * 1.68;
/** Širina jedne outfit kartice u Sačuvano – jedna celá stane u prikaz (bez polovine) */
const SAVED_OUTFIT_CARD_WIDTH = Math.min(CARD_WIDTH, (SCREEN_WIDTH - SPACING.lg * 4) - 24);

export default function SavedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [images, setImages] = useState<SavedTryOnImage[]>([]);
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);
  const [selectedImage, setSelectedImage] = useState<SavedTryOnImage | null>(null);
  const [outfitCarouselIndex, setOutfitCarouselIndex] = useState(0);

  const loadAll = useCallback(async () => {
    try {
      const [o, i, v] = await Promise.all([
        getSavedOutfits(),
        getSavedTryOnImages(),
        getSavedVideos(),
      ]);
      setOutfits(o);
      setImages(i);
      setVideos(v);
      useVideoStore.getState().setSavedVideos(v);
    } catch (e) {
      console.error('[Saved] Load error', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const outfitsFromKapsula = outfits.filter((o) => (o.items ?? []).length > 1);
  const outfitsFromOrmar = outfits.filter((o) => (o.items ?? []).length === 1 && o.tryOnImageUri);
  const outfitCount = outfitsFromKapsula.length + outfitsFromOrmar.length;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  };

  const handleDeleteOutfit = useCallback(
    (outfit: SavedOutfit) => {
      Alert.alert(
        t('home.delete_outfit_title'),
        t('home.delete_outfit_message'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteOutfitComposition(outfit.id);
              loadAll();
            },
          },
        ]
      );
    },
    [loadAll]
  );

  const handleDeleteImage = useCallback(
    (image: SavedTryOnImage) => {
      Alert.alert(
        t('home.delete_image_title'),
        t('home.delete_image_message'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteTryOnImage(image.uri);
              loadAll();
            },
          },
        ]
      );
    },
    [loadAll]
  );

  const handleDeleteVideo = useCallback(
    (vid: SavedVideo) => {
      Alert.alert(
        t('home.delete_video_title'),
        t('home.delete_video_message'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('delete'),
            style: 'destructive',
            onPress: async () => {
              await deleteSavedVideo(vid.id);
              loadAll();
            },
          },
        ]
      );
    },
    [loadAll]
  );

  const handleOpenVideo = useCallback((vid: SavedVideo) => {
    useVideoStore.getState().setResultVideo(vid.uri);
    useVideoStore.getState().setSource(vid.sourceImageUrl);
    useVideoStore.getState().setPrompt(vid.prompt);
    router.push('/video-result' as any);
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.gray[200] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.saved_screen_title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Outfiti — kartica */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
          <View style={styles.sectionCardHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: `${GOLD}18` }]}>
              <Ionicons name="shirt-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.sectionCardTitleWrap}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>{t('home.segment_outfit')}</Text>
              <Text style={[styles.sectionCardCount, { color: colors.textSecondary }]}>{outfitCount} {outfitCount === 1 ? 'outfit' : 'outfita'}</Text>
            </View>
          </View>
          {outfitCount === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema sačuvanih outfita</Text>
            </View>
          ) : (
            <>
              {outfitsFromKapsula.length > 0 && (
                <FlatList
                  data={outfitsFromKapsula}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hListContent}
                  renderItem={({ item }) => (
                    <View style={styles.outfitCardWrap}>
                      <OutfitCompositionCard
                        outfit={item}
                        colors={colors}
                        cardWidth={SAVED_OUTFIT_CARD_WIDTH}
                        onPress={() => setSelectedOutfit(item)}
                        onDelete={() => handleDeleteOutfit(item)}
                      />
                    </View>
                  )}
                />
              )}
              {outfitsFromOrmar.length > 0 && (
                <FlatList
                  data={outfitsFromOrmar}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.hListContent, outfitsFromKapsula.length > 0 && { marginTop: SPACING.md }]}
                  renderItem={({ item }) => {
                    const chosenUrl = item.items[0]?.imageUrl;
                    const displayUri = typeof chosenUrl === 'string' ? chosenUrl : null;
                    return (
                      <TouchableOpacity
                        style={[styles.imageGridItem, { backgroundColor: colors.background, borderColor: colors.gray[200] }]}
                        onPress={() => displayUri && setSelectedImage({ uri: displayUri, timestamp: item.timestamp, filename: '', outfitId: item.id })}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={typeof chosenUrl === 'number' ? chosenUrl : { uri: String(chosenUrl) }}
                          style={styles.thumbImage}
                          resizeMode="cover"
                        />
                        <View style={styles.thumbFooter}>
                          <Text style={[styles.thumbDate, { color: colors.textSecondary }]}>{formatDate(item.timestamp)}</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.deleteBtn, { backgroundColor: colors.surface }]}
                          onPress={() => handleDeleteOutfit(item)}
                        >
                          <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </>
          )}
        </View>

        {/* Slike (try-on) — kartica */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
          <View style={styles.sectionCardHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: `${GOLD}18` }]}>
              <Ionicons name="images-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.sectionCardTitleWrap}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>{t('home.segment_image')}</Text>
              <Text style={[styles.sectionCardCount, { color: colors.textSecondary }]}>{images.length} {images.length === 1 ? 'slika' : 'slika'}</Text>
            </View>
          </View>
          {images.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema sačuvanih slika</Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {images.map((img) => (
                <View key={img.uri} style={[styles.imageGridItem, { backgroundColor: colors.background, borderColor: colors.gray[200] }]}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(img)}>
                    <Image source={{ uri: img.uri }} style={styles.thumbImage} resizeMode="cover" />
                    <View style={styles.thumbFooter}>
                      <Text style={[styles.thumbDate, { color: colors.textSecondary }]}>{formatDate(img.timestamp)}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.surface }]} onPress={() => handleDeleteImage(img)}>
                    <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Videi — kartica */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
          <View style={styles.sectionCardHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: `${GOLD}18` }]}>
              <Ionicons name="videocam-outline" size={22} color={GOLD} />
            </View>
            <View style={styles.sectionCardTitleWrap}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>{t('home.segment_video')}</Text>
              <Text style={[styles.sectionCardCount, { color: colors.textSecondary }]}>{videos.length} {videos.length === 1 ? 'video' : 'videa'}</Text>
            </View>
          </View>
          {videos.length === 0 ? (
            <View style={styles.emptyBlock}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nema sačuvanih videa</Text>
            </View>
          ) : (
            <View style={styles.videoList}>
              {videos.map((vid) => {
                const title = vid.prompt && vid.prompt.length > 28 ? vid.prompt.substring(0, 28) + '...' : vid.prompt || 'Video';
                const dateStr = new Date(vid.createdAt).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' });
                return (
                  <TouchableOpacity
                    key={vid.id}
                    style={[styles.videoItem, { backgroundColor: colors.background, borderColor: colors.gray[200] }]}
                    onPress={() => handleOpenVideo(vid)}
                    onLongPress={() => handleDeleteVideo(vid)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.videoThumbWrap}>
                      <Image source={{ uri: vid.sourceImageUrl }} style={styles.videoThumb} resizeMode="cover" />
                      <View style={styles.videoPlayOverlay}>
                        <Ionicons name="play" size={22} color="#FFF" />
                      </View>
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{vid.duration}s</Text>
                      </View>
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
                      <Text style={[styles.videoDate, { color: colors.textSecondary }]}>{dateStr}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Outfit detail modal */}
      <Modal visible={!!selectedOutfit} transparent animationType="fade" onRequestClose={() => setSelectedOutfit(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedOutfit(null)}>
          <Pressable style={styles.modalInner} onPress={(e) => e.stopPropagation()}>
            {selectedOutfit && (
              <>
                {(selectedOutfit.items ?? []).length === 1 ? (
                  <View style={styles.carouselFull}>
                    <Image source={{ uri: (selectedOutfit.items ?? [])[0]?.imageUrl }} style={styles.carouselImage} resizeMode="contain" />
                  </View>
                ) : (
                  <View style={styles.carouselFull}>
                    <FlatList
                      data={selectedOutfit.items ?? []}
                      keyExtractor={(item) => item.id}
                      horizontal
                      pagingEnabled
                      decelerationRate="fast"
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        setOutfitCarouselIndex(Math.min(idx, (selectedOutfit.items ?? []).length - 1));
                      }}
                      renderItem={({ item }) => (
                        <View style={styles.carouselSlide}>
                          <Image source={{ uri: item.imageUrl }} style={styles.carouselImage} resizeMode="contain" />
                        </View>
                      )}
                    />
                    <View style={styles.carouselPager}>
                      <Text style={styles.carouselPagerText}>
                        {outfitCarouselIndex + 1} / {(selectedOutfit.items ?? []).length}
                      </Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedOutfit(null)} activeOpacity={0.85}>
                  <Feather name="x" size={24} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Image detail modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedImage(null)} />
          {selectedImage && (
            <>
              <View style={styles.imageModalWrap}>
                <Animated.View entering={FadeIn.duration(200)}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.imageModalImage} resizeMode="contain" />
                </Animated.View>
              </View>
              <Text style={[styles.imageModalDate, { color: colors.text }]}>{formatDate(selectedImage.timestamp)}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedImage(null)} activeOpacity={0.85}>
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: SPACING.lg, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207,143,90,0.15)',
  },
  sectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  sectionCardTitleWrap: { flex: 1 },
  sectionCardTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.md,
    letterSpacing: 0.4,
  },
  sectionCardCount: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  emptyBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
  },
  hListContent: { paddingLeft: SPACING.sm, paddingRight: SPACING.lg, gap: SPACING.md },
  outfitCardWrap: { marginRight: SPACING.md },
  imageGridItem: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbImage: { width: '100%', height: CARD_HEIGHT },
  thumbFooter: { padding: SPACING.sm },
  thumbDate: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.primary.regular },
  deleteBtn: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    padding: 6,
    borderRadius: 8,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  videoList: { gap: SPACING.md },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 14,
    borderWidth: 1,
  },
  videoThumbWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', backgroundColor: COLORS.gray[100] },
  videoThumb: { width: '100%', height: '100%' },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: { fontFamily: FONTS.primary.semibold, fontSize: 10, color: '#FFF' },
  videoInfo: { flex: 1, marginLeft: SPACING.md },
  videoTitle: { fontFamily: FONTS.primary.semibold, fontSize: FONT_SIZES.sm },
  videoDate: { fontFamily: FONTS.primary.regular, fontSize: FONT_SIZES.xs, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInner: { width: '100%', height: '100%', justifyContent: 'center' },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: SPACING.lg,
    padding: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  carouselFull: { width: SCREEN_WIDTH, height: '80%' },
  carouselSlide: { width: SCREEN_WIDTH, flex: 1 },
  carouselImage: { width: '100%', height: '100%' },
  carouselPager: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  carouselPagerText: { fontFamily: FONTS.primary.semibold, fontSize: 13, color: '#FFF' },
  imageModalWrap: { flex: 1, width: SCREEN_WIDTH, justifyContent: 'center' },
  imageModalImage: { width: '100%', height: 400 },
  imageModalDate: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
  },
});
