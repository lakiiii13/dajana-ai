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
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { getSavedTryOnImages, deleteTryOnImage, SavedTryOnImage, getSavedOutfits, deleteOutfitComposition, SavedOutfit } from '@/lib/tryOnService';
import { getSavedVideos, deleteSavedVideo, type SavedVideo } from '@/lib/videoService';
import { useVideoStore } from '@/stores/videoStore';
import { CreditDisplay } from '@/components/CreditDisplay';
import { getAllCredits, AllCredits } from '@/lib/creditService';
import { OutfitCompositionCard } from '@/components/OutfitCompositionCard';
import { AppLogo } from '@/components/AppLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_CREAM = '#F2EEE8'; // krem za content area
const HOME_CREAM = '#F8F4EF'; // same as Capsule & nav
const IMAGE_GRID_GAP = SPACING.sm;
const IMAGE_GRID_COLS = 2;
const IMAGE_ITEM_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.xl * 2 - IMAGE_GRID_GAP) / IMAGE_GRID_COLS;

type HomeSegment = 'outfit' | 'video' | 'slika';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const [activeSegment, setActiveSegment] = useState<HomeSegment>('outfit');

  // Generated images
  const [generatedImages, setGeneratedImages] = useState<SavedTryOnImage[]>([]);

  // Saved outfits (flat-lay compositions)
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);

  // Saved videos (AI-generated)
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);

  // Credits
  const [allCredits, setAllCredits] = useState<AllCredits | null>(null);

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

  // Load credits
  const loadCredits = useCallback(async () => {
    if (!profile) return;
    try {
      const credits = await getAllCredits(profile.id);
      setAllCredits(credits);
    } catch (err) {
      console.error('Error loading credits:', err);
    }
  }, [profile]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadImages();
      loadOutfits();
      loadVideos();
      loadCredits();
    }, [loadImages, loadOutfits, loadVideos, loadCredits])
  );

  const outfitCount = savedOutfits.length;
  const videoCount = savedVideos.length;
  const slikaCount = generatedImages.length;

  const segmentCounts: Record<HomeSegment, number> = {
    outfit: outfitCount,
    video: videoCount,
    slika: slikaCount,
  };

  const isEmpty = segmentCounts[activeSegment] === 0;

  const openCapsule = () => router.push('/(tabs)/capsule');
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

  // Open video in full-screen player
  const handleOpenVideo = useCallback((vid: SavedVideo) => {
    useVideoStore.getState().setResultVideo(vid.uri);
    useVideoStore.getState().setSource(vid.sourceImageUrl);
    useVideoStore.getState().setPrompt(vid.prompt);
    router.push('/video-result' as any);
  }, []);

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

  // Render image grid item
  const renderImageItem = useCallback(({ item }: { item: SavedTryOnImage }) => (
    <View style={[styles.imageGridItem, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
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
      {/* Delete button */}
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
    <ScrollView
      style={[styles.container, { backgroundColor: HOME_CREAM }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.sm, flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero: notifikacije levo, DAJANAI centar, kalendar + settings desno */}
      <View style={styles.heroWrap}>
        <View style={styles.heroIconsLeft}>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => router.push('/notifications')} activeOpacity={0.7} accessibilityLabel="Notifications">
            <Feather name="bell" size={22} color={colors.textSecondary} />
            <View style={[styles.notifBadge, { backgroundColor: colors.secondary }]} />
          </TouchableOpacity>
        </View>
        <View style={styles.heroCenter}>
          <AppLogo height={40} maxWidth={200} style={styles.heroLogoImage} />
          <Text style={[styles.heroTagline, { color: colors.textSecondary }]}>— {t('home.hero_tagline')} —</Text>
        </View>
        <View style={styles.heroIcons}>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => router.push('/calendar')} activeOpacity={0.7} accessibilityLabel="Calendar">
            <Feather name="calendar" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => router.push('/edit-profile')} activeOpacity={0.7} accessibilityLabel="Settings">
            <Feather name="settings" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tri segmenta: OUTFIT, VIDEO, SLIKA */}
      <View style={[styles.segmentBar, { backgroundColor: colors.gray[100] }]}>
        {(['outfit', 'video', 'slika'] as const).map((seg) => {
          const isActive = activeSegment === seg;
          const label = seg === 'outfit' ? 'OUTFIT' : seg === 'video' ? 'VIDEO' : 'SLIKA';
          const count = segmentCounts[seg];
          return (
            <TouchableOpacity
              key={seg}
              style={[
                styles.segmentTab,
                isActive && { backgroundColor: colors.gray[200] },
              ]}
              onPress={() => setActiveSegment(seg)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentLabel, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.segmentCount, { color: colors.textSecondary }]}>({count})</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Area */}
      {activeSegment === 'outfit' && savedOutfits.length > 0 ? (
        /* ===== OUTFIT GRID - Flat-lay outfit compositions ===== */
        <View style={[styles.contentArea, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
          <View style={styles.gridHeader}>
            <Text style={[styles.gridTitle, { color: colors.text }]}>Moji outfiti</Text>
            <View style={[styles.gridCountChip, { backgroundColor: `${COLORS.secondary}12` }]}>
              <Ionicons name="shirt-outline" size={12} color={COLORS.secondary} />
              <Text style={[styles.gridCountText, { color: COLORS.secondary }]}>{savedOutfits.length}</Text>
            </View>
          </View>

          <FlatList
            data={savedOutfits}
            renderItem={({ item }) => (
              <OutfitCompositionCard
                outfit={item}
                colors={colors}
                onDelete={() => handleDeleteOutfit(item)}
                onPress={item.tryOnImageUri ? () => {} : undefined}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={IMAGE_GRID_COLS}
            columnWrapperStyle={styles.imageGridRow}
            scrollEnabled={false}
            contentContainerStyle={styles.imageGridContainer}
          />
        </View>
      ) : activeSegment === 'video' && savedVideos.length > 0 ? (
        /* ===== VIDEO GRID - AI-generated videos ===== */
        <View style={[styles.contentArea, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
          <View style={styles.gridHeader}>
            <Text style={[styles.gridTitle, { color: colors.text }]}>Moji videi</Text>
            <View style={[styles.gridCountChip, { backgroundColor: `${COLORS.secondary}12` }]}>
              <Ionicons name="videocam-outline" size={12} color={COLORS.secondary} />
              <Text style={[styles.gridCountText, { color: COLORS.secondary }]}>{savedVideos.length}</Text>
            </View>
          </View>

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
            contentContainerStyle={styles.imageGridContainer}
          />
        </View>
      ) : activeSegment === 'slika' && slikaCount > 0 ? (
        /* ===== SLIKA GRID - Generated AI Try-On Images ===== */
        <View style={[styles.contentArea, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}>
          <View style={styles.gridHeader}>
            <Text style={[styles.gridTitle, { color: colors.text }]}>Generisane slike</Text>
            <View style={[styles.gridCountChip, { backgroundColor: `${COLORS.secondary}12` }]}>
              <Ionicons name="sparkles" size={12} color={COLORS.secondary} />
              <Text style={[styles.gridCountText, { color: COLORS.secondary }]}>{slikaCount}</Text>
            </View>
          </View>

          <FlatList
            data={generatedImages}
            renderItem={renderImageItem}
            keyExtractor={(item) => item.uri}
            numColumns={IMAGE_GRID_COLS}
            columnWrapperStyle={styles.imageGridRow}
            scrollEnabled={false}
            contentContainerStyle={styles.imageGridContainer}
          />
        </View>
      ) : (
        /* ===== EMPTY STATE ===== */
        <View
          style={[styles.contentArea, { backgroundColor: isEmpty ? CONTENT_CREAM : colors.surface, borderColor: colors.gray[200] }]}
          {...(isEmpty ? panResponder.panHandlers : {})}
        >
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Animated.Text
                entering={FadeIn.duration(520)}
                style={[styles.emptyInnerTitle, { color: colors.text }]}
              >
                Još nismo ništa kreirali
              </Animated.Text>
              <Animated.Text
                entering={FadeIn.delay(140).duration(520)}
                style={[styles.emptyInnerSub, { color: colors.textSecondary }]}
              >
                Kreiraj prvi outfit, video ili sliku — izaberi i kreni.
              </Animated.Text>
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Lista će se prikazati ovde.</Text>
          )}
          {/* CTA dugme */}
          {isEmpty && activeSegment === 'outfit' && (
            <TouchableOpacity style={[styles.cornerCta, { backgroundColor: colors.primary }]} onPress={openCapsule} activeOpacity={0.9}>
              <Text style={[styles.cornerCtaText, { color: colors.white }]}>{t('tabs.capsule')}</Text>
              <Feather name="chevron-right" size={14} color={colors.white} />
            </TouchableOpacity>
          )}
          {isEmpty && activeSegment === 'video' && (
            <TouchableOpacity style={[styles.cornerCta, { backgroundColor: colors.primary }]} onPress={() => router.push('/(tabs)/videos')} activeOpacity={0.9}>
              <Text style={[styles.cornerCtaText, { color: colors.white }]}>{t('tabs.videos')}</Text>
              <Feather name="chevron-right" size={14} color={colors.white} />
            </TouchableOpacity>
          )}
          {isEmpty && activeSegment === 'slika' && (
            <TouchableOpacity style={[styles.cornerCta, { backgroundColor: colors.primary }]} onPress={openCapsule} activeOpacity={0.9}>
              <Text style={[styles.cornerCtaText, { color: colors.white }]}>Isprobaj outfit</Text>
              <Feather name="chevron-right" size={14} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Credit Display — below main content */}
      <CreditDisplay credits={allCredits} />

      {!profile?.body_type && (
        <TouchableOpacity style={[styles.warningCard, { backgroundColor: `${colors.warning}10`, borderColor: `${colors.warning}40` }]} onPress={() => router.push('/edit-profile')} activeOpacity={0.9}>
          <Feather name="alert-triangle" size={24} color={colors.warning} />
          <View style={styles.warningContent}>
            <Text style={[styles.warningTitle, { color: colors.primary }]}>{t('home.complete_profile')}</Text>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>{t('home.complete_profile_desc')}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.gray[400]} />
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_CREAM,
  },
  content: {
    paddingBottom: 120,
    paddingHorizontal: SPACING.lg,
  },
  heroWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    minHeight: 72,
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
    left: 0,
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
  segmentBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
  },
  segmentLabel: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.3,
  },
  segmentCount: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  contentArea: {
    minHeight: 420,
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingBottom: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyInnerTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 18,
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptyInnerSub: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  cornerCta: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  cornerCtaText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 12,
    color: COLORS.white,
  },
  emptyText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
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
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbWrap: {
    position: 'relative',
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  videoPlayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  imageGridImage: {
    width: '100%',
    height: IMAGE_ITEM_WIDTH * 1.3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageGridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
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
});
