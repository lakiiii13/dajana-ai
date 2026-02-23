// ===========================================
// DAJANA AI - Notification Service
// Push/local notifications, permissions,
// token registration, and deep linking
// ===========================================

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

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

    // Set notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('video-ready', {
        name: 'Video spreman',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#CF8F5A',
        sound: 'default',
      });
    }

    // projectId iz EAS / app.config – inače "cannot be inferred from manifest"
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
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
    if (!user) return;

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: user.id,
        token,
        platform: Platform.OS,
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Notifications] Token save error:', error.message);
    } else {
      console.log('[Notifications] Token saved to Supabase');
    }
  } catch (e) {
    console.warn('[Notifications] Token save exception:', e);
  }
}

/**
 * Schedule an immediate local notification when a video is ready.
 */
export async function notifyVideoReady(videoUri: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'DAJANA AI',
      body: 'Tvoj video je spreman! Pogledaj sada. ✨',
      sound: 'default',
      data: { type: 'video-ready', videoUri },
      ...(Platform.OS === 'android' && { channelId: 'video-ready' }),
    },
    trigger: null, // immediate
  });
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
