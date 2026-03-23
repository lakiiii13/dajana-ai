// ===========================================
// DAJANA AI - Outfit Builder (Kombin Dene)
// Vertical flat-lay slots: outerwear, top, bottom, shoes
// Tap "+" to browse items per category, swipe to pick
// ===========================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  Layout,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useTryOnStore, OutfitItem } from '@/stores/tryOnStore';
import { fetchOutfits, OutfitWithSaved } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const { width: W, height: H } = Dimensions.get('window');
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';
const CARD_BG = '#FFFCF9';

// Outfit builder slots
type SlotType = 'outerwear' | 'top' | 'bottom' | 'shoes';

interface Slot {
  type: SlotType;
  label: string;
  icon: string;
  tag: string;
}

function getSlots(): Slot[] {
  return [
    { type: 'outerwear', label: t('outfit_builder.slot_outerwear'), icon: 'snow-outline', tag: 'outerwear' },
    { type: 'top', label: t('outfit_builder.slot_top'), icon: 'shirt-outline', tag: 'tops' },
    { type: 'bottom', label: t('outfit_builder.slot_bottom'), icon: 'remove-outline', tag: 'bottoms' },
    { type: 'shoes', label: t('outfit_builder.slot_shoes'), icon: 'footsteps-outline', tag: 'accessories' },
  ];
}

const SLOT_IMAGE_H = (H - 320) / 4;
const SLOT_IMAGE_W = W * 0.5;
const PICKER_ITEM_SIZE = 80;

export default function OutfitBuilderScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const SLOTS = getSlots();
  const addOutfitItem = useTryOnStore((s) => s.addOutfitItem);
  const clearOutfitItems = useTryOnStore((s) => s.clearOutfitItems);

  // Selected items per slot
  const [selected, setSelected] = useState<Record<SlotType, OutfitWithSaved | null>>({
    outerwear: null,
    top: null,
    bottom: null,
    shoes: null,
  });

  // Bottom sheet state
  const [pickerSlot, setPickerSlot] = useState<SlotType | null>(null);
  const [pickerItems, setPickerItems] = useState<OutfitWithSaved[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Pre-fill first slot if store has items
  const storeItems = useTryOnStore((s) => s.outfitItems);
  useEffect(() => {
    if (storeItems.length > 0) {
      const first = storeItems[0];
      setSelected((prev) => ({
        ...prev,
        top: { id: first.id, image_url: first.imageUrl, title: first.title } as any,
      }));
    }
  }, []);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const openPicker = useCallback(async (slotType: SlotType) => {
    setPickerSlot(slotType);
    setPickerLoading(true);
    try {
      const slot = SLOTS.find((s) => s.type === slotType)!;
      const data = await fetchOutfits({ tags: [slot.tag], limit: 30 }, user?.id);
      setPickerItems(data);
    } catch (err) {
      console.error('Load picker items:', err);
      setPickerItems([]);
    } finally {
      setPickerLoading(false);
    }
  }, [user?.id]);

  const selectItem = useCallback((slotType: SlotType, item: OutfitWithSaved) => {
    setSelected((prev) => ({ ...prev, [slotType]: item }));
    setPickerSlot(null);
  }, []);

  const removeItem = useCallback((slotType: SlotType) => {
    setSelected((prev) => ({ ...prev, [slotType]: null }));
  }, []);

  const handleTryOn = useCallback(() => {
    clearOutfitItems();
    Object.values(selected).forEach((item) => {
      if (item) {
        addOutfitItem({ id: item.id, imageUrl: item.image_url, title: item.title });
      }
    });
    router.push('/outfit-preview' as any);
  }, [selected, clearOutfitItems, addOutfitItem]);

  const handleBack = () => router.back();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Napravi Outfit</Text>
            <View style={styles.headerLine} />
          </View>
          <TouchableOpacity onPress={handleBack} style={styles.headerBtn} activeOpacity={0.7}>
            <Ionicons name="heart-outline" size={22} color={GOLD} />
          </TouchableOpacity>
        </View>

        {/* Slots */}
        <ScrollView
          style={styles.slotsScroll}
          contentContainerStyle={styles.slotsContent}
          showsVerticalScrollIndicator={false}
        >
          {SLOTS.map((slot, index) => {
            const item = selected[slot.type];
            return (
              <Animated.View
                key={slot.type}
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={styles.slotRow}
              >
                {item ? (
                  <Pressable
                    style={styles.slotFilled}
                    onPress={() => openPicker(slot.type)}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.slotImage}
                      resizeMode="contain"
                    />
                    <TouchableOpacity
                      style={styles.slotRemove}
                      onPress={() => removeItem(slot.type)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={24} color={DARK} />
                    </TouchableOpacity>
                  </Pressable>
                ) : (
                  <TouchableOpacity
                    style={styles.slotEmpty}
                    onPress={() => openPicker(slot.type)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.plusCircle}>
                      <Ionicons name="add" size={28} color={GOLD} />
                    </View>
                    <Text style={styles.slotLabel}>{slot.label}</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Bottom CTA */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={[styles.bottomWrap, { paddingBottom: insets.bottom + 12 }]}
        >
          {selectedCount > 0 && (
            <Text style={styles.countText}>
              {selectedCount === 1 ? t('outfit_builder.items_selected_one', { count: selectedCount }) : t('outfit_builder.items_selected', { count: selectedCount })}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.ctaBtn, selectedCount === 0 && styles.ctaBtnDisabled]}
            onPress={handleTryOn}
            disabled={selectedCount === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>{t('outfit_builder.try_btn')}</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* Bottom Sheet Picker */}
      <Modal
        visible={pickerSlot !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerSlot(null)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setPickerSlot(null)}>
          <View />
        </Pressable>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {pickerSlot ? SLOTS.find((s) => s.type === pickerSlot)?.label : ''}
            </Text>
            <TouchableOpacity onPress={() => setPickerSlot(null)}>
              <Ionicons name="close-circle" size={28} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>

          {pickerLoading ? (
            <View style={styles.sheetLoading}>
              <ActivityIndicator size="large" color={GOLD} />
            </View>
          ) : pickerItems.length === 0 ? (
            <View style={styles.sheetLoading}>
              <Text style={styles.sheetEmptyText}>{t('outfit_builder.no_items_available')}</Text>
            </View>
          ) : (
            <FlatList
              data={pickerItems}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetList}
              renderItem={({ item }) => {
                const isSelected = pickerSlot && selected[pickerSlot]?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.sheetItem, isSelected && styles.sheetItemActive]}
                    onPress={() => pickerSlot && selectItem(pickerSlot, item)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.sheetItemImage}
                      resizeMode="cover"
                    />
                    <Text
                      style={[styles.sheetItemText, isSelected && styles.sheetItemTextActive]}
                      numberOfLines={1}
                    >
                      {item.title || 'Outfit'}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={GOLD} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  safe: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 22,
    color: DARK,
    letterSpacing: 1.5,
  },
  headerLine: {
    width: 32,
    height: 2,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    borderRadius: 1,
  },

  // Slots
  slotsScroll: {
    flex: 1,
  },
  slotsContent: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: 8,
  },
  slotRow: {
    width: SLOT_IMAGE_W + 40,
    height: SLOT_IMAGE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotFilled: {
    width: SLOT_IMAGE_W,
    height: SLOT_IMAGE_H - 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  slotImage: {
    width: '100%',
    height: '100%',
  },
  slotRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  plusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD + '40',
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  slotLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: 12,
    color: COLORS.gray[500],
    letterSpacing: 0.8,
  },

  // Bottom CTA
  bottomWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(207,143,90,0.12)',
    backgroundColor: CREAM,
  },
  countText: {
    fontFamily: FONTS.primary.light,
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  ctaBtnDisabled: {
    opacity: 0.35,
  },
  ctaText: {
    fontFamily: FONTS.heading.medium,
    fontSize: 17,
    color: COLORS.white,
    letterSpacing: 1.5,
  },

  // Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetContainer: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: H * 0.55,
    paddingBottom: 30,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  sheetTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 20,
    color: DARK,
    letterSpacing: 1,
  },
  sheetLoading: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetEmptyText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 14,
    color: COLORS.gray[500],
  },
  sheetList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CREAM,
    borderRadius: 16,
    padding: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sheetItemActive: {
    borderColor: GOLD,
    backgroundColor: GOLD + '0D',
  },
  sheetItemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F0EBE3',
  },
  sheetItemText: {
    flex: 1,
    fontFamily: FONTS.primary.medium,
    fontSize: 15,
    color: DARK,
  },
  sheetItemTextActive: {
    color: GOLD,
  },
});
