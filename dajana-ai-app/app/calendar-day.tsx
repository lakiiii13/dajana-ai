import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { OutfitCompositionCard } from '@/components/OutfitCompositionCard';
import { deleteOutfitComposition, getSavedOutfits, SavedOutfit } from '@/lib/tryOnService';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/lib/i18n';

const GOLD = '#CF8F5A';

function dateKeyFromTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDayLabel(key: string) {
  const [year, month, day] = key.split('-');
  return `${day}.${month}.${year}`;
}

function formatTimeLabel(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function CalendarDayScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ date?: string }>();
  const dateParam = typeof params.date === 'string' ? params.date : '';
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);
  const [outfitCarouselIndex, setOutfitCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList<any>>(null);

  const cardWidth = Math.min(width - SPACING.lg * 2, 460);
  const formattedDate = dateParam ? formatDayLabel(dateParam) : '';

  const currentUserId = useAuthStore((s) => s.user?.id ?? s.profile?.id ?? '');
  const loadOutfits = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await getSavedOutfits(currentUserId);
      setSavedOutfits(data);
    } catch (error) {
      console.error('Error loading outfits for day screen:', error);
    }
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, [loadOutfits])
  );

  const outfitsForDay = useMemo(
    () => savedOutfits.filter((outfit) => dateKeyFromTimestamp(outfit.timestamp) === dateParam),
    [dateParam, savedOutfits]
  );

  const handleDeleteOutfit = useCallback(
    (outfit: SavedOutfit) => {
      Alert.alert(t('calendar.delete_title'), t('calendar.delete_question'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteOutfitComposition(outfit.id, currentUserId);
            const data = await getSavedOutfits(currentUserId);
            setSavedOutfits(data);
            const remaining = data.filter((item) => dateKeyFromTimestamp(item.timestamp) === dateParam);
            if (remaining.length === 0) {
              router.back();
            }
          },
        },
      ]);
    },
    [dateParam, router, currentUserId]
  );

  const handleCarouselArrow = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedOutfit) return;
      const itemCount = (selectedOutfit.items ?? []).length;
      if (itemCount <= 1) return;

      const nextIndex =
        direction === 'next'
          ? Math.min(outfitCarouselIndex + 1, itemCount - 1)
          : Math.max(outfitCarouselIndex - 1, 0);

      carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setOutfitCarouselIndex(nextIndex);
    },
    [outfitCarouselIndex, selectedOutfit]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.gray[200] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Outfiti za {formattedDate}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {outfitsForDay.length} {outfitsForDay.length === 1 ? t('calendar.outfit_one') : t('calendar.outfit_many')}
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <FlatList
        data={outfitsForDay}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nema outfita za ovaj dan</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Napravi novi outfit iz Kapsule i pojaviće se ovde.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardBlock}>
            <View style={styles.cardMetaRow}>
              <View style={[styles.timeBadge, { backgroundColor: `${GOLD}16` }]}>
                <Text style={styles.timeBadgeText}>{formatTimeLabel(item.timestamp)}</Text>
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {(item.items ?? []).length} {(item.items ?? []).length === 1 ? 'komad' : 'komada'}
              </Text>
            </View>

            <OutfitCompositionCard
              outfit={item}
              colors={colors}
              cardWidth={cardWidth}
              onPress={() => {
                setOutfitCarouselIndex(0);
                setSelectedOutfit(item);
              }}
              onDelete={() => handleDeleteOutfit(item)}
            />
          </View>
        )}
      />

      <View style={[styles.footer, { borderTopColor: colors.gray[200] }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/capsule')}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{t('calendar.add_new')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!selectedOutfit} transparent animationType="fade" onRequestClose={() => setSelectedOutfit(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedOutfit(null)}>
          <Pressable style={[styles.modalInner, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            {selectedOutfit && (
              <>
                {(selectedOutfit.items ?? []).length <= 1 ? (
                  <View style={styles.carouselFull}>
                    <Image
                      source={{ uri: (selectedOutfit.items ?? [])[0]?.imageUrl }}
                      style={styles.carouselImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.carouselFull}>
                    <FlatList
                      ref={carouselRef}
                      data={selectedOutfit.items ?? []}
                      keyExtractor={(item) => item.id}
                      horizontal
                      pagingEnabled
                      scrollEnabled
                      decelerationRate="fast"
                      showsHorizontalScrollIndicator={false}
                      getItemLayout={(_, index) => ({
                        length: cardWidth,
                        offset: cardWidth * index,
                        index,
                      })}
                      onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
                        setOutfitCarouselIndex(Math.min(idx, (selectedOutfit.items ?? []).length - 1));
                      }}
                      renderItem={({ item }) => (
                        <View style={[styles.carouselSlide, { width: cardWidth }]}>
                          <Image source={{ uri: item.imageUrl }} style={styles.carouselImage} resizeMode="contain" />
                        </View>
                      )}
                    />
                    <TouchableOpacity
                      style={[styles.carouselArrow, styles.carouselArrowLeft, outfitCarouselIndex === 0 && styles.carouselArrowDisabled]}
                      onPress={() => handleCarouselArrow('prev')}
                      activeOpacity={0.85}
                      disabled={outfitCarouselIndex === 0}
                    >
                      <Feather name="chevron-left" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.carouselArrow,
                        styles.carouselArrowRight,
                        outfitCarouselIndex >= (selectedOutfit.items ?? []).length - 1 && styles.carouselArrowDisabled,
                      ]}
                      onPress={() => handleCarouselArrow('next')}
                      activeOpacity={0.85}
                      disabled={outfitCarouselIndex >= (selectedOutfit.items ?? []).length - 1}
                    >
                      <Feather name="chevron-right" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.carouselPager}>
                      <Text style={styles.carouselPagerText}>
                        {outfitCarouselIndex + 1} / {(selectedOutfit.items ?? []).length}
                      </Text>
                    </View>
                    <Text style={styles.carouselHint}>Prevuci levo/desno ili koristi strelice</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 4,
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  cardBlock: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  cardMetaRow: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timeBadgeText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.xs,
    color: GOLD,
  },
  metaText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
  },
  emptyWrap: {
    paddingTop: SPACING.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    maxWidth: 260,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalInner: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 24,
    overflow: 'hidden',
  },
  carouselFull: {
    width: '100%',
    aspectRatio: 0.72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F4EF',
  },
  carouselSlide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselPager: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  carouselPagerText: {
    color: '#FFFFFF',
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.xs,
  },
  carouselArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselArrowLeft: {
    left: 12,
  },
  carouselArrowRight: {
    right: 12,
  },
  carouselArrowDisabled: {
    opacity: 0.35,
  },
  carouselHint: {
    position: 'absolute',
    left: 16,
    bottom: 14,
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.xs,
    color: 'rgba(255,255,255,0.92)',
  },
  modalClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
