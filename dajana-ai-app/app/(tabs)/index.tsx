// ===========================================
// DAJANA AI - Home (INDYX-inspired)
// Hero + tri segmenta (OUTFIT, VIDEO, SLIKA) sa brojem + prazna površina
// SLIKA tab prikazuje generisane AI Try-On slike
// ===========================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  PanResponder,
  FlatList,
  Dimensions,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, ELEGANT_CTA } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { getSavedTryOnImages, deleteTryOnImage, SavedTryOnImage, getSavedOutfits, deleteOutfitComposition, SavedOutfit } from '@/lib/tryOnService';
import { getSavedVideos, deleteSavedVideo, type SavedVideo } from '@/lib/videoService';
import { useVideoStore } from '@/stores/videoStore';
import { OutfitCompositionCard } from '@/components/OutfitCompositionCard';
import { AppLogo } from '@/components/AppLogo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HOME_CREAM = '#F8F4EF'; // same as Capsule & nav
const IMAGE_GRID_COLS = 2;
const IMAGE_GRID_GAP = 10;
const IMAGE_ITEM_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - IMAGE_GRID_GAP) / IMAGE_GRID_COLS;
const IMAGE_ITEM_HEIGHT = IMAGE_ITEM_WIDTH * 1.42;

type HomeSegment = 'outfit' | 'video' | 'slika';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const isGuest = useAuthStore((s) => s.isGuest);
  const setGuestShowModal = useAuthStore((s) => s.setGuestShowModal);
  const [activeSegment, setActiveSegment] = useState<HomeSegment>('outfit');

  const guestOrNavigate = useCallback(
    (navigate: () => void) => {
      if (isGuest) {
        setGuestShowModal(true);
      } else {
        navigate();
      }
    },
    [isGuest, setGuestShowModal]
  );

  // Generated images
  const [generatedImages, setGeneratedImages] = useState<SavedTryOnImage[]>([]);

  // Saved outfits (flat-lay compositions)
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  // Saved videos (AI-generated)
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);

  // Detail modals (outfit / slika)
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);
  const [outfitCarouselIndex, setOutfitCarouselIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<SavedTryOnImage | null>(null);

  // Strelica swipe hint – blaga animacija u desno
  const swipeArrowX = useSharedValue(0);
  const swipeArrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeArrowX.value }],
  }));
  useEffect(() => {
    if (selectedOutfit && selectedOutfit.items.length > 1) {
      swipeArrowX.value = 0;
      swipeArrowX.value = withRepeat(
        withTiming(8, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [selectedOutfit]);

  // Credits

  // Load generated images when SLIKA tab is active or screen gains focus
  const loadImages = useCallback(async () => {
    try {
      const images = await getSavedTryOnImages();
      setGeneratedImages(images);
    } catch (err) {
      console.error('Error loading generated images:', err);
    }
  }, []);

  // Load saved outfits
  const loadOutfits = useCallback(async () => {
    try {
      const outfits = await getSavedOutfits();
      setSavedOutfits(outfits);
    } catch (err) {
      console.error('Error loading saved outfits:', err);
    }
  }, []);

  // Load saved videos
  const loadVideos = useCallback(async () => {
    try {
      const vids = await getSavedVideos();
      setSavedVideos(vids);
    } catch (err) {
      console.error('Error loading saved videos:', err);
    }
  }, []);

  const fetchCredits = useAuthStore((s) => s.fetchCredits);
  const allCredits = useAuthStore((s) => s.allCredits);

  // Kad god uđeš na Home, osveži podatke (uključujući kredite za badge)
  useFocusEffect(
    useCallback(() => {
      loadImages();
      loadOutfits();
      loadVideos();
      fetchCredits();
    }, [loadImages, loadOutfits, loadVideos, fetchCredits])
  );

  const creditsTotal =
    allCredits != null
      ? allCredits.image.remaining + allCredits.video.remaining + allCredits.analysis.remaining
      : null;

  const outfitCount = savedOutfits.length;
  const videoCount = savedVideos.length;
  const slikaCount = generatedImages.length;

  const segmentCounts: Record<HomeSegment, number> = {
    outfit: outfitCount,
    video: videoCount,
    slika: slikaCount,
  };

  const isEmpty = segmentCounts[activeSegment] === 0;

  const openCapsule = useCallback(() => {
    guestOrNavigate(() => router.push('/(tabs)/capsule'));
  }, [guestOrNavigate]);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (isEmpty && activeSegment === 'outfit' && (g.dx > 50 || g.dx < -50)) openCapsule();
      },
    })
  ).current;

  // Handle delete outfit composition
  const handleDeleteOutfit = useCallback((outfit: SavedOutfit) => {
    Alert.alert(
      'Obriši outfit',
      'Da li ste sigurni da želite da obrišete ovaj outfit?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            await deleteOutfitComposition(outfit.id);
            loadOutfits();
          },
        },
      ]
    );
  }, [loadOutfits]);

  // Handle delete image
  const handleDeleteImage = useCallback((image: SavedTryOnImage) => {
    Alert.alert(
      'Obriši sliku',
      'Da li ste sigurni da želite da obrišete ovu generisanu sliku?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            await deleteTryOnImage(image.uri);
            loadImages();
          },
        },
      ]
    );
  }, [loadImages]);

  // Open video in full-screen player (gost vidi modal "Napravite profil")
  const handleOpenVideo = useCallback((vid: SavedVideo) => {
    guestOrNavigate(() => {
      useVideoStore.getState().setResultVideo(vid.uri);
      useVideoStore.getState().setSource(vid.sourceImageUrl);
      useVideoStore.getState().setPrompt(vid.prompt);
      router.push('/video-result' as any);
    });
  }, [guestOrNavigate, router]);

  // Handle delete video
  const handleDeleteVideo = useCallback((vid: SavedVideo) => {
    Alert.alert(
      'Obriši video',
      'Da li ste sigurni da želite da obrišete ovaj video?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Obriši',
          style: 'destructive',
          onPress: async () => {
            await deleteSavedVideo(vid.id);
            loadVideos();
          },
        },
      ]
    );
  }, [loadVideos]);

  // Format date
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  };

  // Render image grid item (tap opens detail)
  const renderImageItem = useCallback(({ item }: { item: SavedTryOnImage }) => (
    <View style={[styles.imageGridItem, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(item)}>
        <Image source={{ uri: item.uri }} style={styles.imageGridImage} resizeMode="cover" />
        <View style={styles.imageGridFooter}>
          <View style={[styles.aiTag, { backgroundColor: `${COLORS.secondary}12`, borderColor: `${COLORS.secondary}30` }]}>
            <Ionicons name="sparkles" size={10} color={COLORS.secondary} />
            <Text style={[styles.aiTagText, { color: COLORS.secondary }]}>AI</Text>
          </View>
          <Text style={[styles.imageGridDate, { color: colors.textSecondary }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.imageDeleteBtn, { backgroundColor: colors.surface }]}
        onPress={() => handleDeleteImage(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={14} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  ), [colors, handleDeleteImage]);

  return (
    <>
    <View style={[styles.container, { backgroundColor: HOME_CREAM, paddingTop: insets.top + SPACING.sm }]}>
      {/* Header: kao INDYX — notifikacije levo, logo centar, kalendar + settings desno */}
      <View style={styles.heroWrap}>
        <View style={styles.heroIconsLeft}>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => guestOrNavigate(() => router.push('/notifications'))} activeOpacity={0.7} accessibilityLabel="Notifications">
            <Feather name="bell" size={22} color={colors.textSecondary} />
            <View style={[styles.notifBadge, { backgroundColor: colors.secondary }]} />
          </TouchableOpacity>
        </View>
        <View style={styles.heroCenter}>
          <AppLogo height={40} maxWidth={200} style={styles.heroLogoImage} />
          <Text style={[styles.heroTagline, { color: colors.textSecondary }]}>— {t('home.hero_tagline')} —</Text>
        </View>
        <View style={styles.heroIcons}>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => guestOrNavigate(() => router.push({ pathname: '/profile', params: { scrollToCredits: '1' } }))} activeOpacity={0.7} accessibilityLabel={t('profile.credits')}>
            <View>
              <Ionicons name="wallet-outline" size={22} color={colors.textSecondary} />
              {creditsTotal !== null && creditsTotal < 10 && (
                <View style={[styles.creditsBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={styles.creditsBadgeText}>{creditsTotal}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => guestOrNavigate(() => router.push('/calendar'))} activeOpacity={0.7} accessibilityLabel="Calendar">
            <Feather name="calendar" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => guestOrNavigate(() => router.push('/edit-profile'))} activeOpacity={0.7} accessibilityLabel="Settings">
            <Feather name="settings" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabovi kao INDYX: OUTFIT (n) | VIDEO (n) | SLIKA (n) — stoje gore, isti stil */}
      <View style={styles.indyxTabRow}>
        {(['outfit', 'video', 'slika'] as const).map((seg) => {
          const isActive = activeSegment === seg;
          const label = seg === 'outfit' ? 'OUTFIT' : seg === 'video' ? 'VIDEO' : 'SLIKA';
          const count = segmentCounts[seg];
          return (
            <TouchableOpacity
              key={seg}
              style={[styles.indyxTab, isActive && styles.indyxTabActive]}
              onPress={() => setActiveSegment(seg)}
              activeOpacity={0.85}
            >
              <Text style={[styles.indyxTabLabel, isActive && styles.indyxTabLabelActive]}>
                {label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Ispod tabova: jedan dugačak scroll za outfite / video / slike */}
      <ScrollView
        style={styles.contentScrollWrap}
        contentContainerStyle={styles.contentScrollInner}
        showsVerticalScrollIndicator={true}
        {...(isEmpty ? panResponder.panHandlers : {})}
      >
      {/* Linija + „Kolekcija” — malo vazduha između tabova i sadržaja */}
      <View style={styles.collectionLabelRow}>
        <View style={[styles.collectionLabelLine, { backgroundColor: colors.gray[300] }]} />
        <Text style={[styles.collectionLabelText, { color: colors.textSecondary }]}>{t('video.collection')}</Text>
        <View style={[styles.collectionLabelLine, { backgroundColor: colors.gray[300] }]} />
      </View>
      <View style={[styles.stageArea, { backgroundColor: HOME_CREAM }]}>
        {activeSegment === 'outfit' && savedOutfits.length > 0 && (
          <FlatList
            data={savedOutfits}
            renderItem={({ item }) => (
              <OutfitCompositionCard
                outfit={item}
                colors={colors}
                onDelete={() => handleDeleteOutfit(item)}
                onPress={() => { setOutfitCarouselIndex(0); setSelectedOutfit(item); }}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={IMAGE_GRID_COLS}
            columnWrapperStyle={styles.imageGridRow}
            scrollEnabled={false}
            contentContainerStyle={[styles.imageGridContainer, styles.gridListPadding]}
          />
        )}

        {activeSegment === 'video' && savedVideos.length > 0 && (
          <FlatList
            data={savedVideos}
            renderItem={({ item }) => (
              <View style={[styles.imageGridItem, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
                <TouchableOpacity onPress={() => handleOpenVideo(item)} activeOpacity={0.9}>
                  <View style={styles.videoThumbWrap}>
                    <Image source={{ uri: item.sourceImageUrl }} style={styles.imageGridImage} resizeMode="cover" />
                    <View style={styles.videoPlayOverlay}>
                      <View style={styles.videoPlayCircle}>
                        <Ionicons name="play" size={20} color={COLORS.white} style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.imageGridFooter}>
                    <View style={[styles.aiTag, { backgroundColor: `${COLORS.secondary}12`, borderColor: `${COLORS.secondary}30` }]}>
                      <Ionicons name="videocam" size={10} color={COLORS.secondary} />
                      <Text style={[styles.aiTagText, { color: COLORS.secondary }]}>{item.duration}s</Text>
                    </View>
                    <Text style={[styles.imageGridDate, { color: colors.textSecondary }]}>
                      {new Date(item.createdAt).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.imageDeleteBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleDeleteVideo(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={14} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            numColumns={IMAGE_GRID_COLS}
            columnWrapperStyle={styles.imageGridRow}
            scrollEnabled={false}
            contentContainerStyle={[styles.imageGridContainer, styles.gridListPadding]}
          />
        )}

        {activeSegment === 'slika' && slikaCount > 0 && (
          <FlatList
            data={generatedImages}
            renderItem={renderImageItem}
            keyExtractor={(item) => item.uri}
            numColumns={IMAGE_GRID_COLS}
            columnWrapperStyle={styles.imageGridRow}
            scrollEnabled={false}
            contentContainerStyle={[styles.imageGridContainer, styles.gridListPadding]}
          />
        )}

        {isEmpty && (
          <View style={styles.emptyStageMinimal}>
            <Animated.Text entering={FadeIn.duration(420)} style={[styles.emptyStageLabel, { color: colors.textSecondary }]}>
              Swipe i započni kreiranje
            </Animated.Text>
          </View>
        )}
        </View>

        {!profile?.body_type && (
          <TouchableOpacity style={[styles.warningCard, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}40` }]} onPress={() => guestOrNavigate(() => router.push('/edit-profile'))} activeOpacity={0.9}>
            <Feather name="alert-triangle" size={24} color={colors.warning} />
            <View style={styles.warningContent}>
              <Text style={[styles.warningTitle, { color: colors.primary }]}>{t('home.complete_profile')}</Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>{t('home.complete_profile_desc')}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>

      {/* Outfit detail modal – jedna slika fullscreen; više stavki = swipe desno za sledeću */}
      <Modal
        visible={!!selectedOutfit}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOutfit(null)}
      >
        <Pressable style={styles.outfitModalOverlay} onPress={() => setSelectedOutfit(null)}>
          <Pressable style={styles.outfitModalInner} onPress={(e) => e.stopPropagation()}>
            {selectedOutfit && (
              <>
                {selectedOutfit.items.length === 0 ? null : selectedOutfit.items.length === 1 ? (
                  <View style={styles.outfitCarouselFullscreen}>
                    <Image source={{ uri: selectedOutfit.items[0].imageUrl }} style={styles.outfitCarouselSlideImage} resizeMode="contain" />
                    <TouchableOpacity
                      style={[styles.outfitModalCloseBtn, { top: insets.top + SPACING.sm }]}
                      onPress={() => setSelectedOutfit(null)}
                      activeOpacity={0.85}
                    >
                      <Feather name="x" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.outfitCarouselFullscreen}>
                    <FlatList
                      style={styles.outfitCarouselList}
                      contentContainerStyle={styles.outfitCarouselListContent}
                      data={selectedOutfit.items}
                      keyExtractor={(item) => item.id}
                      horizontal
                      pagingEnabled
                      decelerationRate="fast"
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                        setOutfitCarouselIndex(Math.min(idx, selectedOutfit.items.length - 1));
                      }}
                      renderItem={({ item }) => (
                        <View style={styles.outfitCarouselSlide}>
                          <Image source={{ uri: item.imageUrl }} style={styles.outfitCarouselSlideImage} resizeMode="contain" pointerEvents="none" />
                          {item.title ? (
                            <View style={styles.outfitCarouselSlideTitleWrap} pointerEvents="none">
                              <Text style={styles.outfitCarouselSlideTitle} numberOfLines={1}>{item.title}</Text>
                            </View>
                          ) : null}
                        </View>
                      )}
                    />
                    <View style={[styles.outfitCarouselPager, { bottom: insets.bottom + SPACING.lg }]} pointerEvents="none">
                      <View style={styles.outfitCarouselPagerBadge}>
                        <Text style={styles.outfitCarouselPagerText}>{outfitCarouselIndex + 1} / {selectedOutfit.items.length}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.outfitModalCloseBtn, { top: insets.top + SPACING.sm }]}
                      onPress={() => setSelectedOutfit(null)}
                      activeOpacity={0.85}
                    >
                      <Feather name="x" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Animated.View style={[styles.outfitCarouselSwipeHint, swipeArrowStyle]} pointerEvents="none">
                      <Feather name="chevron-right" size={22} color={colors.textSecondary} />
                    </Animated.View>
                  </View>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Slika (try-on) detail modal – fullscreen, krem pozadina */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedImage(null)} />
          {selectedImage && (
            <>
              <Pressable style={styles.imageModalImageWrap} onPress={() => setSelectedImage(null)}>
                <Animated.View entering={FadeIn.duration(280)} style={StyleSheet.absoluteFill}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.imageModalImage} resizeMode="contain" />
                </Animated.View>
              </Pressable>
              <View style={[styles.imageModalFooter, { paddingBottom: insets.bottom + SPACING.md, backgroundColor: 'transparent' }]}>
                <View style={[styles.imageModalTag, { backgroundColor: 'rgba(255,252,249,0.95)', borderWidth: 1, borderColor: 'rgba(207,143,90,0.35)' }]}>
                  <Ionicons name="sparkles" size={14} color={COLORS.secondary} />
                  <Text style={[styles.imageModalDate, { color: colors.text }]}>{formatDate(selectedImage.timestamp)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.imageModalClose, { top: insets.top + SPACING.sm, backgroundColor: 'rgba(255,252,249,0.95)', borderColor: 'rgba(207,143,90,0.4)' }]}
                onPress={() => setSelectedImage(null)}
                activeOpacity={0.85}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_CREAM,
  },
  contentScrollWrap: {
    flex: 1,
  },
  contentScrollInner: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
    flexGrow: 1,
  },
  collectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
    gap: SPACING.md,
  },
  collectionLabelLine: {
    flex: 1,
    height: 1,
    opacity: 0.6,
  },
  collectionLabelText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  /* INDYX-style tabs: gore ispod headera, jedan red */
  indyxTabRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    gap: 0,
  },
  indyxTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.sm,
    backgroundColor: 'transparent',
  },
  indyxTabActive: {
    backgroundColor: '#EDE8E0',
  },
  indyxTabLabel: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
    letterSpacing: 0.4,
  },
  indyxTabLabelActive: {
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
  },
  heroWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    minHeight: 64,
  },
  heroCenter: {
    alignItems: 'center',
  },
  heroLogoImage: {},
  heroTagline: {
    fontFamily: FONTS.primary.light,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
    letterSpacing: 1,
  },
  heroIconsLeft: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
    flexDirection: 'row',
  },
  heroIcons: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  creditsBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  creditsBadgeText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 10,
    color: COLORS.white,
  },
  stageArea: {
    minHeight: 320,
    marginBottom: SPACING.md,
  },
  gridListPadding: {
    paddingBottom: SPACING.xl,
  },
  emptyStageMinimal: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStageLabel: {
    fontFamily: FONTS.primary.light,
    fontSize: FONT_SIZES.xs,
    letterSpacing: 1.1,
  },

  // ===== Image Grid =====
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  gridTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
  },
  gridCountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  gridCountText: {
    fontFamily: FONTS.primary.bold,
    fontSize: FONT_SIZES.xs,
  },
  imageGridContainer: {
    gap: IMAGE_GRID_GAP,
  },
  imageGridRow: {
    gap: IMAGE_GRID_GAP,
  },
  imageGridItem: {
    width: IMAGE_ITEM_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  videoThumbWrap: {
    position: 'relative',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  videoPlayCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  imageGridImage: {
    width: '100%',
    height: IMAGE_ITEM_HEIGHT,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  imageGridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    gap: 3,
    borderWidth: 1,
  },
  aiTagText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 10,
  },
  imageGridDate: {
    fontFamily: FONTS.primary.regular,
    fontSize: 10,
  },
  imageDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  // Warning card
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: `${COLORS.warning}10`,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: `${COLORS.warning}40`,
    gap: SPACING.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
  },
  warningText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
  },

  // ===== Outfit detail modal – fullscreen; jedna slika ili swipe karusel =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  outfitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  outfitModalInner: {
    flex: 1,
    width: '100%',
  },
  outfitCarouselFullscreen: {
    flex: 1,
    width: '100%',
    backgroundColor: HOME_CREAM,
  },
  outfitCarouselList: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  outfitCarouselListContent: {
    flexGrow: 1,
  },
  outfitCarouselSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitCarouselSlideImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  outfitCarouselSlideTitleWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(44,42,40,0.2)',
  },
  outfitCarouselSlideTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    textAlign: 'center',
  },
  outfitCarouselPager: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  outfitCarouselPagerBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(207,143,90,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.4)',
  },
  outfitCarouselPagerText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  outfitCarouselSwipeHint: {
    position: 'absolute',
    right: SPACING.xs,
    bottom: SCREEN_HEIGHT * 0.28,
  },
  outfitModalCloseBtn: {
    position: 'absolute',
    right: SPACING.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  modalContentWrap: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '88%',
  },
  outfitModalCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 12,
  },
  outfitModalImageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#F2EDE8',
    overflow: 'hidden',
  },
  outfitModalCompositionFull: {
    width: '100%',
    height: '100%',
  },
  outfitModalTwoCol: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  outfitModalCompositionHalf: {
    flex: 1,
    height: '100%',
  },
  outfitModalMultiCol: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  outfitModalMain: {
    flex: 2,
    height: '100%',
  },
  outfitModalSide: {
    flex: 1,
    gap: 2,
  },
  outfitModalSmall: {
    flex: 1,
    width: '100%',
  },
  outfitModalMore: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitModalMoreText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 14,
    color: COLORS.white,
  },
  outfitModalImage: {
    width: '100%',
    height: '100%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // ===== Slika (try-on) detail modal – fullscreen, krem =====
  imageModalOverlay: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: HOME_CREAM,
  },
  imageModalImageWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
  imageModalFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  imageModalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageModalDate: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
  },
  imageModalClose: {
    position: 'absolute',
    right: SPACING.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
