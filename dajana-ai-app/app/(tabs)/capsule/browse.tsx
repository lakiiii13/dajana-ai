// ===========================================
// DAJANA AI - Kapsula (klasičan page: Pregledaj / Sačuvano, kategorije, outfiti)
// ===========================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { CATEGORIES, CategoryId, getCategoryTag } from '@/constants/categories';
import {
  fetchOutfits,
  fetchSavedOutfits,
  toggleSaveOutfit,
  OutfitFilters,
  OutfitWithSaved,
  ApiError,
} from '@/lib/api';
import OutfitCard from '@/components/OutfitCard';
import { Database, BodyType, Season } from '@/types/database';
import { useTryOnStore } from '@/stores/tryOnStore';

type Outfit = Database['public']['Tables']['outfits']['Row'];
type TabType = 'browse' | 'saved';

const { width } = Dimensions.get('window');
const CAPSULE_CREAM = '#F8F4EF';
const CAPSULE_GOLD = '#CF8F5A';
const CAPSULE_TEXT = '#2C2A28';
const GAP = 14;

const BODY_TYPES: BodyType[] = ['pear', 'apple', 'hourglass', 'rectangle', 'inverted_triangle'];
const SEASONS: Season[] = [
  'light_spring', 'warm_spring', 'clear_spring', 'light_summer', 'cool_summer', 'soft_summer',
  'soft_autumn', 'warm_autumn', 'deep_autumn', 'deep_winter', 'cool_winter', 'clear_winter',
];

export default function CapsuleScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, profile } = useAuthStore();
  const params = useLocalSearchParams<{ body_type?: string; season?: string }>();
  const outfitItems = useTryOnStore((s) => s.outfitItems);
  const clearOutfitItems = useTryOnStore((s) => s.clearOutfitItems);

  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [useMyBodyType, setUseMyBodyType] = useState(true);
  const [useMySeason, setUseMySeason] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [outfits, setOutfits] = useState<OutfitWithSaved[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paramBodyType = typeof params.body_type === 'string' && BODY_TYPES.includes(params.body_type as BodyType)
    ? (params.body_type as BodyType)
    : undefined;
  const paramSeason = typeof params.season === 'string' && SEASONS.includes(params.season as Season)
    ? (params.season as Season)
    : undefined;

  const filters = useMemo<OutfitFilters>(() => {
    const f: OutfitFilters = {};
    const categoryTag = getCategoryTag(activeCategory);
    if (categoryTag) f.tags = [categoryTag];
    if (paramBodyType) f.bodyType = paramBodyType;
    else if (useMyBodyType && profile?.body_type) f.bodyType = profile.body_type;
    if (paramSeason) f.season = paramSeason;
    else if (useMySeason && profile?.season) f.season = profile.season;
    return f;
  }, [activeCategory, useMyBodyType, useMySeason, profile?.body_type, profile?.season, paramBodyType, paramSeason]);

  const loadOutfits = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOutfits(filters, user?.id);
      setOutfits(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(t('capsule.error_load'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, user?.id]);

  const loadSavedOutfits = useCallback(async (showRefreshing = false) => {
    if (!user?.id) return;
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSavedOutfits(user.id);
      setSavedOutfits(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(t('capsule.error_load'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'browse') loadOutfits();
    else loadSavedOutfits();
  }, [activeTab, loadOutfits, loadSavedOutfits]);

  const handleRefresh = () => {
    if (activeTab === 'browse') loadOutfits(true);
    else loadSavedOutfits(true);
  };

  const handleToggleSave = async (outfit: OutfitWithSaved) => {
    if (!user?.id) return;
    try {
      const newSavedState = await toggleSaveOutfit(user.id, outfit.id, !!outfit.is_saved);
      setOutfits((prev) => prev.map((o) => (o.id === outfit.id ? { ...o, is_saved: newSavedState } : o)));
      if (newSavedState) setSavedOutfits((prev) => [...prev, outfit]);
      else setSavedOutfits((prev) => prev.filter((o) => o.id !== outfit.id));
    } catch (err) {
      if (err instanceof ApiError) Alert.alert(t('error'), err.message);
    }
  };

  const handleOutfitPress = (outfitId: string) => router.push(`/outfit/${outfitId}`);
  const handleClearFilters = () => {
    setActiveCategory('all');
    setUseMyBodyType(false);
    setUseMySeason(false);
  };
  const hasActiveFilters = activeCategory !== 'all' || useMyBodyType || useMySeason;
  const displayOutfits = activeTab === 'browse' ? outfits : savedOutfits.map((o) => ({ ...o, is_saved: true }));

  const pillPosition = useSharedValue(activeTab === 'saved' ? 1 : 0);
  useEffect(() => {
    pillPosition.value = withTiming(activeTab === 'saved' ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [activeTab]);
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillPosition.value * ((width - SPACING.md * 2 - 8) / 2) }],
  }));

  const barOpacity = useSharedValue(0);
  useEffect(() => {
    barOpacity.value = withTiming(outfitItems.length > 0 ? 1 : 0, { duration: 220 });
  }, [outfitItems.length]);
  const barAnimatedStyle = useAnimatedStyle(() => ({ opacity: barOpacity.value }));

  const currentCategoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.labelKey
    ? t(CATEGORIES.find((c) => c.id === activeCategory)!.labelKey)
    : t('capsule.categories.all');

  const renderOutfitCard = ({ item, index }: { item: OutfitWithSaved; index: number }) => (
    <OutfitCard
      outfit={item}
      onPress={() => handleOutfitPress(item.id)}
      onToggleSave={() => handleToggleSave(item)}
      isLoggedIn={!!user}
      index={index}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name={activeTab === 'saved' ? 'heart-outline' : 'shirt-outline'} size={64} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'saved' ? t('capsule.empty.no_saved') : t('capsule.empty.title')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'saved' ? t('capsule.empty.no_saved_subtitle') : t('capsule.empty.subtitle')}
      </Text>
      {activeTab === 'browse' && hasActiveFilters && (
        <TouchableOpacity style={styles.clearFiltersButton} onPress={handleClearFilters}>
          <Text style={styles.clearFiltersText}>{t('capsule.empty.clear_filters')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
      <Text style={styles.emptyTitle}>{t('error')}</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => handleRefresh()}>
        <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
        <Text style={styles.retryButtonText}>{t('errors.try_again')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={CAPSULE_GOLD} />
      <Text style={styles.loadingText}>{t('capsule.loading')}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: CAPSULE_CREAM }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.xs }]}>
        <Text style={styles.headerTitle}>Kapsula</Text>
        <Text style={styles.headerTagline}>Tvoja garderoba</Text>
        <View style={styles.headerLine} />
      </View>

      <View style={styles.pillTabsWrap}>
        <View style={styles.pillTabsInner}>
          <Animated.View style={[styles.pillSlider, pillStyle]} />
          <TouchableOpacity style={styles.pillTab} onPress={() => setActiveTab('browse')} activeOpacity={0.8}>
            <Text style={[styles.pillTabText, activeTab === 'browse' && styles.pillTabTextActive]}>
              {t('capsule.tabs.browse')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pillTab} onPress={() => setActiveTab('saved')} activeOpacity={0.8}>
            <Ionicons
              name="heart"
              size={16}
              color={activeTab === 'saved' ? COLORS.white : CAPSULE_TEXT}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.pillTabText, activeTab === 'saved' && styles.pillTabTextActive]}>
              {t('capsule.tabs.saved')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'browse' && (
        <>
          <View style={styles.dropdownWrap}>
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowCategoryModal(true)} activeOpacity={0.7}>
              <Text style={styles.dropdownLabel}>Kategorija: {currentCategoryLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={CAPSULE_TEXT} />
            </TouchableOpacity>
          </View>
          {(profile?.body_type || profile?.season) && (
            <View style={styles.quickFilters}>
              {profile?.body_type && (
                <TouchableOpacity
                  style={[styles.quickFilterChip, useMyBodyType && styles.quickFilterChipActive]}
                  onPress={() => setUseMyBodyType(!useMyBodyType)}
                >
                  <Ionicons
                    name={useMyBodyType ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={useMyBodyType ? CAPSULE_GOLD : COLORS.gray[500]}
                  />
                  <Text style={[styles.quickFilterText, useMyBodyType && styles.quickFilterTextActive]}>
                    {t('capsule.filters.my_body_type')}
                  </Text>
                </TouchableOpacity>
              )}
              {profile?.season && (
                <TouchableOpacity
                  style={[styles.quickFilterChip, useMySeason && styles.quickFilterChipActive]}
                  onPress={() => setUseMySeason(!useMySeason)}
                >
                  <Ionicons
                    name={useMySeason ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={useMySeason ? CAPSULE_GOLD : COLORS.gray[500]}
                  />
                  <Text style={[styles.quickFilterText, useMySeason && styles.quickFilterTextActive]}>
                    {t('capsule.filters.my_season')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}

      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategorija</Text>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.modalRow, activeCategory === item.id && styles.modalRowActive]}
                onPress={() => {
                  setActiveCategory(item.id);
                  setShowCategoryModal(false);
                }}
              >
                <Ionicons name={item.icon as any} size={20} color={activeCategory === item.id ? CAPSULE_GOLD : CAPSULE_TEXT} />
                <Text style={[styles.modalRowText, activeCategory === item.id && styles.modalRowTextActive]}>
                  {t(item.labelKey)}
                </Text>
                {activeCategory === item.id && <Ionicons name="checkmark" size={20} color={CAPSULE_GOLD} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {isLoading ? (
        renderLoadingState()
      ) : error ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={CAPSULE_GOLD} />
          }
        >
          {renderErrorState()}
        </ScrollView>
      ) : (
        <FlatList
          data={displayOutfits}
          renderItem={renderOutfitCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={CAPSULE_GOLD} />
          }
        />
      )}

      {outfitItems.length > 0 && (
        <Animated.View style={[styles.outfitBuilderWrap, barAnimatedStyle]}>
          <View style={styles.outfitBuilderCard}>
            <View style={styles.obThumbnails}>
              {outfitItems.slice(0, 3).map((item, idx) => (
                <Image
                  key={item.id}
                  source={{ uri: item.imageUrl }}
                  style={[styles.obThumb, idx > 0 && { marginLeft: -10 }]}
                />
              ))}
              {outfitItems.length > 3 && (
                <View style={[styles.obThumb, styles.obThumbMore, { marginLeft: -10 }]}>
                  <Text style={styles.obThumbMoreText}>+{outfitItems.length - 3}</Text>
                </View>
              )}
            </View>
            <View style={styles.obInfo}>
              <Text style={styles.obTitle}>
                {outfitItems.length}{' '}
                {outfitItems.length === 1 ? 'komad' : outfitItems.length < 5 ? 'komada' : 'komada'}
              </Text>
              <Text style={styles.obSubtitle}>Izabrano za isprobavanje</Text>
            </View>
            <TouchableOpacity style={styles.obClearBtn} onPress={clearOutfitItems}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.obArrowBtn} onPress={() => router.push('/outfit-preview' as any)} activeOpacity={0.85}>
              <Ionicons name="arrow-forward" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CAPSULE_CREAM },
  header: {
    backgroundColor: CAPSULE_CREAM,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207, 143, 90, 0.2)',
  },
  headerTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 26,
    letterSpacing: 3,
    color: CAPSULE_TEXT,
    textAlign: 'center',
  },
  headerTagline: {
    fontFamily: FONTS.primary.light,
    fontSize: FONT_SIZES.sm,
    color: CAPSULE_GOLD,
    marginTop: 2,
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerLine: {
    height: 1.5,
    backgroundColor: CAPSULE_GOLD,
    marginTop: SPACING.xs,
    width: 36,
    borderRadius: 1,
    alignSelf: 'center',
  },
  pillTabsWrap: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  pillTabsInner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    position: 'relative',
  },
  pillSlider: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    width: (width - SPACING.md * 2 - 8) / 2,
    backgroundColor: CAPSULE_GOLD,
    borderRadius: BORDER_RADIUS.full,
  },
  pillTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, zIndex: 1 },
  pillTabText: { fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.md, color: CAPSULE_TEXT },
  pillTabTextActive: { color: COLORS.white },
  dropdownWrap: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFCF9',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dropdownLabel: { fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.md, color: CAPSULE_TEXT },
  quickFilters: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, flexWrap: 'wrap', gap: 8 },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: '#FFFCF9',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  quickFilterChipActive: { backgroundColor: CAPSULE_GOLD + '18', borderColor: CAPSULE_GOLD },
  quickFilterText: { fontFamily: FONTS.primary.regular, fontSize: FONT_SIZES.sm, color: COLORS.gray[600], marginLeft: 4 },
  quickFilterTextActive: { color: CAPSULE_GOLD },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: '#FFFCF9', borderRadius: 20, padding: SPACING.md, maxHeight: '70%' },
  modalTitle: { fontFamily: FONTS.heading.semibold, fontSize: FONT_SIZES.lg, color: CAPSULE_TEXT, marginBottom: SPACING.sm, paddingHorizontal: 4 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, gap: 12 },
  modalRowActive: { backgroundColor: CAPSULE_GOLD + '14' },
  modalRowText: { flex: 1, fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.md, color: CAPSULE_TEXT },
  modalRowTextActive: { color: CAPSULE_GOLD },
  gridContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 120 },
  row: { justifyContent: 'space-between', gap: GAP, marginBottom: 0 },
  scrollContent: { flexGrow: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: FONTS.primary.regular, fontSize: FONT_SIZES.md, color: COLORS.gray[500], marginTop: SPACING.sm },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, minHeight: 300 },
  emptyTitle: { fontFamily: FONTS.primary.semibold, fontSize: FONT_SIZES.lg, color: CAPSULE_TEXT, marginTop: SPACING.md },
  emptySubtitle: { fontFamily: FONTS.primary.regular, fontSize: FONT_SIZES.md, color: COLORS.gray[500], marginTop: SPACING.xs, textAlign: 'center' },
  clearFiltersButton: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: CAPSULE_GOLD + '20', borderRadius: BORDER_RADIUS.md },
  clearFiltersText: { fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.sm, color: CAPSULE_GOLD },
  retryButton: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: CAPSULE_GOLD, borderRadius: BORDER_RADIUS.md },
  retryButtonText: { fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.sm, color: COLORS.white, marginLeft: SPACING.xs },
  outfitBuilderWrap: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  outfitBuilderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFCF9',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.2)',
  },
  obThumbnails: { flexDirection: 'row', alignItems: 'center' },
  obThumb: { width: 36, height: 36, borderRadius: 10, borderWidth: 2, borderColor: '#FFFCF9', backgroundColor: COLORS.gray[100] },
  obThumbMore: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gray[200] },
  obThumbMoreText: { fontFamily: FONTS.primary.bold, fontSize: 11, color: COLORS.gray[600] },
  obInfo: { flex: 1, marginLeft: 10 },
  obTitle: { fontFamily: FONTS.primary.semibold, fontSize: 14, color: CAPSULE_TEXT },
  obSubtitle: { fontFamily: FONTS.primary.regular, fontSize: 11, color: COLORS.gray[500], marginTop: 1 },
  obClearBtn: { padding: 6, marginRight: 4 },
  obArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CAPSULE_GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CAPSULE_GOLD,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
