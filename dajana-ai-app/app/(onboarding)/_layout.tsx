// ===========================================
// DAJANA AI - Onboarding Layout
// ===========================================

import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function OnboardingLayout() {
  const { colors } = useTheme();
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
    </Stack>
  );
}
