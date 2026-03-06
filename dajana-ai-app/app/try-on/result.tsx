// ===========================================
// DAJANA AI - Try-On Result Screen
// Krem pozadina. Slika: fullscreen → zatim u okvir. Linije povezuju okvir sa dugmadima.
// ===========================================

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Alert,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { AppLogo } from '@/components/AppLogo';
import { useTryOnStore } from '@/stores/tryOnStore';
import { t } from '@/lib/i18n';

const { width: W, height: H } = Dimensions.get('window');
const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';

export default function TryOnResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    generatedImageBase64,
    generatedImageUri,
    outfitImageUrl,
    outfitTitle,
    outfitItems,
    error,
    reset,
  } = useTryOnStore();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const uiOpacity = useRef(new Animated.Value(0)).current;
  const uiTranslateY = useRef(new Animated.Value(20)).current;
  const [isSaved, setIsSaved] = useState(false);
  const hasMultipleOutfitItems = outfitItems.length > 1;

  const hasResult = !!generatedImageBase64;
  const imageUri = generatedImageBase64
    ? `data:image/png;base64,${generatedImageBase64}`
    : null;

  useEffect(() => {
    if (!hasResult) return;
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.parallel([
      Animated.timing(uiOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(uiTranslateY, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [hasResult]);

  const handleDone = useCallback(() => {
    reset();
    router.dismissAll();
  }, [reset, router]);

  const handleGoHome = useCallback(() => {
    reset();
    router.dismissAll();
    setTimeout(() => router.replace('/(tabs)'), 200);
  }, [reset, router]);

  const handleTryAgain = useCallback(() => {
    useTryOnStore.setState({
      generatedImageBase64: null,
      generatedImageUri: null,
      faceImageUri: null,
      faceImageBase64: null,
      error: null,
    });
    router.replace('/try-on/upload');
  }, [router]);

  const handleShare = useCallback(async () => {
    if (!generatedImageUri) return;
    try {
      const ok = await Sharing.isAvailableAsync();
      if (ok) {
        await Sharing.shareAsync(generatedImageUri, {
          mimeType: 'image/png',
          dialogTitle: 'DAJANA AI',
        });
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [generatedImageUri]);

  const handleGoToVideo = useCallback(() => {
    const { useVideoStore } = require('@/stores/videoStore');
    useVideoStore.getState().resetGeneration();
    if (imageUri) {
      useVideoStore.getState().setSource(imageUri);
    }
    router.dismissAll();
    setTimeout(() => router.push('/video-generate' as any), 200);
  }, [router, imageUri]);

  const handleAskDajana = useCallback(() => {
    router.dismissAll();
    setTimeout(() => router.push('/(tabs)/ai-advice'), 300);
  }, [router]);

  const handleSave = useCallback(() => {
    if (isSaved) return;
    setIsSaved(true);
    Alert.alert('Sačuvano', 'Slika je sačuvana.');
  }, [isSaved]);

  if (error && !hasResult) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.errorWrap, { paddingTop: insets.top }]}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle-outline" size={56} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>Generisanje nije uspelo</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleTryAgain}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.white} />
            <Text style={styles.retryText}>Pokušaj ponovo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDone} style={{ marginTop: 16 }}>
            <Text style={styles.linkText}>Nazad</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar – close levo, logo u desni ugao */}
      <Animated.View style={[styles.topBar, { paddingTop: insets.top + 8, opacity: fadeIn }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={handleDone} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={DARK} />
        </TouchableOpacity>
        <View style={styles.brandWrapRight}>
          <AppLogo height={28} maxWidth={140} />
        </View>
      </Animated.View>

      {/* Vertikalni swipe: prva strana = rezultat, druga = outfit koji je izabrao */}
      <View style={[styles.imageWrap, styles.imageWrapFullScreen]}>
        {!imageUri ? (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={64} color={COLORS.gray[200]} />
          </View>
        ) : (
          <ScrollView
            style={styles.verticalPager}
            contentContainerStyle={styles.verticalPagerContent}
            pagingEnabled
            snapToInterval={H}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
          >
            {/* Strana 1: puna slika try-on rezultata */}
            <View style={[styles.pagerPage, { height: H }]}>
              <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="cover" />
              <View style={styles.swipeUpHint} pointerEvents="none">
                <Ionicons name="chevron-up" size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.swipeUpHintText}>Swipe ka gore da vidiš outfit koji si izabrala</Text>
              </View>
            </View>
            {/* Strana 2: outfit slika(e) */}
            <View style={[styles.pagerPage, { height: H }]}>
              {hasMultipleOutfitItems ? (
                <>
                  <FlatList
                    data={outfitItems}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={true}
                    style={styles.outfitPagerList}
                    contentContainerStyle={[styles.outfitPagerContent, { width: W * outfitItems.length }]}
                    renderItem={({ item }) => (
                      <View style={[styles.outfitPagerSlide, { width: W, height: H }]}>
                        <Image source={{ uri: item.imageUrl }} style={styles.fullImage} resizeMode="contain" />
                        {item.title ? (
                          <View style={styles.outfitPagerLabel}>
                            <Text style={styles.outfitPagerLabelText} numberOfLines={1}>{item.title}</Text>
                          </View>
                        ) : null}
                      </View>
                    )}
                  />
                  <View style={styles.outfitPageHint}>
                    <Text style={styles.outfitPageHintText}>Outfit koji si izabrala</Text>
                  </View>
                </>
              ) : outfitImageUrl ? (
                <>
                  <Image source={{ uri: outfitImageUrl }} style={styles.fullImage} resizeMode="contain" />
                  <View style={styles.outfitPageHint}>
                    <Text style={styles.outfitPageHintText}>Outfit koji si izabrala</Text>
                  </View>
                </>
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="shirt-outline" size={48} color={GOLD} />
                  <Text style={styles.comparisonPlaceholderText}>Outfit</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Desna strana: Sačuvaj, Video, Dajana, Podeli — kao u video sekciji */}
      <Animated.View
        style={[
          styles.sideCol,
          {
            paddingBottom: insets.bottom + 80,
            opacity: uiOpacity,
            transform: [{ translateY: uiTranslateY }],
          },
        ]}
      >
        <TouchableOpacity style={styles.sideBtn} onPress={handleSave} activeOpacity={0.85}>
          <View style={[styles.sideCircle, isSaved && styles.sideCircleActive]}>
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={20}
              color={isSaved ? GOLD : DARK}
            />
          </View>
          <Text style={styles.sideBtnLabel}>{isSaved ? t('capsule.outfit.saved') : t('capsule.outfit.save')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={handleGoToVideo} activeOpacity={0.85}>
          <View style={styles.sideCircle}>
            <Ionicons name="videocam-outline" size={20} color={DARK} />
          </View>
          <Text style={styles.sideBtnLabel}>{t('tabs.videos')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={handleAskDajana} activeOpacity={0.85}>
          <View style={styles.sideCircle}>
            <Text style={styles.sideCircleD}>D</Text>
          </View>
          <Text style={styles.sideBtnLabel}>{t('tabs.ai_advice')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sideBtn} onPress={handleShare} activeOpacity={0.85}>
          <View style={styles.sideCircle}>
            <Ionicons name="share-outline" size={20} color={DARK} />
          </View>
          <Text style={styles.sideBtnLabel}>{t('capsule.outfit.share')}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Donji red — manja, elegantna dugmad Ponovo + Početna */}
      <Animated.View
        style={[
          styles.bottomRow,
          {
            paddingBottom: insets.bottom + SPACING.md,
            opacity: uiOpacity,
            transform: [{ translateY: uiTranslateY }],
          },
        ]}
      >
        <View style={styles.bottomRowInner}>
          <TouchableOpacity style={styles.bottomChip} onPress={handleTryAgain} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={16} color={DARK} />
            <Text style={styles.bottomChipText}>{t('try_on.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomChip} onPress={handleGoHome} activeOpacity={0.85}>
            <Ionicons name="home-outline" size={16} color={DARK} />
            <Text style={styles.bottomChipText}>{t('tabs.home')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  errorContainer: {
    backgroundColor: CREAM,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${GOLD}20`,
  },
  brandWrap: {
    flex: 1,
    alignItems: 'center',
    marginRight: 38,
  },
  brandWrapRight: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  imageWrap: {
    position: 'absolute',
    backgroundColor: COLORS.gray[100],
  },
  imageWrapFullScreen: {
    top: 0,
    left: 0,
    width: W,
    height: H,
    overflow: 'hidden',
  },
  verticalPager: {
    flex: 1,
    width: W,
    height: H,
  },
  verticalPagerContent: {
    height: H * 2,
  },
  pagerPage: {
    width: W,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  swipeUpHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeUpHintText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
  },
  outfitPagerList: {
    flex: 1,
    width: W,
  },
  outfitPagerContent: {
    height: H,
  },
  outfitPagerSlide: {
    overflow: 'hidden',
  },
  outfitPagerLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  outfitPagerLabelText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
  outfitPageHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outfitPageHintText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
  },
  comparisonPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,244,239,0.5)',
  },
  comparisonPlaceholderText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 14,
    color: GOLD,
    marginTop: 8,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideCol: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 0,
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
  sideBtn: {
    alignItems: 'center',
    gap: 4,
  },
  sideCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFCF9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${GOLD}40`,
  },
  sideCircleActive: {
    backgroundColor: `${GOLD}18`,
    borderColor: GOLD,
  },
  sideCircleD: {
    fontFamily: FONTS.heading.bold,
    fontSize: 16,
    color: DARK,
  },
  sideBtnLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: 10,
    color: DARK,
    letterSpacing: 0.2,
  },
  bottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bottomRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: 'rgba(44,42,40,0.12)',
  },
  bottomChipText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 13,
    color: DARK,
    letterSpacing: 0.3,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${COLORS.error}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontFamily: FONTS.heading.bold,
    fontSize: FONT_SIZES.xl,
    color: DARK,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorSub: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: GOLD,
    borderRadius: 14,
    gap: SPACING.sm,
  },
  retryText: {
    fontFamily: FONTS.primary.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  linkText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[500],
  },
});
