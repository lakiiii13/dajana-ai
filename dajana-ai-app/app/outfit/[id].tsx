// ===========================================
// DAJANA AI - Outfit Detail Screen (Kapsula flow)
// Koristi shared OutfitDetailView
// ===========================================

import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import OutfitDetailView from '@/components/OutfitDetailView';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id || typeof id !== 'string') {
    return null;
  }

  return (
    <OutfitDetailView
      outfitId={id}
      onClose={() => router.back()}
      embedded={false}
    />
  );
}
