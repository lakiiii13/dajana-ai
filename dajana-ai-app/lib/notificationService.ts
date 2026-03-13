// ===========================================
// DAJANA AI - Notification Service
// Push/local notifications, permissions,
// token registration, and deep linking
// ===========================================

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { hasSupabaseConfig, supabase } from './supabase';
import { useAuthStore } from '@/stores/authStore';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions and return the Expo push token.
 * Saves the token to Supabase `push_tokens` table for the current user.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!hasSupabaseConfig) {
      console.warn('[Notifications] Preskacem registraciju: Supabase nije podešen.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return null;
    }

    // Set notification channels for Android (DAJANA AI style – zlatna #CF8F5A)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('video-ready', {
        name: 'Video spreman',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#CF8F5A',
        sound: 'default',
      });
      await Notifications.setNotificationChannelAsync('dajana-announcements', {
        name: 'DAJANA AI',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 150, 200],
        lightColor: '#CF8F5A',
        sound: 'default',
      });
    }

    // projectId iz EAS / app.config – inače "cannot be inferred from manifest"
    const projectId =
      Constants.easConfig?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId ??
      null;

    if (!projectId) {
      console.warn('[Notifications] Push token nije dostupan: nedostaje EAS projectId.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync(
      { projectId }
    );
    const token = tokenData.data;
    console.log('[Notifications] Push token:', token);

    // Save to Supabase for future server-side use
    await savePushToken(token);

    return token;
  } catch (error: any) {
    const msg = error?.message ?? String(error);
    if (msg.includes('projectId') || msg.includes('manifest')) {
      console.warn('[Notifications] Push token nije dostupan (nedostaje projectId u app.json / EAS). Dodaj extra.eas.projectId u app.json ako koristiš push.');
    } else if (msg.includes('503') || msg.includes('SERVICE_UNAVAILABLE') || msg.includes('temporarily unavailable')) {
      console.warn('[Notifications] Expo server privremeno nedostupan (503). Notifikacije će raditi kad se server oporavi — probaj ponovo za nekoliko minuta.');
    } else {
      console.error('[Notifications] Registration error:', error);
    }
    return null;
  }
}

/**
 * Save push token to Supabase push_tokens table.
 */
async function savePushToken(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const isGuest = useAuthStore.getState().isGuest;
      if (!isGuest) {
        console.log('[Notifications] Obavestenja će biti dostupna nakon prijave.');
      }
      return;
    }

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token,
        platform: Platform.OS,
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Notifications] Token save error:', error.message, error.code, error.details);
    } else {
      console.log('[Notifications] Token sačuvan u Supabase za user', user.id);
    }
  } catch (e: any) {
    console.warn('[Notifications] Token save exception:', e?.message ?? e);
  }
}

const VIDEO_READY_TITLE = 'DAJANA AI';
const VIDEO_READY_BODY = 'Tvoj video je spreman! Pogledaj sada. ✨';

/**
 * Save a notification to the in-app inbox (user_notifications) so it appears in Notifikacije.
 */
export async function saveNotificationInbox(
  userId: string,
  payload: { type: 'video' | 'advice' | 'system' | 'outfit'; title: string; body: string }
): Promise<void> {
  try {
    const { error } = await supabase.from('user_notifications').insert({
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
    });
    if (error) console.warn('[Notifications] Inbox save error:', error.message);
  } catch (e: any) {
    console.warn('[Notifications] Inbox save exception:', e?.message ?? e);
  }
}

/**
 * Schedule an immediate local notification when a video is ready.
 * If userId is provided, also saves to in-app Notifikacije inbox.
 */
export async function notifyVideoReady(videoUri: string, userId?: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: VIDEO_READY_TITLE,
      body: VIDEO_READY_BODY,
      sound: 'default',
      data: { type: 'video-ready', videoUri },
      ...(Platform.OS === 'android' && { channelId: 'video-ready' }),
    },
    trigger: null, // immediate
  });
  if (userId) await saveNotificationInbox(userId, { type: 'video', title: VIDEO_READY_TITLE, body: VIDEO_READY_BODY });
  console.log('[Notifications] Video ready notification sent');
}

/**
 * Schedule an immediate local notification when video generation fails.
 */
export async function notifyVideoFailed(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DAJANA AI',
      body: 'Video generisanje nije uspelo. Pokušaj ponovo.',
      sound: 'default',
      data: { type: 'video-failed' },
      ...(Platform.OS === 'android' && { channelId: 'video-ready' }),
    },
    trigger: null,
  });
  console.log('[Notifications] Video failed notification sent');
}

/**
 * Add a listener for when the user taps on a notification.
 * Returns the subscription (caller should clean up).
 */
export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

/**
 * Check if app was opened from a notification (cold start).
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

/** In-app inbox: row from user_notifications */
export type InboxNotificationRow = {
  id: string;
  type: 'video' | 'advice' | 'system' | 'outfit';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

/**
 * Fetch current user's notifications for the Notifikacije screen (newest first).
 */
export async function getNotificationInbox(): Promise<InboxNotificationRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_notifications')
    .select('id, type, title, body, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[Notifications] Inbox fetch error:', error.message);
    return [];
  }
  return (data ?? []) as InboxNotificationRow[];
}

/**
 * Mark a notification as read in the inbox.
 */
export async function markNotificationRead(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('user_notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id);
}

/**
 * Clear all notifications for the current user (inbox empty).
 * Requires DELETE policy on user_notifications for auth.uid() = user_id.
 */
export async function clearAllNotifications(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.warn('[Notifications] Clear all error:', error.message);
    throw new Error(error.message);
  }
}
