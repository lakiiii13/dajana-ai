// ===========================================
// DAJANA AI - Kalendar (belo, zlatno, krem, crno)
// Shows saved outfits on their creation dates
// ===========================================

import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Image,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { AppLogo } from '@/components/AppLogo';
import { getSavedOutfits, deleteOutfitComposition, SavedOutfit } from '@/lib/tryOnService';

const CALENDAR_PALETTE = {
  background: '#FDF8F3',
  surface: '#FFFFFF',
  cream: '#F5F0E8',
  gold: '#C9A962',
  goldLight: '#E8DFC8',
  black: '#1A1A1A',
  gray: '#6B6B6B',
  border: '#E8E2D8',
  selfieTab: '#2C2C2C',
};

const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstWeekday = first.getDay();
  const daysInMonth = last.getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  const cells: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = daysInPrevMonth - firstWeekday + i + 1;
    cells.push({ day: d, isCurrentMonth: false, date: new Date(prevYear, prevMonth, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isCurrentMonth: true, date: new Date(year, month, d) });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, isCurrentMonth: false, date: new Date(year, month + 1, d) });
  }
  return cells;
}

function isToday(d: Date) {
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

/** Make a date key like "2026-02-09" */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dateKeyFromTimestamp(ts: number): string {
  const d = new Date(ts);
  return dateKey(d);
}

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [current, setCurrent] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const horizontalPadding = SPACING.lg * 2;
  const gridWidth = screenWidth - horizontalPadding;
  const cellWidth = gridWidth / 7;

  // Load outfits on focus
  const loadOutfits = useCallback(async () => {
    try {
      const data = await getSavedOutfits();
      setSavedOutfits(data);
    } catch (err) {
      console.error('Error loading outfits for calendar:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, [loadOutfits])
  );

  // Group outfits by date
  const outfitsByDate = useMemo(() => {
    const map: Record<string, SavedOutfit[]> = {};
    for (const outfit of savedOutfits) {
      const key = dateKeyFromTimestamp(outfit.timestamp);
      if (!map[key]) map[key] = [];
      map[key].push(outfit);
    }
    return map;
  }, [savedOutfits]);

  const grid = useMemo(
    () => getDaysGrid(current.year, current.month),
    [current.year, current.month]
  );

  const monthLabel = `${MONTH_NAMES[current.month]} ${current.year}`;

  const goPrev = () => {
    if (current.month === 0) setCurrent({ year: current.year - 1, month: 11 });
    else setCurrent({ year: current.year, month: current.month - 1 });
  };
  const goNext = () => {
    if (current.month === 11) setCurrent({ year: current.year + 1, month: 0 });
    else setCurrent({ year: current.year, month: current.month + 1 });
  };

  const gridRows = useMemo(() => {
    const rows: typeof grid[] = [];
    for (let r = 0; r < 6; r++) rows.push(grid.slice(r * 7, (r + 1) * 7));
    return rows;
  }, [grid]);

  const handleCellPress = (cell: { day: number; isCurrentMonth: boolean; date: Date }) => {
    const key = dateKey(cell.date);
    const dayOutfits = outfitsByDate[key];
    if (dayOutfits && dayOutfits.length > 0) {
      setSelectedDay(key);
      setModalVisible(true);
    } else {
      // No outfits — go to capsule to create one
      router.push('/(tabs)/capsule');
    }
  };

  const handleDeleteOutfit = (outfit: SavedOutfit) => {
    Alert.alert('Obriši outfit', 'Da li ste sigurni?', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: async () => {
          await deleteOutfitComposition(outfit.id);
          await loadOutfits();
          // Close modal if no more outfits for that day
          if (selectedDay) {
            const remaining = (outfitsByDate[selectedDay] || []).filter((o) => o.id !== outfit.id);
            if (remaining.length === 0) setModalVisible(false);
          }
        },
      },
    ]);
  };

  const selectedDayOutfits = selectedDay ? outfitsByDate[selectedDay] || [] : [];

  // Format selected day for display
  const selectedDayLabel = selectedDay
    ? (() => {
        const parts = selectedDay.split('-');
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      })()
    : '';

  return (
    <View style={[styles.container, { backgroundColor: CALENDAR_PALETTE.background }]}>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + SPACING.sm,
          paddingHorizontal: SPACING.lg,
          flexGrow: 1,
          paddingBottom: insets.bottom + SPACING.lg,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={28} color={CALENDAR_PALETTE.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <AppLogo height={32} maxWidth={160} />
          <Text style={[styles.tagline, { color: CALENDAR_PALETTE.gold }]}>Tvoj lični stilista</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* SELFIE tab */}
      <View style={[styles.selfieBar, { backgroundColor: CALENDAR_PALETTE.cream }]}>
        <View style={[styles.selfieTabActive, { backgroundColor: CALENDAR_PALETTE.selfieTab }]}>
          <Text style={[styles.selfieTabTextActive, { color: CALENDAR_PALETTE.surface }]}>SELFIE</Text>
          <View style={[styles.selfieDot, { backgroundColor: CALENDAR_PALETTE.surface }]} />
        </View>
      </View>

      <Text style={[styles.calendarIntro, { color: CALENDAR_PALETTE.gray }]}>
        Ovde su svi vaši outfiti po datumima
      </Text>

      {/* Month nav */}
      <View style={[styles.calendarNav, { borderBottomColor: CALENDAR_PALETTE.border }]}>
        <TouchableOpacity style={styles.calendarNavBtn} onPress={goPrev} activeOpacity={0.7}>
          <Feather name="chevron-left" size={26} color={CALENDAR_PALETTE.black} />
        </TouchableOpacity>
        <Text style={[styles.calendarMonth, { color: CALENDAR_PALETTE.black }]}>{monthLabel}</Text>
        <TouchableOpacity style={styles.calendarNavBtn} onPress={goNext} activeOpacity={0.7}>
          <Feather name="chevron-right" size={26} color={CALENDAR_PALETTE.black} />
        </TouchableOpacity>
      </View>

      {/* Day names */}
      <View style={[styles.dayNamesRow, { width: gridWidth }]}>
        {DAY_NAMES.map((day) => (
          <Text key={day} style={[styles.dayName, { color: CALENDAR_PALETTE.black }]}>{day}</Text>
        ))}
      </View>

      {/* Date grid */}
      <View style={[styles.gridWrap, { width: gridWidth, flex: 1 }]}>
        {gridRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.gridRow}>
            {row.map((cell, colIndex) => {
              const index = rowIndex * 7 + colIndex;
              const today = isToday(cell.date);
              const key = dateKey(cell.date);
              const dayOutfits = outfitsByDate[key] || [];
              const hasOutfit = dayOutfits.length > 0;
              // Collect ALL unique item images from ALL outfits for this day
              const allItemImages: string[] = [];
              for (const outfit of dayOutfits) {
                for (const item of outfit.items) {
                  if (item.imageUrl && !allItemImages.includes(item.imageUrl)) {
                    allItemImages.push(item.imageUrl);
                  }
                }
              }
              const showImages = allItemImages.slice(0, 3);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.cell,
                    {
                      width: cellWidth,
                      borderColor: hasOutfit ? CALENDAR_PALETTE.gold : CALENDAR_PALETTE.border,
                      backgroundColor: hasOutfit ? '#FFFCF6' : CALENDAR_PALETTE.surface,
                    },
                    hasOutfit && styles.cellWithOutfit,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleCellPress(cell)}
                >
                  <Text
                    style={[
                      styles.cellDay,
                      { color: cell.isCurrentMonth ? CALENDAR_PALETTE.black : CALENDAR_PALETTE.gray },
                    ]}
                  >
                    {cell.day}
                  </Text>

                  {hasOutfit && showImages.length > 0 ? (
                    /* Outfit thumbnails — show all items */
                    <View style={styles.cellThumbRow}>
                      {showImages.length === 1 ? (
                        <Image source={{ uri: showImages[0] }} style={styles.cellThumbSingle} resizeMode="cover" />
                      ) : (
                        showImages.map((url, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: url }}
                            style={[
                              styles.cellThumbMulti,
                              idx > 0 && { marginLeft: -6 },
                            ]}
                            resizeMode="cover"
                          />
                        ))
                      )}
                      {allItemImages.length > 3 && (
                        <View style={[styles.cellThumbMore, { marginLeft: -6 }]}>
                          <Text style={styles.cellThumbMoreText}>+{allItemImages.length - 3}</Text>
                        </View>
                      )}
                      {dayOutfits.length > 1 && (
                        <View style={styles.cellOutfitBadge}>
                          <Text style={styles.cellOutfitBadgeText}>{dayOutfits.length}</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.plusWrap,
                        today && { backgroundColor: CALENDAR_PALETTE.gold },
                      ]}
                    >
                      <Feather
                        name="plus"
                        size={today ? 18 : 14}
                        color={today ? CALENDAR_PALETTE.surface : CALENDAR_PALETTE.gray}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>

    {/* Day Detail Modal — shows outfits for selected day */}
    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
          {/* Modal header */}
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Outfiti za {selectedDayLabel}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={CALENDAR_PALETTE.black} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            {selectedDayOutfits.length} {selectedDayOutfits.length === 1 ? 'outfit' : 'outfita'}
          </Text>

          {/* Outfit list */}
          <FlatList
            data={selectedDayOutfits}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item: outfit }) => (
              <View style={styles.modalOutfitCard}>
                {/* Item images in a row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalItemImages}>
                  {outfit.items.map((outfitItem) => (
                    <Image
                      key={outfitItem.id}
                      source={{ uri: outfitItem.imageUrl }}
                      style={styles.modalItemImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>

                {/* Info row */}
                <View style={styles.modalOutfitInfo}>
                  <View style={styles.modalOutfitMeta}>
                    <View style={styles.modalItemBadge}>
                      <Ionicons name="shirt-outline" size={12} color={CALENDAR_PALETTE.gold} />
                      <Text style={styles.modalItemBadgeText}>
                        {outfit.items.length} {outfit.items.length === 1 ? 'komad' : 'komada'}
                      </Text>
                    </View>
                    {outfit.items.map((i) => i.title).filter(Boolean).length > 0 && (
                      <Text style={styles.modalItemTitles} numberOfLines={1}>
                        {outfit.items.map((i) => i.title).filter(Boolean).join(' + ')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.modalDeleteBtn}
                    onPress={() => handleDeleteOutfit(outfit)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#D44" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Add more button */}
          <TouchableOpacity
            style={styles.modalAddBtn}
            onPress={() => {
              setModalVisible(false);
              router.push('/(tabs)/capsule');
            }}
          >
            <Feather name="plus" size={18} color={CALENDAR_PALETTE.surface} />
            <Text style={styles.modalAddBtnText}>Dodaj novi outfit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    minHeight: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: { width: 44 },
  logo: {
    fontFamily: FONTS.logo,
    fontSize: 28,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: FONTS.primary.light,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
    letterSpacing: 1,
  },
  selfieBar: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 5,
    marginBottom: SPACING.xl,
  },
  selfieTabActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  selfieTabTextActive: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.5,
  },
  selfieDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  calendarNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  calendarNavBtn: {
    padding: SPACING.sm,
  },
  calendarMonth: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.lg,
    letterSpacing: 0.5,
  },
  calendarIntro: {
    fontFamily: FONTS.heading.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
  },
  gridWrap: {
    flex: 1,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 1,
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  cellWithOutfit: {
    borderWidth: 1.5,
    borderRadius: 4,
  },
  cellDay: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginLeft: 2,
  },
  cellThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellThumbSingle: {
    width: 36,
    height: 40,
    borderRadius: 6,
    backgroundColor: CALENDAR_PALETTE.cream,
  },
  cellThumbMulti: {
    width: 22,
    height: 30,
    borderRadius: 5,
    backgroundColor: CALENDAR_PALETTE.cream,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cellThumbMore: {
    width: 22,
    height: 30,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cellThumbMoreText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 9,
    color: '#FFF',
  },
  cellOutfitBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CALENDAR_PALETTE.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  cellOutfitBadgeText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 8,
    color: '#FFF',
  },
  plusWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: CALENDAR_PALETTE.goldLight,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: CALENDAR_PALETTE.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: CALENDAR_PALETTE.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontFamily: FONTS.heading.bold,
    fontSize: FONT_SIZES.lg,
    color: CALENDAR_PALETTE.black,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CALENDAR_PALETTE.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    color: CALENDAR_PALETTE.gray,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  modalList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  modalOutfitCard: {
    backgroundColor: CALENDAR_PALETTE.cream,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalItemImages: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  modalItemImage: {
    width: 130,
    height: 160,
    borderRadius: 10,
    backgroundColor: CALENDAR_PALETTE.border,
  },
  modalOutfitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalOutfitMeta: {
    flex: 1,
    gap: 3,
  },
  modalItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalItemBadgeText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 12,
    color: CALENDAR_PALETTE.gold,
  },
  modalItemTitles: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: CALENDAR_PALETTE.gray,
  },
  modalDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CALENDAR_PALETTE.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: CALENDAR_PALETTE.selfieTab,
    borderRadius: 14,
    gap: 8,
  },
  modalAddBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    color: CALENDAR_PALETTE.surface,
  },
});
