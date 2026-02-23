// ===========================================
// DAJANA AI - Kapsula tab layout
// index → CapsuleChoiceScreen (split)
// table-builder → TableBuilderScreen (KAPSULA)
// closet → ClosetScreen (ORMAR)
// browse → stari outfit browser (iz DB)
// ===========================================

import { Stack } from 'expo-router';

export default function CapsuleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="table-builder" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="closet" options={{ animation: 'slide_from_left' }} />
      <Stack.Screen name="browse" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
