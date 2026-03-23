// ===========================================
// DAJANA AI - Onboarding Layout
// ===========================================

import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { setLanguage as setI18nLanguage } from '@/lib/i18n';

const LANGUAGE_PREF_KEY = '@dajana_language_preference';

export default function OnboardingLayout() {
  const { colors } = useTheme();
  const language = useAuthStore((s) => s.language);

  // Keep language in sync when entering onboarding (welcome choice must persist through entire flow)
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LANGUAGE_PREF_KEY);
      if (stored === 'sr' || stored === 'en') {
        setI18nLanguage(stored as 'sr' | 'en');
        useAuthStore.setState({ language: stored as 'sr' | 'en' });
      } else {
        setI18nLanguage(language);
      }
    })();
  }, [language]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8F4EF' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="measurements" />
      <Stack.Screen name="body-type" />
      <Stack.Screen name="analysis-question" />
      <Stack.Screen name="season" />
      <Stack.Screen name="complete" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
