// ==========================================
// DAJANA AI - Notifikacije
// Lista notifikacija iz baze (video spreman, Dajana iz admina, sistem)
// ===========================================

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { getNotificationInbox, markNotificationRead, clearAllNotifications, type InboxNotificationRow } from '@/lib/notificationService';
import { t, getLanguage } from '@/lib/i18n';
import { getSavedVideos } from '@/lib/videoService';
import { useVideoStore } from '@/stores/videoStore';
import { useAuthStore } from '@/stores/authStore';

export type NotificationItem = {
  id: string;
  type: 'outfit' | 'video' | 'advice' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
};

function formatTime(createdAt: string): string {
  const d = new Date(createdAt);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const locale = getLanguage() === 'en' ? 'en-US' : 'sr-RS';
  if (d.toDateString() === today) {
    return `${t('notifications.today')}, ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `${t('notifications.yesterday')}, ${d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function isI18nKey(s: string): boolean {
  return typeof s === 'string' && (s.startsWith('notifications.') || s.startsWith('profile.'));
}

function mapInboxToItem(row: InboxNotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    time: formatTime(row.created_at),
    read: row.read,
  };
}

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadInbox = useCallback(async () => {
    const rows = await getNotificationInbox();
    setNotifications(Array.isArray(rows) ? rows.map(mapInboxToItem) : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInbox();
    }, [loadInbox])
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInbox();
    setRefreshing(false);
  }, [loadInbox]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationRead(id);
  }, []);

  const handleNotificationPress = useCallback(async (item: NotificationItem) => {
    markAsRead(item.id);

    if (item.type === 'video') {
      try {
        const uid = useAuthStore.getState().user?.id ?? useAuthStore.getState().profile?.id ?? '';
        const videos = await getSavedVideos(uid);
        const latestVideo = Array.isArray(videos) ? videos[0] : null;

        if (latestVideo) {
          useVideoStore.getState().setResultVideo(latestVideo.uri);
          useVideoStore.getState().setSource(latestVideo.sourceImageUrl);
          useVideoStore.getState().setPrompt(latestVideo.prompt);
          useVideoStore.getState().setDuration(latestVideo.duration);
          router.push('/video-result' as any);
          return;
        }
      } catch (e) {
        console.warn('[Notifications] Failed to open latest video', e);
      }

      router.push('/(tabs)/videos' as any);
      return;
    }
  }, [markAsRead, router]);

  const handleClearAll = useCallback(async () => {
    if (notifications.length === 0) return;
    setClearing(true);
    try {
      await clearAllNotifications();
      setNotifications([]);
    } catch (e) {
      console.warn('[Notifications] Clear failed', e);
    } finally {
      setClearing(false);
    }
  }, [notifications.length]);

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
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            maxFontSizeMultiplier={1.2}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            {t('notifications.title')}
          </Text>
          {unreadCount > 0 && (
            <Text style={styles.headerBadge}>{unreadCount} {t('notifications.new_count')}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: colors.gray[100] }]}
              onPress={handleClearAll}
              disabled={clearing}
              activeOpacity={0.7}
            >
              <Feather name="trash-2" size={18} color={colors.text} />
              <Text style={[styles.clearBtnText, { color: colors.text }]}>
                {t('notifications.clear')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('notifications.empty_title')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {t('notifications.empty_subtitle')}
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
              onPress={() => handleNotificationPress(item)}
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
                  {isI18nKey(item.title) ? t(item.title) : item.title}
                </Text>
                <Text style={[styles.cardText, { color: colors.textSecondary }]} numberOfLines={2}>
                  {isI18nKey(item.body) ? t(item.body) : item.body}
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
    // Arquitecta: š/ć/č/đ u istoj visini kao ostala slova (Canela bold često deformiše dijakritike)
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.lg,
    letterSpacing: 0.35,
  },
  headerBadge: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 44,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  clearBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 13,
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
    backgroundColor: COLORS.primary,
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
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xs,
    letterSpacing: 0.35,
  },
  emptySub: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
