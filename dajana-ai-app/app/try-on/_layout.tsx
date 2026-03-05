// ===========================================
// DAJANA AI - Try-On Flow Layout
// ===========================================

import { Stack } from 'expo-router';

export default function TryOnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="generating" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
