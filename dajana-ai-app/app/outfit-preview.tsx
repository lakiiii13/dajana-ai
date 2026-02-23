// ===========================================
// DAJANA AI - Outfit Preview
// Elegant cream/gold page: see selected items, choose Video or Slika
// ===========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTryOnStore } from '@/stores/tryOnStore';

const { width } = Dimensions.get('window');
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';
const CARD_BG = '#FFFCF9';

const THUMB_SIZE = (width - SPACING.lg * 2 - 14) / 2;

export default function OutfitPreviewScreen() {
  const outfitItems = useTryOnStore((s) => s.outfitItems);
  const removeOutfitItem = useTryOnStore((s) => s.removeOutfitItem);
  const clearOutfitItems = useTryOnStore((s) => s.clearOutfitItems);

  const handleBack = () => {
    router.back();
  };

  const handleGoToTryOn = () => {
    router.push('/try-on/upload');
  };

  const handleGoToVideo = () => {
    // Navigate to video generation with the first outfit item as source
    if (outfitItems.length > 0) {
      const { useVideoStore } = require('@/stores/videoStore');
      useVideoStore.getState().resetGeneration();
      useVideoStore.getState().setSource(outfitItems[0].imageUrl);
    }
    router.push('/video-generate' as any);
  };

  if (outfitItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyWrap}>
          <Ionicons name="shirt-outline" size={56} color={COLORS.gray[300]} />
          <Text style={styles.emptyText}>Nisi izabrala nijedan outfit</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleBack}>
            <Text style={styles.emptyBtnText}>Nazad</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tvoj izbor</Text>
          <View style={styles.headerAccent} />
        </View>
        <TouchableOpacity onPress={clearOutfitItems} activeOpacity={0.7}>
          <Text style={styles.clearText}>Obriši sve</Text>
        </TouchableOpacity>
      </View>

      {/* Items grid */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {outfitItems.map((item) => (
            <View key={item.id} style={styles.thumbCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.55)']}
                style={styles.thumbGradient}
              />
              {item.title && (
                <Text style={styles.thumbTitle} numberOfLines={1}>{item.title}</Text>
              )}
              <TouchableOpacity
                style={styles.thumbRemove}
                onPress={() => removeOutfitItem(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.countLabel}>
          {outfitItems.length} {outfitItems.length === 1 ? 'komad' : 'komada'} izabrano
        </Text>
      </ScrollView>

      {/* Action section */}
      <View style={styles.actionsSection}>
        <Text style={styles.actionsHeading}>Šta želiš da napraviš?</Text>

        <View style={styles.actionsRow}>
          {/* Slika / Try-On card */}
          <TouchableOpacity style={styles.actionCard} onPress={handleGoToTryOn} activeOpacity={0.85}>
            <View style={styles.actionIconWrap}>
              <Ionicons name="camera-outline" size={32} color={GOLD} />
            </View>
            <Text style={styles.actionTitle}>Slika</Text>
            <Text style={styles.actionSub}>AI Try-On fotografija</Text>
          </TouchableOpacity>

          {/* Video card */}
          <TouchableOpacity style={styles.actionCard} onPress={handleGoToVideo} activeOpacity={0.85}>
            <View style={[styles.actionIconWrap, styles.actionIconWrapVideo]}>
              <Ionicons name="videocam-outline" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.actionTitle}>Video</Text>
            <Text style={styles.actionSub}>5s AI animacija</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 22,
    color: DARK,
    letterSpacing: 1.5,
  },
  headerAccent: {
    width: 28,
    height: 2,
    backgroundColor: GOLD,
    marginTop: 6,
    borderRadius: 1,
  },
  clearText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 13,
    color: COLORS.gray[500],
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  thumbCard: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 1.25,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F0EBE3',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  thumbTitle: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 36,
    fontFamily: FONTS.heading.medium,
    fontSize: 13,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  thumbRemove: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLabel: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: SPACING.md,
    letterSpacing: 0.5,
  },
  actionsSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(207,143,90,0.15)',
  },
  actionsHeading: {
    fontFamily: FONTS.heading.medium,
    fontSize: 18,
    color: DARK,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  actionCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.12)',
  },
  actionIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GOLD + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionIconWrapVideo: {
    backgroundColor: GOLD,
  },
  actionTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 17,
    color: DARK,
    letterSpacing: 1,
  },
  actionSub: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: SPACING.md,
  },
  emptyBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: GOLD,
    borderRadius: 14,
  },
  emptyBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 14,
    color: COLORS.white,
  },
});
