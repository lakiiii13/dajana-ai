import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Google Fonts
import {
  JosefinSans_100Thin,
  JosefinSans_300Light,
  JosefinSans_400Regular,
  JosefinSans_500Medium,
  JosefinSans_600SemiBold,
  JosefinSans_700Bold,
} from '@expo-google-fonts/josefin-sans';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import { Allura_400Regular } from '@expo-google-fonts/allura';

import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { SplashContent } from '@/components/SplashContent';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useVideoStore } from '@/stores/videoStore';
import { useAuthStore } from '@/stores/authStore';
import { registerForPushNotifications, notifyVideoReady, notifyVideoFailed, addNotificationResponseListener, getLastNotificationResponse } from '@/lib/notificationService';
import { FONTS, COLORS } from '@/constants/theme';
import { t } from '@/lib/i18n';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const splashHidden = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    // Arquitecta (primarni) – dok klijent ne dostavi .ttf, alias na Josefin Sans
    ArquitectaThin: JosefinSans_100Thin,
    ArquitectaLight: JosefinSans_300Light,
    ArquitectaRegular: JosefinSans_400Regular,
    ArquitectaMedium: JosefinSans_500Medium,
    ArquitectaSemibold: JosefinSans_600SemiBold,
    ArquitectaBold: JosefinSans_700Bold,
    // Canela (naslovi) – dok klijent ne dostavi .ttf, alias na Playfair Display
    CanelaRegular: PlayfairDisplay_400Regular,
    CanelaMedium: PlayfairDisplay_500Medium,
    CanelaSemibold: PlayfairDisplay_600SemiBold,
    CanelaBold: PlayfairDisplay_700Bold,
    CanelaItalic: PlayfairDisplay_400Regular_Italic,
    Allura_400Regular,
    'TGValtica': require('@/assets/fonts/TG Valtica.ttf'),
  });

  useEffect(() => {
    if (fontError) {
      console.error('Font loading error:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (!fontsLoaded || splashHidden.current) return;
    // Defer hide so native splash is registered (avoids "No native splash screen registered" on iOS)
    const id = setTimeout(() => {
      if (splashHidden.current) return;
      splashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }, 100);
    return () => clearTimeout(id);
  }, [fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const SPLASH_DURATION_MS = 3500;
let splashEverCompleted = false;

function RootLayoutNav() {
  const { isAuthenticated, isGuest, isLoading, isInitialized, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(splashEverCompleted);
  const { colors, mode } = useTheme();

  useEffect(() => {
    if (splashEverCompleted) return;
    const t = setTimeout(() => {
      splashEverCompleted = true;
      setSplashDone(true);
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  const needsOnboarding = isAuthenticated && (!profile || !profile.body_type);

  useEffect(() => {
    if (!splashDone || !isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !isGuest) {
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    } else if (isGuest) {
      // Gost sme (tabs) Home ili (auth) – nazad sa Home vodi na intro, pa izlazak
      if (!inTabsGroup && !inAuthGroup) {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && needsOnboarding) {
      // User logged in but needs onboarding - start onboarding
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/measurements');
      }
      // If already in onboarding, let them continue naturally (don't redirect)
    } else {
      // User logged in and has body_type set
      // Only redirect to tabs if coming from auth screens
      // DON'T redirect if already in onboarding - let them complete it naturally
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
      // If in onboarding with body_type set, user is completing the flow - don't interrupt
    }
  }, [splashDone, isAuthenticated, isGuest, isInitialized, isLoading, segments, needsOnboarding]);

  if (!splashDone) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <SplashContent />
      </View>
    );
  }

  if (!isInitialized || isLoading) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
          <Stack.Screen name="outfit/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="try-on" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="outfit-preview" options={{ presentation: 'modal' }} />
          <Stack.Screen name="outfit-builder" options={{ presentation: 'modal' }} />
          <Stack.Screen name="video-generate" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="video-result" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
      </NavThemeProvider>
      {isAuthenticated && <VideoBackgroundPoller />}
      {isAuthenticated && <NotificationSetup />}
    </View>
  );
}

/* ==========================================
   Notification initialization
   ========================================== */

function NotificationSetup() {
  const router = useRouter();
  const { completeBackgroundJob } = useVideoStore();

  // Registruj push token (sa malim odmakom da session bude spreman) i pri povratku u app
  useEffect(() => {
    const run = () => {
      registerForPushNotifications();
    };
    const t = setTimeout(run, 800);
    import('@/lib/backgroundVideoTask').then(({ registerBackgroundVideoTask }) => registerBackgroundVideoTask());
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    function run() {
      registerForPushNotifications();
    }
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'video-ready' && data.videoUri) {
        completeBackgroundJob(data.videoUri as string);
        router.push('/video-result' as any);
      }
    });

    // Handle cold start from notification
    getLastNotificationResponse().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        if (data?.type === 'video-ready' && data.videoUri) {
          completeBackgroundJob(data.videoUri as string);
          setTimeout(() => router.push('/video-result' as any), 500);
        }
      }
    });

    return () => sub.remove();
  }, []);

  return null;
}

/* ==========================================
   Global video poller + floating indicator
   ========================================== */

const POLL_INTERVAL = 10_000;
const MAX_FOREGROUND_ATTEMPTS = 60;
const DARK = '#2C2A28';

function VideoBackgroundPoller() {
  const user = useAuthStore((s) => s.user);
  const backgroundJob = useVideoStore((s) => s.backgroundJob);
  const bgPollAttempt = useVideoStore((s) => s.bgPollAttempt);
  const setBgPollAttempt = useVideoStore((s) => s.setBgPollAttempt);
  const completeBackgroundJob = useVideoStore((s) => s.completeBackgroundJob);
  const clearBackgroundJob = useVideoStore((s) => s.clearBackgroundJob);
  const pollingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Restore background job from AsyncStorage on mount (lazy-load to avoid FileSystem at startup)
  useEffect(() => {
    (async () => {
      const { getBackgroundJob } = await import('@/lib/backgroundVideoTask');
      const stored = await getBackgroundJob();
      if (stored && !backgroundJob) {
        const uid = useAuthStore.getState().user?.id ?? stored.userId ?? '';
        useVideoStore.getState().startBackgroundJob({
          jobId: stored.jobId,
          userId: uid,
          sourceImageUrl: stored.sourceImageUrl,
          publicImageUrl: stored.publicImageUrl,
          prompt: stored.prompt,
          duration: stored.duration,
          startedAt: stored.startedAt,
        });
      }
    })();
  }, []);

  const pollOnce = useCallback(async () => {
    const job = useVideoStore.getState().backgroundJob;
    if (!job || pollingRef.current) return;

    pollingRef.current = true;
    const attempt = useVideoStore.getState().bgPollAttempt;

    try {
      const { getVideoResult, saveVideo } = await import('@/lib/videoService');
      const { clearBackgroundJob: clearBgJobStorage } = await import('@/lib/backgroundVideoTask');

      if (attempt >= MAX_FOREGROUND_ATTEMPTS) {
        console.log('[Poller] Max attempts reached, giving up');
        await notifyVideoFailed();
        await clearBgJobStorage();
        clearBackgroundJob();
        pollingRef.current = false;
        return;
      }

      const result = await getVideoResult(job.jobId);

      if (result.videoUrl) {
        console.log('[Poller] Video ready! Downloading...');
        const saved = await saveVideo(
          result.videoUrl,
          job.publicImageUrl,
          job.prompt,
          job.duration
        );
        if (user?.id) {
          const { logVideoGeneration } = await import('@/lib/generationLog');
          await logVideoGeneration(user.id, saved.uri);
        }
        await notifyVideoReady(saved.uri, user?.id ?? undefined);
        await clearBgJobStorage();
        completeBackgroundJob(saved.uri);
        router.push('/video-result' as any);
      } else {
        setBgPollAttempt(attempt + 1);
      }
    } catch (err) {
      console.error('[Poller] Error:', err);
    }

    pollingRef.current = false;
  }, []);

  // Foreground polling loop
  useEffect(() => {
    if (!backgroundJob) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    pollOnce();
    timerRef.current = setInterval(pollOnce, POLL_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [backgroundJob?.jobId]);

  // Resume polling when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useVideoStore.getState().backgroundJob) {
        pollOnce();
      }
    });
    return () => sub.remove();
  }, []);

  if (!backgroundJob) return null;

  return <FloatingVideoIndicator attempt={bgPollAttempt} duration={backgroundJob.duration} />;
}

/* ==========================================
   Floating mini-indicator pill
   ========================================== */

function FloatingVideoIndicator({ attempt, duration }: { attempt: number; duration: '5' | '10' }) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ scale: 0.8 + pulse.value * 0.4 }],
  }));

  const estimatedTotal = duration === '5' ? 18 : 30;
  const minutes = Math.max(1, Math.ceil((estimatedTotal - attempt) * 10 / 60));

  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={indicatorStyles.container}>
      <Animated.View style={[indicatorStyles.dot, dotStyle]} />
      <Ionicons name="videocam" size={14} color={COLORS.primary} />
      <Text style={indicatorStyles.text}>
        {attempt > 0 ? t('video.generating_min', { min: minutes }) : '...'}
      </Text>
    </Animated.View>
  );
}

const indicatorStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 58,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFCF9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.18)',
    zIndex: 9999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  text: {
    fontFamily: FONTS.primary.medium,
    fontSize: 12,
    color: DARK,
    letterSpacing: 0.3,
  },
});
