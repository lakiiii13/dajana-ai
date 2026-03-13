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
  ScrollView,
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
// Smanjene veličine da svi komadi stanu uredno na ekran bez preklapanja.
const OUTERWEAR_SIZE = Math.round(MIN_DIM * 0.56);
const INNER_ITEM_SIZE = Math.round(MIN_DIM * 0.38);
const BAG_SIZE = Math.round(MIN_DIM * 0.21);
const ACCESSORY_SIZE = Math.round(MIN_DIM * 0.14);

// Uredniji raspored: glavni komadi po sredini, aksesoari desno.
const ZONE_POSITIONS: Record<ZoneId, { left: number; top: number }> = {
  outerwear: { left: 0.5, top: 0.16 },
  top: { left: 0.5, top: 0.34 },
  bottom: { left: 0.5, top: 0.54 },
  shoes: { left: 0.5, top: 0.74 },
  accessory: { left: 0.81, top: 0.46 },
  bag: { left: 0.81, top: 0.67 },
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
    { key: 'outerwear', label: 'Kaput / Jakna' },
    { key: 'top', label: 'Gornji delovi' },
    { key: 'bottom', label: 'Donji deo' },
    { key: 'shoes', label: 'Obuća' },
    { key: 'accessory', label: 'Aksesoar' },
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

const ZONE_ORDER: ZoneId[] = ['outerwear', 'top', 'bottom', 'shoes', 'accessory', 'bag'];
const TAP_THRESHOLD = 10;

function ZoneStack({
  zoneId,
  entries,
  left,
  top,
  size,
  isDragging,
  onDragStart,
  onDrop,
  onPress,
}: {
  zoneId: ZoneId;
  entries: AddedEntry[];
  left: number;
  top: number;
  size: number;
  isDragging: boolean;
  onDragStart: (z: ZoneId) => void;
  onDrop: (z: ZoneId, moveX: number, moveY: number) => void;
  onPress: (z: ZoneId) => void;
}) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const first = entries[0];
  const count = entries.length;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
      onPanResponderGrant: () => {
        onDragStart(zoneId);
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        const isTap = Math.abs(gesture.dx) < TAP_THRESHOLD && Math.abs(gesture.dy) < TAP_THRESHOLD;
        if (isTap) {
          onPress(zoneId);
        } else {
          onDrop(zoneId, gesture.moveX, gesture.moveY);
        }
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

  const zIndex = isDragging ? 99999 : 100 + ZONE_ORDER.indexOf(zoneId);
  const transform = [
    ...(zoneId === 'accessory' ? [{ rotate: '-14deg' as const }] : []),
    ...pan.getTranslateTransform(),
  ];

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.itemOnTable,
        { left, top, width: size, height: size, zIndex, transform },
      ]}
    >
      <Image source={{ uri: first.item.image_url }} style={styles.itemOnTableImage} resizeMode="contain" />
      {count > 1 && (
        <TouchableOpacity
          style={[
            styles.stackBadge,
            (zoneId === 'accessory' || zoneId === 'bag') && styles.stackBadgeSmall,
          ]}
          onPress={() => onPress(zoneId)}
          activeOpacity={0.85}
          hitSlop={8}
        >
          <Text
            style={[
              styles.stackBadgeText,
              (zoneId === 'accessory' || zoneId === 'bag') && styles.stackBadgeTextSmall,
            ]}
          >
            {count}
          </Text>
        </TouchableOpacity>
      )}
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
  const [draggingZoneId, setDraggingZoneId] = useState<ZoneId | null>(null);
  const [stackDetailZone, setStackDetailZone] = useState<ZoneId | null>(null);
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

  useEffect(() => {
    if (!stackDetailZone) return;
    const isEmpty =
      stackDetailZone === 'accessory'
        ? !addedItems.some((e) => e.zoneId === 'accessory' || e.zoneId === 'bag')
        : !addedItems.some((e) => e.zoneId === stackDetailZone);
    if (isEmpty) setStackDetailZone(null);
  }, [stackDetailZone, addedItems]);

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

  const removeItemsInZone = useCallback((zoneId: ZoneId) => {
    setAddedItems((prev) => {
      const next = prev.filter((e) => e.zoneId !== zoneId);
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
    if (draggingZoneId === null) return;
    const raf = requestAnimationFrame(() => {
      refreshTrashRect();
      setTimeout(refreshTrashRect, 50);
    });
    return () => cancelAnimationFrame(raf);
  }, [draggingZoneId, refreshTrashRect]);

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
    (zoneId: ZoneId) => {
      setDraggingZoneId(zoneId);
      requestAnimationFrame(refreshTrashRect);
    },
    [refreshTrashRect]
  );

  const onDropZone = useCallback(
    (zoneId: ZoneId, moveX: number, moveY: number) => {
      const fallbackBottomRightHit = moveX > SCREEN_W - 130 && moveY > SCREEN_H - 190;
      if (isInTrash(moveX, moveY) || fallbackBottomRightHit) {
        removeItemsInZone(zoneId);
      }
      setDraggingZoneId(null);
    },
    [isInTrash, removeItemsInZone]
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
          <ScrollView
            style={styles.slotScroll}
            contentContainerStyle={[
              styles.slotScrollContent,
              { paddingBottom: insets.bottom + 120 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {(() => {
              const byZone = new Map<ZoneId, AddedEntry[]>();
              for (const entry of addedItems) {
                const list = byZone.get(entry.zoneId) ?? [];
                list.push(entry);
                byZone.set(entry.zoneId, list);
              }
              const allZones = getZoneLabels();
              const mainZones = allZones.slice(0, 4); // Kaput, Gornji, Donji, Obuća
              // Jedan box "Aksesoar" (obuhvata i torbe) – puna širina
              const accessoryEntries = (byZone.get('accessory') ?? []).concat(byZone.get('bag') ?? []);

              const renderSlot = (key: ZoneId, label: string, entriesOverride?: AddedEntry[]) => {
                const entries = entriesOverride ?? (byZone.get(key) ?? []);
                const firstEntry = entries[0];
                const hasItems = entries.length > 0;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.slotCard, hasItems && styles.slotCardFilled]}
                    activeOpacity={0.88}
                    onPress={() => {
                      if (hasItems) setStackDetailZone(key);
                      else onCategoryPick(key);
                    }}
                  >
                    <View style={styles.slotHeader}>
                      <Text style={styles.slotLabel}>{label}</Text>
                      {entries.length > 1 && (
                        <View style={styles.slotCountBadge}>
                          <Text style={styles.slotCountBadgeText}>{entries.length}</Text>
                        </View>
                      )}
                    </View>

                    {hasItems ? (
                      <View style={styles.slotContent}>
                        <View style={styles.slotPreviewWrap}>
                          <Image
                            source={{ uri: firstEntry.item.image_url }}
                            style={[
                              styles.slotPreview,
                              (key === 'accessory' || firstEntry.zoneId === 'accessory') && styles.slotPreviewAccessory,
                              (key === 'bag' || firstEntry.zoneId === 'bag') && styles.slotPreviewBag,
                            ]}
                            resizeMode="contain"
                          />
                        </View>
                        <View style={styles.slotMeta}>
                          <Text style={styles.slotItemTitle} numberOfLines={2}>
                            {firstEntry.item.title ?? 'Dodati komad'}
                          </Text>
                          <Text style={styles.slotItemSubtitle}>
                            {entries.length === 1 ? '1 komad dodat' : `${entries.length} komada dodato`}
                          </Text>
                          <TouchableOpacity
                            style={styles.slotAddMoreBtn}
                            onPress={(event) => {
                              event.stopPropagation();
                              onCategoryPick(key);
                            }}
                            activeOpacity={0.85}
                          >
                            <Feather name="plus" size={14} color={DARK} />
                            <Text style={styles.slotAddMoreText}>Dodaj još</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.slotEmptyState}>
                        <View style={styles.slotEmptyIcon}>
                          <Feather name="plus" size={18} color={CREAM} />
                        </View>
                        <Text style={styles.slotEmptyText}>Dodaj komad</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              };

              return (
                <>
                  <View style={styles.slotGridRow}>
                    {mainZones.map(({ key, label }) => (
                      <View key={key} style={styles.slotGridCardWrap}>
                        {renderSlot(key, label)}
                      </View>
                    ))}
                  </View>
                  <View style={styles.slotBottomRow}>
                    <View style={styles.slotBottomCardWrapFull}>
                      {renderSlot('accessory', 'Aksesoar', accessoryEntries)}
                    </View>
                  </View>
                </>
              );
            })()}
          </ScrollView>
        </View>

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

        {/* Modal: koje komade je korisnik izabrao u ovoj zoni */}
        <Modal
          visible={stackDetailZone !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setStackDetailZone(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setStackDetailZone(null)}>
            <View style={styles.stackDetailSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {stackDetailZone ? getZoneLabels().find((z) => z.key === stackDetailZone)?.label : ''}
              </Text>
              <Text style={styles.stackDetailSubtitle}>
                {stackDetailZone &&
                  (stackDetailZone === 'accessory'
                    ? addedItems.filter((e) => e.zoneId === 'accessory' || e.zoneId === 'bag').length
                    : addedItems.filter((e) => e.zoneId === stackDetailZone).length)}{' '}
                komad(a) u ovoj zoni
              </Text>
              <ScrollView style={styles.stackDetailScroll} showsVerticalScrollIndicator={false}>
                {stackDetailZone &&
                  addedItems
                    .filter((e) =>
                      stackDetailZone === 'accessory'
                        ? e.zoneId === 'accessory' || e.zoneId === 'bag'
                        : e.zoneId === stackDetailZone
                    )
                    .map((entry) => (
                      <View key={entry.entryId} style={styles.stackDetailRow}>
                        <Image
                          source={{ uri: entry.item.image_url }}
                          style={styles.stackDetailThumb}
                          resizeMode="cover"
                        />
                        <Text style={styles.stackDetailTitle} numberOfLines={2}>
                          {entry.item.title ?? 'Komad'}
                        </Text>
                        <TouchableOpacity
                          style={styles.stackDetailRemove}
                          onPress={() => removeItem(entry.entryId)}
                          hitSlop={8}
                        >
                          <Feather name="trash-2" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.stackDetailCloseBtn}
                onPress={() => setStackDetailZone(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.stackDetailCloseBtnText}>Zatvori</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
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
    backgroundColor: 'rgba(12,10,8,0.24)',
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
  slotScroll: {
    width: '100%',
  },
  slotScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  slotGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginBottom: 12,
  },
  slotBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  slotGridCardWrap: {
    width: '47%',
  },
  slotBottomCardWrap: {
    width: '48%',
  },
  slotBottomCardWrapFull: {
    width: '100%',
  },
  slotCard: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'rgba(248,244,239,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(248,244,239,0.32)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  slotCardFilled: {
    backgroundColor: 'rgba(248,244,239,0.20)',
    borderColor: 'rgba(248,244,239,0.38)',
  },
  slotHeader: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  slotLabel: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 13,
    letterSpacing: 0.3,
    color: COLORS.primary,
    textAlign: 'center',
  },
  slotCountBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  slotCountBadgeText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 13,
    color: CREAM,
  },
  slotContent: {
    alignItems: 'center',
    width: '100%',
  },
  slotPreviewWrap: {
    width: '100%',
    height: 150,
    borderRadius: 0,
    backgroundColor: 'rgba(248,244,239,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  slotPreview: {
    width: '76%',
    height: '76%',
  },
  slotPreviewAccessory: {
    width: '46%',
    height: '46%',
  },
  slotPreviewBag: {
    width: '54%',
    height: '54%',
  },
  slotMeta: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: 'transparent',
  },
  slotItemTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 14,
    lineHeight: 18,
    color: DARK,
    textAlign: 'center',
  },
  slotItemSubtitle: {
    marginTop: 6,
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: '#6F6A64',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  slotAddMoreBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(248,244,239,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(207,143,90,0.55)',
  },
  slotAddMoreText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 13,
    color: DARK,
  },
  slotEmptyState: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 30,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  slotEmptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(207,143,90,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.28)',
  },
  slotEmptyText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    color: COLORS.primary,
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
  stackBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stackBadgeSmall: {
    top: 2,
    right: 2,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.25,
  },
  stackBadgeText: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 15,
    color: DARK,
    letterSpacing: 0.5,
  },
  stackBadgeTextSmall: {
    fontSize: 12,
    letterSpacing: 0.2,
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
  stackDetailSheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: '70%',
  },
  stackDetailSubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: MUTED,
    marginBottom: 16,
  },
  stackDetailScroll: {
    maxHeight: 280,
    marginBottom: 8,
  },
  stackDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  stackDetailThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
  },
  stackDetailTitle: {
    flex: 1,
    fontFamily: FONTS.primary.medium,
    fontSize: 15,
    color: DARK,
  },
  stackDetailRemove: {
    padding: 8,
  },
  stackDetailCloseBtn: {
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: DARK,
    borderRadius: 14,
    alignItems: 'center',
  },
  stackDetailCloseBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 15,
    color: CREAM,
  },
});
