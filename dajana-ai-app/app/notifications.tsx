// ==========================================
// DAJANA AI - Notifikacije
// Lista prethodnih notifikacija
// ===========================================

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';

export type NotificationItem = {
  id: string;
  type: 'outfit' | 'video' | 'advice' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
};

// Primer notifikacija (kasnije zameniti API-jem)
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'outfit',
    title: 'Novi outfit za tebe',
    body: 'Pogledaj preporučene kombinacije u Kapsuli.',
    time: 'Danas, 14:32',
    read: false,
  },
  {
    id: '2',
    type: 'video',
    title: 'Video je spreman',
    body: 'Tvoj AI video je generisan. Pogledaj u sekciji Video.',
    time: 'Juče, 18:20',
    read: true,
  },
  {
    id: '3',
    type: 'advice',
    title: 'Mišljenje od Dajane',
    body: 'Dajana je pregledala tvoj outfit i ostavila savet.',
    time: 'Juče, 12:15',
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'Dobrodošli u DAJANA AI',
    body: 'Izaberi outfit u Kapsuli i isprobaj ga uz AI.',
    time: '9. feb 2026.',
    read: true,
  },
];

function getIconForType(type: NotificationItem['type']) {
  switch (type) {
    case 'outfit': return 'shopping-bag';
    case 'video': return 'video';
    case 'advice': return 'message-circle';
    default: return 'bell';
  }
}

function getIconColor(type: NotificationItem['type']) {
  switch (type) {
    case 'outfit': return COLORS.primary;
    case 'video': return '#1A1A1A';
    case 'advice': return COLORS.secondary;
    default: return COLORS.gray[500];
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulacija osvežavanja
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.gray[100] }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifikacije</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerBadge}>{unreadCount} nove</Text>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.gray[100] }]}>
              <Feather name="bell" size={48} color={colors.gray[400]} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nema notifikacija</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Kada budemo imali vesti za tebe, pojaviće se ovde.
            </Text>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: item.read ? colors.surface : `${COLORS.secondary}08`,
                  borderColor: colors.gray[200],
                },
              ]}
              activeOpacity={0.8}
              onPress={() => markAsRead(item.id)}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${getIconColor(item.type)}14` }]}>
                <Feather
                  name={getIconForType(item.type) as any}
                  size={20}
                  color={getIconColor(item.type)}
                />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{item.time}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    letterSpacing: 0.5,
  },
  headerBadge: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    marginBottom: 2,
  },
  cardText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  cardTime: {
    fontFamily: FONTS.primary.regular,
    fontSize: 11,
    opacity: 0.8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginTop: 6,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xs,
  },
  emptySub: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
