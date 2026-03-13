import React from 'react';
import { Stack } from 'expo-router';

export default function VideoGenerateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 180,
        animationTypeForReplace: 'pop',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="source" />
      <Stack.Screen name="prompt" />
      <Stack.Screen name="duration" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
