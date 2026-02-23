// ===========================================
// DAJANA AI - Try-On Upload Screen
// Krem pozadina, outfit u okviru, linija do sekcije Virtual Try-On
// Elegantna dugmad ispod slike: Fotografiši se + Iz galerije (zlatna ivica,
// krem/white bg, zaobljeni uglovi, actionIconWrap sa GOLD ikonom) – koristiti isti stil drugde.
// ===========================================

import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useTryOnStore } from '@/stores/tryOnStore';
import { useAuthStore } from '@/stores/authStore';
import { getUserCredits } from '@/lib/creditService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_AREA_HEIGHT = SCREEN_HEIGHT * 0.56;
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';

export default function TryOnUploadScreen() {
  const router = useRouter();
  const { outfitTitle, outfitImageUrl, outfitItems, setFaceImage } = useTryOnStore();
  const removeOutfitItem = useTryOnStore((s) => s.removeOutfitItem);
  const { user } = useAuthStore();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoFromCamera, setPhotoFromCamera] = useState(false); // selfi: prikaži kao u ogledalu
  const [isProcessing, setIsProcessing] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Load remaining credits
  useEffect(() => {
    if (user?.id) {
      getUserCredits(user.id).then((c) => setCreditsRemaining(c.imageCreditsRemaining)).catch(() => {});
    }
  }, [user?.id]);

  const handlePickFromGallery = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('error'), 'Potrebna je dozvola za pristup galeriji');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhotoFromCamera(false);
        if (asset.base64) {
          setFaceImage(asset.uri, asset.base64);
        }
      }
    } catch (err) {
      console.error('Gallery pick error:', err);
      Alert.alert(t('error'), 'Greška pri izboru slike');
    }
  }, [setFaceImage]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('error'), 'Potrebna je dozvola za kameru');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhotoFromCamera(true);
        if (asset.base64) {
          setFaceImage(asset.uri, asset.base64);
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert(t('error'), 'Greška pri fotografisanju');
    }
  }, [setFaceImage]);

  const handleContinue = useCallback(() => {
    if (!photoUri) {
      Alert.alert(t('error'), 'Molimo izaberite sliku');
      return;
    }
    router.push('/try-on/generating');
  }, [photoUri, router]);

  const handleBack = useCallback(() => {
    useTryOnStore.getState().reset();
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Virtual Try-On</Text>
            <Text style={styles.headerSubtitle}>{outfitTitle || 'Izabrani outfit'}</Text>
          </View>
          {creditsRemaining !== null ? (
            <View style={[styles.creditBadge, creditsRemaining <= 3 && styles.creditBadgeLow]}>
              <Ionicons name="camera-outline" size={14} color={creditsRemaining <= 3 ? COLORS.error : GOLD} />
              <Text style={[styles.creditBadgeText, creditsRemaining <= 3 && { color: COLORS.error }]}>{creditsRemaining}</Text>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Izabrana garderoba – uvek vidljiva traka, swipe + tekst */}
        {outfitItems.length >= 1 && (
          <View style={styles.itemsStrip}>
            <View style={styles.itemsStripHeader}>
              <Text style={styles.itemsStripTitle}>Tvoja izabrana garderoba</Text>
              {outfitItems.length > 1 && (
                <View style={styles.swipeHintRow}>
                  <Ionicons name="chevron-back" size={16} color={GOLD} style={{ transform: [{ scaleX: -1 }] }} />
                  <Text style={styles.itemsSwipeHint}>Swipe da vidiš sve komade</Text>
                  <Ionicons name="chevron-forward" size={16} color={GOLD} />
                </View>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.itemsScroll}
              style={styles.itemsScrollView}
            >
              {outfitItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} resizeMode="cover" />
                  <Text style={styles.itemName} numberOfLines={1}>{item.title || 'Outfit'}</Text>
                  <TouchableOpacity style={styles.itemRemoveBtn} onPress={() => removeOutfitItem(item.id)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.gray[400]} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Dodaj sliku – preko celog ekrana */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.photoArea}
            onPress={photoUri ? handlePickFromGallery : undefined}
            activeOpacity={photoUri ? 0.8 : 1}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={[styles.photoPreview, photoFromCamera && styles.photoPreviewMirror]}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={44} color={GOLD} />
                </View>
                <Text style={styles.placeholderTitle}>Dodaj svoju sliku</Text>
                <Text style={styles.placeholderSubtitle}>Fotografiši se ili izaberi iz galerije</Text>
              </View>
            )}
            <View style={styles.frameCornerTL} />
            <View style={styles.frameCornerTR} />
            <View style={styles.frameCornerBL} />
            <View style={styles.frameCornerBR} />
          </TouchableOpacity>

          {photoUri && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickFromGallery}>
              <Feather name="refresh-cw" size={14} color={GOLD} />
              <Text style={styles.changePhotoText}>Promeni sliku</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nema slike: Fotografiši se + Iz galerije. Ima sliku: samo Generiši */}
        {!photoUri ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto} activeOpacity={0.85}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="camera-outline" size={26} color={GOLD} />
              </View>
              <Text style={styles.actionLabel}>Fotografiši se</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handlePickFromGallery} activeOpacity={0.85}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="images-outline" size={26} color={GOLD} />
              </View>
              <Text style={styles.actionLabel}>Iz galerije</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.generateRow}>
            <TouchableOpacity style={styles.generateButton} onPress={handleContinue} disabled={isProcessing} activeOpacity={0.88}>
              {isProcessing ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.generateButtonText}>Generiši</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.gray[500]} />
          <Text style={styles.infoText}>Jasna slika lica daje najbolji rezultat.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_WIDTH = 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.heading.bold,
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.regular,
    marginTop: 2,
    color: COLORS.gray[600],
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
    backgroundColor: `${GOLD}12`,
  },
  creditBadgeLow: {
    borderColor: `${COLORS.error}50`,
    backgroundColor: `${COLORS.error}15`,
  },
  creditBadgeText: {
    fontFamily: FONTS.heading.bold,
    fontSize: 12,
    letterSpacing: 0.2,
    color: COLORS.primary,
  },

  itemsStrip: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#FFFCF9',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${GOLD}40`,
    minHeight: 88,
  },
  itemsStripHeader: {
    marginBottom: 10,
  },
  itemsStripTitle: {
    fontSize: 14,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  swipeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsSwipeHint: {
    fontSize: 13,
    fontFamily: FONTS.primary.medium,
    color: GOLD,
  },
  itemsScrollView: {
    marginHorizontal: -4,
  },
  itemsScroll: {
    gap: 12,
    paddingRight: SPACING.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFCF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${GOLD}30`,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    gap: 8,
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  itemName: {
    fontFamily: FONTS.primary.medium,
    fontSize: 13,
    maxWidth: 100,
    color: COLORS.primary,
  },
  itemRemoveBtn: {
    padding: 2,
  },

  photoSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    alignItems: 'center',
  },
  photoArea: {
    width: '100%',
    height: PHOTO_AREA_HEIGHT,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: `${GOLD}45`,
    backgroundColor: '#FFFCF9',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  photoPreviewMirror: {
    transform: [{ scaleX: -1 }],
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: `${GOLD}50`,
    backgroundColor: `${GOLD}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  placeholderTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary.semibold,
    marginBottom: SPACING.xs,
    color: COLORS.primary,
  },
  placeholderSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
  },
  frameCornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: GOLD,
    borderTopLeftRadius: 4,
  },
  frameCornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: GOLD,
    borderTopRightRadius: 4,
  },
  frameCornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: GOLD,
    borderBottomLeftRadius: 4,
  },
  frameCornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: GOLD,
    borderBottomRightRadius: 4,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
    gap: 6,
    borderWidth: 1,
    borderColor: `${GOLD}40`,
    backgroundColor: `${GOLD}08`,
  },
  changePhotoText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.medium,
    color: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: `${GOLD}55`,
    backgroundColor: '#FFFCF9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    backgroundColor: `${GOLD}12`,
    borderWidth: 1,
    borderColor: `${GOLD}25`,
  },
  actionLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  generateRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    alignItems: 'center',
  },
  generateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl + 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E2DA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  generateButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.heading.semibold,
    color: '#8B7355',
    letterSpacing: 0.8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.regular,
    lineHeight: 18,
    color: COLORS.gray[600],
  },
});
