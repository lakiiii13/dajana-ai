// ===========================================
// DAJANA AI - OutfitBuilder (Kapsula)
// Jedan plus, animacija: slika se dovlači na sto, baci, pa ostaje na stolu
// ===========================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FONTS, COLORS, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useTryOnStore } from '@/stores/tryOnStore';
import { OutfitPickerModal } from '@/components/OutfitPickerModal';
import { OutfitWithSaved } from '@/lib/api';
import { CategoryId } from '@/constants/categories';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TABLE_BG = require('@/assets/images/table-outfit3.jpg');

type ZoneId = 'outerwear' | 'top' | 'accessory' | 'bottom' | 'bag' | 'shoes';

const MIN_DIM = Math.min(SCREEN_W, SCREEN_H);
// Kaput najveći – sve stane u njega; ostali komadi manji, u centru preko njega
const OUTERWEAR_SIZE = Math.round(MIN_DIM * 0.78);
const INNER_ITEM_SIZE = Math.round(MIN_DIM * 0.52);
const BAG_SIZE = Math.round(MIN_DIM * 0.36);
const ACCESSORY_SIZE = Math.round(MIN_DIM * 0.22);

// Jedna linija: kaput → gornji delovi → donji → obuća (sve centrirano, jedan ispod drugog)
const ZONE_POSITIONS: Record<ZoneId, { left: number; top: number }> = {
  outerwear: { left: 0.5, top: 0.20 },   // kaput gore
  top: { left: 0.5, top: 0.36 },        // gornji delovi (duks, majica)
  accessory: { left: 0.87, top: 0.60 }, // sat naslonjen na ugao torbe
  bottom: { left: 0.5, top: 0.52 },    // donji delovi (trenerka, suknja)
  shoes: { left: 0.5, top: 0.68 },     // obuća dole
  bag: { left: 0.82, top: 0.66 },      // tašna malo više udesno
};

function getItemSize(zoneId: ZoneId): number {
  if (zoneId === 'outerwear') return OUTERWEAR_SIZE;
  if (zoneId === 'bag') return BAG_SIZE;
  if (zoneId === 'accessory') return ACCESSORY_SIZE;
  return INNER_ITEM_SIZE;
}

function getItemPosition(zoneId: ZoneId): { left: number; top: number } {
  return ZONE_POSITIONS[zoneId];
}

function getZoneLabels(): { key: ZoneId; label: string }[] {
  return [
    { key: 'outerwear', label: t('table_builder.zone_outerwear') },
    { key: 'top', label: t('table_builder.zone_top') },
    { key: 'bottom', label: t('table_builder.zone_bottom') },
    { key: 'shoes', label: t('table_builder.zone_shoes') },
    { key: 'accessory', label: t('table_builder.zone_accessory') },
    { key: 'bag', label: t('table_builder.zone_bag') },
  ];
}

const ZONE_TO_CATEGORY: Record<ZoneId, CategoryId> = {
  outerwear: 'outerwear',
  top: 'tops',
  accessory: 'accessories',
  bottom: 'bottoms',
  bag: 'accessories',
  shoes: 'obuca',
};

type AddedEntry = { zoneId: ZoneId; item: OutfitWithSaved; entryId: number };

// Lista ostaje i kad se ekran ponovo mount-uje (npr. tab, modal)
let persistedTableItems: AddedEntry[] = [];
let nextEntryId = 1;
const TRASH_HIT_SLOP = 24;

function getStackOffset(stackIndex: number): { x: number; y: number } {
  if (stackIndex <= 0) return { x: 0, y: 0 };
  const side = stackIndex % 2 === 0 ? -1 : 1;
  const spread = Math.ceil(stackIndex / 2);
  return {
    x: side * spread * 56,
    y: stackIndex * 52,
  };
}

function DraggableItem({
  entryId,
  imageUrl,
  zoneId,
  left,
  top,
  size,
  isDragging,
  onDragStart,
  onDrop,
}: {
  entryId: number;
  imageUrl: string;
  zoneId: ZoneId;
  left: number;
  top: number;
  size: number;
  isDragging: boolean;
  onDragStart: (id: number) => void;
  onDrop: (id: number, moveX: number, moveY: number) => void;
}) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        onDragStart(entryId);
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        onDrop(entryId, gesture.moveX, gesture.moveY);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          bounciness: 7,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          bounciness: 7,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.itemOnTable,
        { left, top, width: size, height: size, zIndex: isDragging ? 99999 : entryId },
        zoneId === 'accessory' && styles.accessoryTilt,
        { transform: pan.getTranslateTransform() },
      ]}
    >
      <Image source={{ uri: imageUrl }} style={styles.itemOnTableImage} resizeMode="contain" />
    </Animated.View>
  );
}

export default function OutfitBuilderScreen() {
  const insets = useSafeAreaInsets();
  const CATEGORIES = getZoneLabels();
  const trashRef = useRef<View | null>(null);
  const [addedItems, setAddedItems] = useState<AddedEntry[]>(() => [...persistedTableItems]);
  const [activeSlot, setActiveSlot] = useState<ZoneId | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [draggingEntryId, setDraggingEntryId] = useState<number | null>(null);
  const [trashRect, setTrashRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const { setOutfitTitle, clearOutfitItems, addOutfitItem } = useTryOnStore();

  const totalItems = addedItems.length;
  const canTryOn = totalItems >= 2;
  const contentW = SCREEN_W;
  const contentH = SCREEN_H - 140;

  useEffect(() => {
    const maxPersistedId = persistedTableItems.reduce((max, entry) => Math.max(max, entry.entryId), 0);
    nextEntryId = Math.max(nextEntryId, maxPersistedId + 1);
  }, []);

  const onBigPlusPress = useCallback(() => {
    setCategoryModalVisible(true);
  }, []);

  const onCategoryPick = useCallback((slotKey: ZoneId) => {
    setActiveSlot(slotKey);
    setCategoryModalVisible(false);
    setPickerVisible(true);
  }, []);

  const removeItem = useCallback((entryId: number) => {
    setAddedItems((prev) => {
      const next = prev.filter((e) => e.entryId !== entryId);
      persistedTableItems = next;
      return next;
    });
  }, []);

  const refreshTrashRect = useCallback(() => {
    trashRef.current?.measureInWindow((x, y, width, height) => {
      setTrashRect({ x, y, width, height });
    });
  }, []);

  useEffect(() => {
    if (draggingEntryId === null) return;
    const raf = requestAnimationFrame(() => {
      refreshTrashRect();
      setTimeout(refreshTrashRect, 50);
    });
    return () => cancelAnimationFrame(raf);
  }, [draggingEntryId, refreshTrashRect]);

  const isInTrash = useCallback(
    (moveX: number, moveY: number) => {
      if (!trashRect) return false;
      return (
        moveX >= trashRect.x - TRASH_HIT_SLOP &&
        moveX <= trashRect.x + trashRect.width + TRASH_HIT_SLOP &&
        moveY >= trashRect.y - TRASH_HIT_SLOP &&
        moveY <= trashRect.y + trashRect.height + TRASH_HIT_SLOP
      );
    },
    [trashRect]
  );

  const onDragStart = useCallback(
    (entryId: number) => {
      setDraggingEntryId(entryId);
      requestAnimationFrame(refreshTrashRect);
    },
    [refreshTrashRect]
  );

  const onDropItem = useCallback(
    (entryId: number, moveX: number, moveY: number) => {
      // Fallback hit zona za slučaj da measure kasni u prvom frame-u drag-a.
      const fallbackBottomRightHit = moveX > SCREEN_W - 130 && moveY > SCREEN_H - 190;
      if (isInTrash(moveX, moveY) || fallbackBottomRightHit) {
        removeItem(entryId);
      }
      setDraggingEntryId(null);
    },
    [isInTrash, removeItem]
  );

  const selectItem = useCallback((item: OutfitWithSaved) => {
    if (activeSlot) {
      setAddedItems((prev) => {
        const next: AddedEntry[] = [...prev, { zoneId: activeSlot, item, entryId: nextEntryId++ }];
        persistedTableItems = next;
        return next;
      });
      setPickerVisible(false);
    }
  }, [activeSlot]);

  const handleTryOn = useCallback(() => {
    if (!canTryOn) return;
    clearOutfitItems();
    addedItems.forEach(({ zoneId, item }) => {
      addOutfitItem({
        id: item.id,
        imageUrl: item.image_url,
        title: item.title ?? null,
        zoneId,
      });
    });
    setOutfitTitle('Moj outfit');
    router.push('/try-on' as any);
  }, [canTryOn, addedItems, clearOutfitItems, addOutfitItem, setOutfitTitle]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={TABLE_BG} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={CREAM} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>{t('table_builder.screen_title')}</Text>
            <Text style={styles.subtitle}>{t('table_builder.screen_subtitle')}</Text>
          </View>
          <Text style={styles.counterNumber}>{addedItems.length}</Text>
        </View>
        <View style={styles.headerLine} />

        <View style={[styles.canvas, { width: contentW, height: contentH }]}>
          {/* Svi dodati komadi ostaju na stolu – kaput iza, ostalo preko */}
          {(() => {
            const sorted = [...addedItems].sort((a, b) =>
              a.zoneId === 'outerwear' ? -1 : b.zoneId === 'outerwear' ? 1 : 0
            );
            const zoneStack = new Map<ZoneId, number>();
            return sorted.map((entry) => {
              const { zoneId, item, entryId } = entry;
              const size = getItemSize(zoneId);
              const pos = getItemPosition(zoneId);
              const sameZoneIndex = zoneStack.get(zoneId) ?? 0;
              zoneStack.set(zoneId, sameZoneIndex + 1);
              const stackOffset = getStackOffset(sameZoneIndex);
              const left = contentW * pos.left - size / 2 + stackOffset.x;
              const top = contentH * pos.top - size / 2 + stackOffset.y;
              return (
                <DraggableItem
                  key={entryId}
                  entryId={entryId}
                  imageUrl={item.image_url}
                  zoneId={zoneId}
                  left={left}
                  top={top}
                  size={size}
                  isDragging={draggingEntryId === entryId}
                  onDragStart={onDragStart}
                  onDrop={onDropItem}
                />
              );
            });
          })()}
          {totalItems === 0 && (
            <TouchableOpacity
              style={styles.plusCenter}
              onPress={onBigPlusPress}
              activeOpacity={0.7}
              hitSlop={24}
            >
              <Feather name="plus" size={64} color={CREAM} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
          {draggingEntryId !== null && (
            <View pointerEvents="none" style={styles.trashWrap}>
              <View ref={trashRef} style={styles.trashBin}>
                <Feather name="trash-2" size={26} color="#fff" />
                <Text style={styles.trashText}>Obriši</Text>
              </View>
            </View>
          )}
        </View>

        {totalItems > 0 && (
          <View style={[styles.addFloatingWrap, { bottom: insets.bottom + 112 }]}>
            <TouchableOpacity style={styles.addFloatingBtn} onPress={onBigPlusPress} activeOpacity={0.88}>
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.addFloatingText}>Dodaj</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
        <Text style={styles.hint}>
          {totalItems < 2
            ? `Dodaj najmanje ${2 - totalItems} komad${totalItems === 1 ? '' : 'a'} da bi isprobao outfit`
            : 'Outfit je spreman za probanje!'}
        </Text>
        <TouchableOpacity
          style={[styles.tryBtn, totalItems < 2 && styles.tryBtnDisabled]}
          onPress={handleTryOn}
          disabled={totalItems < 2}
          activeOpacity={0.88}
        >
          <Text style={[styles.tryBtnText, totalItems < 2 && styles.tryBtnTextDisabled]}>
            Isprobaj outfit
          </Text>
        </TouchableOpacity>
        </View>

        <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
          <View style={styles.categorySheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Šta dodaješ?</Text>
            {CATEGORIES.map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                style={styles.categoryBtn}
                onPress={() => onCategoryPick(key)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryBtnText}>{label}</Text>
                <Feather name="chevron-right" size={18} color={COLORS.gray[400]} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

        <OutfitPickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onSelect={selectItem}
          initialCategoryId={activeSlot ? ZONE_TO_CATEGORY[activeSlot] : undefined}
        />
      </ImageBackground>
    </View>
  );
}

const CREAM = '#F8F4EF';
const GOLD = COLORS.secondary;
const DARK = '#1A1A1A';
const MUTED = '#9A9087';

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12,10,8,0.35)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 22,
    letterSpacing: 4,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    letterSpacing: 1,
    color: '#FFF',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  counterNumber: {
    fontFamily: FONTS.primary.light,
    fontSize: 20,
    color: CREAM,
    minWidth: 24,
    textAlign: 'right',
  },
  headerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 20 },
  canvas: {
    flex: 1,
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemOnTable: {
    position: 'absolute',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  itemOnTableImage: {
    width: '100%',
    height: '100%',
  },
  accessoryTilt: {
    transform: [{ rotate: '-14deg' }],
  },
  plusCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashWrap: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  trashBin: {
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: 'rgba(18,18,18,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  trashText: {
    marginTop: 2,
    fontFamily: FONTS.primary.semibold,
    color: '#fff',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  addFloatingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5000,
  },
  addFloatingBtn: {
    minWidth: 120,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  addFloatingText: {
    marginLeft: 8,
    fontFamily: FONTS.primary.medium,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footer: { paddingHorizontal: 24, alignItems: 'center', paddingTop: 8 },
  hint: {
    fontFamily: FONTS.primary.light,
    fontSize: 12,
    color: 'rgba(248,244,239,0.9)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  tryBtn: {
    width: '100%',
    maxWidth: 320,
    marginTop: 14,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tryBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.06)', shadowOpacity: 0, elevation: 0 },
  tryBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  tryBtnTextDisabled: { color: MUTED },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  categorySheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 18,
    letterSpacing: 1,
    color: DARK,
    marginBottom: 16,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  categoryBtnText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 15,
    color: DARK,
  },
});
