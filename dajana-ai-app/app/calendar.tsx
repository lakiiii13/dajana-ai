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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { AppLogo } from '@/components/AppLogo';
import { getSavedOutfits, SavedOutfit } from '@/lib/tryOnService';
import { useAuthStore } from '@/stores/authStore';
import { useTryOnStore } from '@/stores/tryOnStore';

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

const MONTH_KEYS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'] as const;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
function getMonthNames(): string[] {
  return MONTH_KEYS.map((k) => t(`calendar.${k}`));
}
function getDayNames(): string[] {
  return DAY_KEYS.map((k) => t(`calendar.${k}`));
}

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

  const horizontalPadding = SPACING.lg * 2;
  const gridWidth = screenWidth - horizontalPadding;
  const cellWidth = gridWidth / 7;

  // Load outfits on focus
  const currentUserId = useAuthStore((s) => s.user?.id ?? s.profile?.id ?? '');
  const loadOutfits = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await getSavedOutfits(currentUserId);
      setSavedOutfits(data);
    } catch (err) {
      console.error('Error loading outfits for calendar:', err);
    }
  }, [currentUserId]);

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

  const monthNames = getMonthNames();
  const monthLabel = `${monthNames[current.month]} ${current.year}`;

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

  const setOutfitTargetDate = useTryOnStore((s) => s.setOutfitTargetDate);

  const handleCellPress = (cell: { day: number; isCurrentMonth: boolean; date: Date }) => {
    const key = dateKey(cell.date);
    const dayOutfits = outfitsByDate[key];
    if (dayOutfits && dayOutfits.length > 0) {
      router.push({ pathname: '/calendar-day', params: { date: key } } as any);
    } else {
      setOutfitTargetDate(key);
      router.push('/(tabs)/capsule');
    }
  };

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
          <Text style={[styles.tagline, { color: CALENDAR_PALETTE.gold }]}>{t('auth.your_personal_stylist')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <Text style={[styles.calendarIntro, { color: CALENDAR_PALETTE.gray }]}>
        {t('calendar.subtitle')}
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
        {getDayNames().map((day) => (
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
              const outfitCountLabel = dayOutfits.length > 9 ? '9+' : String(dayOutfits.length);

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

                  {hasOutfit ? (
                    <View style={styles.countWrap}>
                      <View
                        style={[
                          styles.countBadge,
                          today && styles.countBadgeToday,
                        ]}
                      >
                        <Text style={[styles.countBadgeText, today && styles.countBadgeTextToday]}>
                          {outfitCountLabel}
                        </Text>
                      </View>
                      <Text style={styles.countLabel} numberOfLines={1}>
                        {dayOutfits.length === 1 ? t('calendar.outfit_one') : t('calendar.outfit_many')}
                      </Text>
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
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
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
  countWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    backgroundColor: CALENDAR_PALETTE.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeToday: {
    backgroundColor: CALENDAR_PALETTE.gold,
  },
  countBadgeText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 14,
    color: CALENDAR_PALETTE.black,
  },
  countBadgeTextToday: {
    color: CALENDAR_PALETTE.surface,
  },
  countLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: 9,
    color: CALENDAR_PALETTE.gray,
    marginTop: 4,
    alignItems: 'center',
    textAlign: 'center',
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
});
