// ===========================================
// DAJANA AI - Outfit detail view (shared: Kapsula + Ormar)
// Slika, opis, Sačuvaj, Napravi outfit, Isprobaj
// ===========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { fetchOutfitById, toggleSaveOutfit, OutfitWithSaved, ApiError } from '@/lib/api';
import { useTryOnStore } from '@/stores/tryOnStore';
import * as FileSystem from '@/lib/safeFileSystem';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.55;
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';
const CARD_BG = '#FFFCF9';

export type OutfitDetailViewProps = {
  outfitId: string;
  initialOutfit?: OutfitWithSaved | null;
  onClose: () => void;
  /** Ako true, ne koristi router za Isprobaj/Napravi – samo callback ili ostaje u istom flow-u */
  embedded?: boolean;
};

export default function OutfitDetailView({
  outfitId,
  initialOutfit = null,
  onClose,
  embedded = false,
}: OutfitDetailViewProps) {
  const { user } = useAuthStore();
  const [outfit, setOutfit] = useState<OutfitWithSaved | null>(initialOutfit ?? null);
  const [isLoading, setIsLoading] = useState(!initialOutfit);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOutfit = useCallback(async () => {
    if (!outfitId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchOutfitById(outfitId, user?.id);
      if (data) setOutfit(data);
      else setError(t('errors.not_found'));
    } catch (err) {
      console.error('Load outfit error:', err);
      if (err instanceof ApiError) setError(err.message);
      else setError(t('capsule.error_load'));
    } finally {
      setIsLoading(false);
    }
  }, [outfitId, user?.id]);

  useEffect(() => {
    if (initialOutfit && initialOutfit.id === outfitId) {
      setOutfit(initialOutfit);
      setIsLoading(false);
      return;
    }
    loadOutfit();
  }, [outfitId, initialOutfit, loadOutfit]);

  const handleToggleSave = async () => {
    if (!user?.id || !outfit || isSaving) return;
    setIsSaving(true);
    try {
      const newSavedState = await toggleSaveOutfit(user.id, outfit.id, !!outfit.is_saved);
      setOutfit((prev) => (prev ? { ...prev, is_saved: newSavedState } : null));
    } catch (err) {
      if (err instanceof ApiError) Alert.alert(t('error'), err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const itemCount = useTryOnStore((s) => s.outfitItems.length);
  const isInOutfit = useTryOnStore((s) => s.outfitItems.some((i) => i.id === outfitId));

  const handleAddToOutfit = () => {
    if (!outfit) return;
    if (!isInOutfit) {
      useTryOnStore.getState().addOutfitItem({
        id: outfit.id,
        imageUrl: outfit.image_url,
        title: outfit.title,
      });
    }
    if (embedded) onClose();
    router.push('/outfit-builder' as any);
  };

  const handleTryOn = () => {
    if (!outfit) return;
    if (itemCount === 0) {
      useTryOnStore.getState().addOutfitItem({
        id: outfit.id,
        imageUrl: outfit.image_url,
        title: outfit.title,
      });
    } else if (!isInOutfit) {
      useTryOnStore.getState().addOutfitItem({
        id: outfit.id,
        imageUrl: outfit.image_url,
        title: outfit.title,
      });
    }
    if (embedded) onClose();
    router.push('/outfit-preview' as any);
  };

  const handleShare = async () => {
    if (!outfit) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('error'), 'Sharing is not available on this device');
        return;
      }
      if (outfit.image_url) {
        const imageUrl = outfit.image_url;
        const fileExtension = (typeof imageUrl === 'string' ? imageUrl : '').split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `dajana-outfit-${outfit.id}.${fileExtension}`;
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;
        const downloadResult = await FileSystem.downloadAsync(imageUrl, filePath);
        if (downloadResult.status === 200) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: `image/${fileExtension}`,
            dialogTitle: outfit.title || 'DAJANA AI Outfit',
            UTI: `public.${fileExtension}`,
          });
        } else {
          Alert.alert(t('capsule.outfit.share'), `${outfit.title || t('capsule.title')} - DAJANA AI`);
        }
      } else {
        Alert.alert(t('capsule.outfit.share'), `${outfit.title || t('capsule.title')} - DAJANA AI`);
      }
    } catch (err) {
      Alert.alert(t('capsule.outfit.share'), `${outfit.title || t('capsule.title')} - DAJANA AI`);
    }
  };

  const getBodyTypeName = (bodyType: string) => t(`body_types.${bodyType}`);
  const getSeasonName = (season: string) => t(`seasons.${season}`);
  const hasValidImage = outfit?.image_url && !imageError;

  const handleBodyTypePress = (bodyType: string) => {
    if (embedded) onClose();
    router.push({ pathname: '/(tabs)/capsule', params: { body_type: bodyType } } as any);
  };
  const handleSeasonPress = (season: string) => {
    if (embedded) onClose();
    router.push({ pathname: '/(tabs)/capsule', params: { season } } as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={DARK} />
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !outfit) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={DARK} />
        </TouchableOpacity>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>{t('error')}</Text>
          <Text style={styles.errorText}>{error || t('errors.not_found')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadOutfit}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
            <Text style={styles.retryButtonText}>{t('errors.try_again')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.imageContainer}>
          {hasValidImage ? (
            <>
              <Image
                source={{ uri: outfit.image_url }}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator color={GOLD} size="large" />
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="shirt-outline" size={80} color={COLORS.gray[300]} />
              <Text style={styles.placeholderText}>{t('capsule.title')}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.closeButtonOverlay} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {outfit.title && <Text style={styles.title}>{outfit.title}</Text>}
          {outfit.description && <Text style={styles.description}>{outfit.description}</Text>}
          {outfit.body_types && outfit.body_types.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('capsule.outfit.for_body_types').toUpperCase()}</Text>
              <View style={styles.tagsContainer}>
                {outfit.body_types.map((bodyType) => (
                  <TouchableOpacity
                    key={bodyType}
                    style={styles.tag}
                    onPress={() => handleBodyTypePress(bodyType)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tagText}>{getBodyTypeName(bodyType)}</Text>
                    <Ionicons name="arrow-forward-circle-outline" size={16} color={GOLD} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {outfit.seasons && outfit.seasons.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('capsule.outfit.for_seasons').toUpperCase()}</Text>
              <View style={styles.tagsContainer}>
                {outfit.seasons.map((season) => (
                  <TouchableOpacity
                    key={season}
                    style={[styles.tag, styles.seasonTag]}
                    onPress={() => handleSeasonPress(season)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tagText, styles.seasonTagText]}>{getSeasonName(season)}</Text>
                    <Ionicons name="arrow-forward-circle-outline" size={16} color={GOLD} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.saveButton, outfit.is_saved && styles.saveButtonActive]}
          onPress={handleToggleSave}
          disabled={isSaving || !user}
        >
          {isSaving ? (
            <ActivityIndicator color={outfit.is_saved ? COLORS.white : GOLD} size="small" />
          ) : (
            <Ionicons
              name={outfit.is_saved ? 'heart' : 'heart-outline'}
              size={22}
              color={outfit.is_saved ? COLORS.white : GOLD}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.addToOutfitButton} onPress={handleAddToOutfit}>
          <Ionicons name="layers-outline" size={20} color={GOLD} />
          <Text style={styles.addToOutfitText}>Napravi outfit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tryOnButton} onPress={handleTryOn}>
          <Text style={styles.tryOnButtonText}>Isprobaj{itemCount > 0 ? ` (${itemCount})` : ''}</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  scrollView: { flex: 1 },
  imageContainer: {
    width,
    height: IMAGE_HEIGHT,
    backgroundColor: '#F0EBE3',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F0EBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EBE3',
  },
  placeholderText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[400],
    marginTop: SPACING.sm,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  closeButtonOverlay: {
    position: 'absolute',
    top: SPACING.xl + 10,
    left: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: SPACING.xl + 10,
    right: SPACING.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    marginHorizontal: SPACING.lg,
    marginTop: -24,
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: SPACING.xl,
    paddingTop: SPACING.xl + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.08)',
  },
  title: {
    fontFamily: FONTS.heading.medium,
    fontSize: 26,
    color: DARK,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  description: {
    fontFamily: FONTS.primary.light,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[600],
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  section: { marginBottom: SPACING.lg },
  sectionLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: 11,
    color: COLORS.gray[500],
    letterSpacing: 1.8,
    marginBottom: SPACING.sm,
  },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: GOLD + '14',
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: GOLD + '30',
  },
  tagText: { fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.sm, color: GOLD },
  seasonTag: { backgroundColor: GOLD + '10', borderColor: GOLD + '25' },
  seasonTagText: { color: DARK },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: CREAM,
    borderTopWidth: 1,
    borderTopColor: 'rgba(207,143,90,0.12)',
    gap: SPACING.md,
  },
  saveButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  saveButtonActive: { backgroundColor: GOLD, borderColor: GOLD },
  addToOutfitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    gap: 6,
  },
  addToOutfitText: { fontFamily: FONTS.primary.semibold, fontSize: FONT_SIZES.sm, color: GOLD },
  tryOnButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: GOLD,
    borderRadius: 14,
    gap: 6,
  },
  tryOnButtonText: {
    fontFamily: FONTS.heading.medium,
    fontSize: 15,
    letterSpacing: 0.6,
    color: COLORS.white,
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[500],
    marginTop: SPACING.sm,
  },
  errorTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: FONT_SIZES.lg,
    color: DARK,
    marginTop: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: GOLD,
    borderRadius: 14,
  },
  retryButtonText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
});
