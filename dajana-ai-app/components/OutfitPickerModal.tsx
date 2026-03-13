import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { CATEGORIES, CategoryId, getCategoryTag } from '@/constants/categories';
import { fetchOutfits, OutfitFilters, OutfitWithSaved, ApiError } from '@/lib/api';
import OutfitCard from '@/components/OutfitCard';
import { Database, BodyType, Season } from '@/types/database';

const { width, height } = Dimensions.get('window');
const CAPSULE_CREAM = '#F8F4EF';
const CAPSULE_GOLD = '#CF8F5A';
const CAPSULE_TEXT = '#2C2A28';

interface OutfitPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (outfit: OutfitWithSaved) => void;
  /** Kategorija prema zoni iz table-buildera (npr. cipele → obuca); kad se otvori modal, prikaže se ta opcija. */
  initialCategoryId?: CategoryId;
}

export function OutfitPickerModal({ visible, onClose, onSelect, initialCategoryId }: OutfitPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuthStore();
  
  const isZoneLocked = !!initialCategoryId && initialCategoryId !== 'all';
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [useMyBodyType, setUseMyBodyType] = useState(false);
  const [useMySeason, setUseMySeason] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const [outfits, setOutfits] = useState<OutfitWithSaved[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo<OutfitFilters>(() => {
    const f: OutfitFilters = {};
    const categoryTag = getCategoryTag(activeCategory);
    if (categoryTag) f.tags = [categoryTag];
    if (useMyBodyType && profile?.body_type) f.bodyType = profile.body_type;
    if (useMySeason && profile?.season) f.season = profile.season;
    return f;
  }, [activeCategory, useMyBodyType, useMySeason, profile?.body_type, profile?.season]);

  /** Build filters for a given category (used so initial load uses initialCategoryId before state updates). */
  const getFiltersForCategory = useCallback(
    (categoryId: CategoryId | undefined): OutfitFilters => {
      const f: OutfitFilters = {};
      const tag = categoryId ? getCategoryTag(categoryId) : undefined;
      if (tag) f.tags = [tag];
      if (useMyBodyType && profile?.body_type) f.bodyType = profile.body_type;
      if (useMySeason && profile?.season) f.season = profile.season;
      return f;
    },
    [useMyBodyType, useMySeason, profile?.body_type, profile?.season]
  );

  const loadOutfits = useCallback(
    async (showRefreshing = false, categoryOverride?: CategoryId) => {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const effectiveFilters = categoryOverride !== undefined ? getFiltersForCategory(categoryOverride) : filters;
      try {
        const data = await fetchOutfits(effectiveFilters, user?.id);
        setOutfits(data);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError(t('errors.load_failed'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, getFiltersForCategory, user?.id]
  );

  useEffect(() => {
    if (visible) {
      if (initialCategoryId && initialCategoryId !== 'all') {
        setActiveCategory(initialCategoryId);
        loadOutfits(false, initialCategoryId);
      } else {
        setActiveCategory('all');
        loadOutfits(false);
      }
    }
  }, [visible, initialCategoryId, loadOutfits]);

  const handleRefresh = () => {
    loadOutfits(true);
  };

  const currentCategoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.labelKey
    ? t(CATEGORIES.find((c) => c.id === activeCategory)!.labelKey)
    : t('capsule.categories.all');

  const renderOutfitCard = ({ item, index }: { item: OutfitWithSaved; index: number }) => (
    <OutfitCard
      outfit={item}
      onPress={() => onSelect(item)}
      onToggleSave={async () => {}}
      isLoggedIn={!!user}
      index={index}
    />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Izaberi komad</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <Ionicons name="close" size={24} color={CAPSULE_TEXT} />
          </TouchableOpacity>
        </View>

        <View style={styles.dropdownWrap}>
          {isZoneLocked ? (
            <View style={[styles.dropdownButton, { opacity: 0.7 }]}>
              <Text style={styles.dropdownLabel}>Kategorija: {currentCategoryLabel}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowCategoryModal(true)} activeOpacity={0.7}>
              <Text style={styles.dropdownLabel}>Kategorija: {currentCategoryLabel}</Text>
              <Ionicons name="chevron-down" size={18} color={CAPSULE_TEXT} />
            </TouchableOpacity>
          )}
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
                  Tvoj tip tela
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
                  Tvoja paleta
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={CAPSULE_GOLD} />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={outfits}
            renderItem={renderOutfitCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={CAPSULE_GOLD} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="shirt-outline" size={48} color={COLORS.gray[300]} />
                <Text style={styles.emptySubtitle}>Nema rezultata za ove filtere.</Text>
              </View>
            }
          />
        )}

        {/* Category Modal */}
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
                    loadOutfits(false, item.id);
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CAPSULE_CREAM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(207, 143, 90, 0.2)',
  },
  headerTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 20,
    color: CAPSULE_TEXT,
    letterSpacing: 1,
  },
  closeBtn: {
    position: 'absolute',
    right: SPACING.lg,
  },
  dropdownWrap: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: SPACING.sm },
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
  quickFilters: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, flexWrap: 'wrap', gap: 8 },
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
  gridContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: 40 },
  row: { justifyContent: 'space-between', gap: 14, marginBottom: 0 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, minHeight: 300 },
  emptySubtitle: { fontFamily: FONTS.primary.regular, fontSize: FONT_SIZES.md, color: COLORS.gray[500], marginTop: SPACING.xs, textAlign: 'center' },
  retryButton: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, backgroundColor: CAPSULE_GOLD, borderRadius: BORDER_RADIUS.md },
  retryButtonText: { fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.sm, color: COLORS.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: '#FFFCF9', borderRadius: 20, padding: SPACING.md, maxHeight: '70%' },
  modalTitle: { fontFamily: FONTS.heading.semibold, fontSize: FONT_SIZES.lg, color: CAPSULE_TEXT, marginBottom: SPACING.sm, paddingHorizontal: 4 },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, gap: 12 },
  modalRowActive: { backgroundColor: CAPSULE_GOLD + '14' },
  modalRowText: { flex: 1, fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.md, color: CAPSULE_TEXT },
  modalRowTextActive: { color: CAPSULE_GOLD },
});
