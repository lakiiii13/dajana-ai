// ===========================================
// DAJANA AI - ClosetScreen
// Ormar: Entrance video → Virtual Closet panel (frosted glass, one outfit per card)
// ===========================================

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut, useSharedValue, useAnimatedProps, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FONTS } from '@/constants/theme';
import { useTryOnStore } from '@/stores/tryOnStore';
import { useVideoPlayer, VideoView } from 'expo-video';
import { t } from '@/lib/i18n';
import Svg, { Path, Circle } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: W, height: H } = Dimensions.get('window');

const LINE_DURATION_MS = 320;

function IsprobajButtonAnimated({
  onPress,
  containerStyle,
  textStyle,
  children,
}: {
  onPress: () => void;
  containerStyle: object;
  textStyle: object;
  children: string;
}) {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [scale]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <TouchableOpacity style={styles.modalIsprobajBtnTouchable} onPress={onPress} activeOpacity={0.85}>
        <Text style={textStyle}>{children}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ConnectorLineSmooth({ currentCardIndex, insets }: { currentCardIndex: number; insets: { top: number } }) {
  const ofingerTop = 92;
  const lineStartY = insets.top + ofingerTop + 64;
  const panelTop = H * 0.38;
  const lineH = panelTop - lineStartY;
  const cx = W / 2;
  const ctrlOffset = 42;
  const midY = lineH / 2;

  const ctrlX = useSharedValue(cx);

  React.useEffect(() => {
    const mod = currentCardIndex % 3;
    const target = mod === 0 ? cx - ctrlOffset : mod === 1 ? cx : cx + ctrlOffset;
    ctrlX.value = withTiming(target, {
      duration: LINE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentCardIndex]);

  const animatedProps = useAnimatedProps(() => ({
    d: `M ${cx} 0 Q ${ctrlX.value} ${midY} ${cx} ${lineH}`,
  }));

  return (
    <View style={[styles.connectorLineWrap, { top: lineStartY, height: lineH }]} pointerEvents="none">
      <Svg width={W} height={lineH} style={styles.connectorSvg}>
        <AnimatedPath animatedProps={animatedProps} stroke={LINE_WHITE} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Circle cx={cx} cy={0} r={4} fill={LINE_WHITE} />
      </Svg>
    </View>
  );
}

const CLOSET_IMG = require('@/assets/images/slika_za_kapsulu.jpg');
const VIDEO_ANIMATION = require('@/assets/videos/ulazak_u_ormar.mp4');

const GOLD = '#CF8F5A';
const CREAM = '#F8F4EF';
const DARK = '#1A1A1A';
const PANEL_BG_GLASS = 'rgba(255, 252, 249, 0.72)';
const LINE_WHITE = 'rgba(255,255,255,0.9)';
const CARD_BG_BEIGE = '#F5F0E8';
const CARD_BG_GREY = '#F0EEEA';
const CLOSET_VIDEO_MAX_MS = 2500;

// Hotspots on the closet image
const FULL_OUTFITS = [
  { id: '1', title: 'Peščani sat + prava jesen', image: require('@/assets/images/outfits/hourglass_warm_autumn/Screenshot 2026-02-18 at 11.57.22.png'), top: H * 0.35, left: W * 0.15 },
  { id: '2', title: 'Peščani sat + prava zima', image: require('@/assets/images/outfits/hourglass_cool_winter/Screenshot 2026-02-18 at 11.47.57.png'), top: H * 0.35, left: W * 0.38 },
  { id: '3', title: 'Peščani sat + pravo ljeto', image: require('@/assets/images/outfits/hourglass_cool_summer/Screenshot 2026-02-18 at 11.45.49.png'), top: H * 0.35, left: W * 0.65 },
  { id: '4', title: 'Peščani sat + sjajna zima', image: require('@/assets/images/outfits/hourglass_clear_winter/Screenshot 2026-02-18 at 11.52.29.png'), top: H * 0.35, left: W * 0.85 },
  { id: '5', title: 'Kašika + meka jesen', image: require('@/assets/images/outfits/pear_soft_autumn/Screenshot 2026-02-18 at 11.39.31.png'), top: H * 0.55, left: W * 0.15 },
  { id: '6', title: 'Kašika + prava jesen', image: require('@/assets/images/outfits/pear_warm_autumn_kasika/Screenshot 2026-02-18 at 11.37.46.png'), top: H * 0.55, left: W * 0.38 },
  { id: '7', title: 'Kruška + prava jesen', image: require('@/assets/images/outfits/pear_warm_autumn/Screenshot 2026-02-18 at 12.05.33.png'), top: H * 0.55, left: W * 0.65 },
  { id: '8', title: 'Kruška + pravo proljeće', image: require('@/assets/images/outfits/pear_warm_spring/Screenshot 2026-02-18 at 11.41.33.png'), top: H * 0.55, left: W * 0.85 },
  { id: '9', title: 'Pravougaoni + pravo ljeto', image: require('@/assets/images/outfits/rectangle_cool_summer/Screenshot 2026-02-18 at 11.59.26.png'), top: H * 0.75, left: W * 0.25 },
  { id: '10', title: 'Pravougaoni + prava jesen', image: require('@/assets/images/outfits/rectangle_warm_autumn/Screenshot 2026-02-18 at 12.07.27.png'), top: H * 0.75, left: W * 0.5 },
  { id: '11', title: 'Pravougaoni + prava zima', image: require('@/assets/images/outfits/rectangle_cool_winter/Screenshot 2026-02-18 at 12.03.04.png'), top: H * 0.75, left: W * 0.75 },
];

export default function ClosetScreen() {
  const insets = useSafeAreaInsets();
  const { setOutfit } = useTryOnStore();
  const [selectedOutfit, setSelectedOutfit] = useState<typeof FULL_OUTFITS[0] | null>(null);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [showVirtualClosetPanel, setShowVirtualClosetPanel] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Entrance Video Setup
  const player = useVideoPlayer(VIDEO_ANIMATION, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    if (!player) return;
    const sub = player.addListener('playToEnd', () => {
      setIsVideoFinished(true);
    });
    const timeout = setTimeout(() => setIsVideoFinished(true), CLOSET_VIDEO_MAX_MS);
    return () => {
      sub.remove();
      clearTimeout(timeout);
    };
  }, [player]);

  const handleTryOn = useCallback((item: typeof FULL_OUTFITS[0]) => {
    const source = Image.resolveAssetSource(item.image);
    const uri = source?.uri != null ? String(source.uri) : '';
    if (uri) {
      setOutfit(item.id, uri, item.title);
    }
    setSelectedOutfit(null);
    router.push('/try-on/upload' as any);
  }, [setOutfit]);

  const panelWidth = W * 0.86;
  const panelHeight = H * 0.48;
  const cardWidth = panelWidth - 40;
  const cardHeight = Math.min(cardWidth, (panelHeight - 80) * 0.7);
  const cardGap = 16;
  const virtualClosetRef = useRef<FlatList>(null);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentCardIndex(viewableItems[0].index);
    }
  }).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const renderVirtualClosetCard = useCallback(
    ({ item, index }: { item: typeof FULL_OUTFITS[0]; index: number }) => (
      <TouchableOpacity
        style={[
          styles.vcCard,
          {
            width: cardWidth,
            height: cardHeight,
            marginRight: index < FULL_OUTFITS.length - 1 ? cardGap : 0,
          },
        ]}
        activeOpacity={0.9}
        onPress={() => setSelectedOutfit(item)}
      >
        <Image source={item.image} style={styles.vcCardImage} resizeMode="contain" />
      </TouchableOpacity>
    ),
    [cardWidth, cardHeight, cardGap]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* After video: closet view + ofinger button; panel opens only on ofinger tap */}
      {isVideoFinished && (
        <>
          <ImageBackground source={CLOSET_IMG} style={styles.bg} resizeMode="cover">
            <View style={styles.closetOverlay} />
          </ImageBackground>

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather name="arrow-left" size={24} color={CREAM} />
          </TouchableOpacity>

          {/* Ofinger (hanger) button – skroz gore, malo iznad back dugmeta, u sredini */}
          <TouchableOpacity
            style={[styles.ofingerBtn, { top: insets.top + 92 }]}
            activeOpacity={0.8}
            onPress={() => setShowVirtualClosetPanel(true)}
          >
            <Ionicons name="shirt-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Hint text – spušten da ne preklapa virtualni ormar */}
          <View style={[styles.bottomGuide, { paddingTop: 10, paddingBottom: insets.bottom + 28 }]}>
            <Text style={styles.guideTitle}>Uđi u svoj Ormar</Text>
            <Text style={styles.guideSub}>{t('ormar.tap_hanger')}</Text>
          </View>

          {/* Linija od ofinger dugmeta do boxa – smooth prelaz pri swipu */}
          {showVirtualClosetPanel && <ConnectorLineSmooth currentCardIndex={currentCardIndex} insets={insets} />}

          {/* Virtual Closet panel – only when user tapped ofinger */}
          {showVirtualClosetPanel && (
            <Animated.View
              style={[styles.virtualClosetPanel, styles.virtualClosetPanelGlass, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, width: panelWidth, maxHeight: panelHeight }]}
              entering={FadeIn.duration(400)}
            >
              <View style={styles.vcTitleBar}>
                <View style={styles.vcTitleSpacer} />
                <Text style={styles.vcTitle} numberOfLines={1}>{t('ormar.title')}</Text>
                <TouchableOpacity
                  style={styles.vcCloseBtn}
                  onPress={() => setShowVirtualClosetPanel(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={24} color={DARK} />
                </TouchableOpacity>
              </View>

              <Text style={styles.vcSwipeHint}>{t('ormar.swipe_to_discover')}</Text>

              <FlatList
                ref={virtualClosetRef}
                data={FULL_OUTFITS}
                keyExtractor={(item) => item.id}
                renderItem={renderVirtualClosetCard}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={[styles.vcCarouselContent, { paddingHorizontal: 24 }]}
                snapToInterval={cardWidth + cardGap}
                snapToAlignment="start"
                decelerationRate="fast"
              />
            </Animated.View>
          )}
        </>
      )}

      {/* Outfit modal – krem pozadina, slika u okviru, linija do Isprobaj, elegantno dugme */}
      <Modal
        visible={!!selectedOutfit}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOutfit(null)}
      >
        <View style={styles.modalOuter}>
          {selectedOutfit && (() => {
            const frameW = W * 0.5;
            const frameH = H * 0.32;
            const frameTop = insets.top + 56;
            const frameLeft = 24;
            const lineStartX = frameLeft + frameW / 2;
            const lineStartY = frameTop + frameH;
            const btnY = H - insets.bottom - 72;
            const lineH = btnY - lineStartY - 24;
            const lineMidY = lineH / 2;
            const btnCenterX = W / 2;
            const ctrlX = lineStartX + (btnCenterX - lineStartX) * 0.4;
            const pathD = `M ${lineStartX} 0 Q ${ctrlX} ${lineMidY} ${btnCenterX} ${lineH}`;
            return (
              <Animated.View style={styles.modalContentCream} entering={ZoomIn.duration(300)} exiting={ZoomOut.duration(200)}>
                <View style={[styles.modalCreamBg, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
                  <TouchableOpacity
                    style={[styles.modalCloseBtnCream, { top: insets.top + 12 }]}
                    onPress={() => setSelectedOutfit(null)}
                  >
                    <Ionicons name="close" size={24} color={DARK} />
                  </TouchableOpacity>

                  <View style={[styles.modalFrameWrap, { top: frameTop, left: frameLeft }]}>
                    <View style={[styles.modalFrame, { width: frameW, height: frameH }]}>
                      <Image source={selectedOutfit.image} style={styles.modalFrameImage} resizeMode="cover" />
                    </View>
                  </View>

                  <View style={[styles.modalLineWrap, { top: lineStartY, left: 0, width: W, height: lineH }]} pointerEvents="none">
                    <Svg width={W} height={lineH} style={StyleSheet.absoluteFill}>
                      <Path d={pathD} stroke={GOLD} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeOpacity={0.9} />
                    </Svg>
                  </View>

                  <IsprobajButtonAnimated
                    containerStyle={[styles.modalIsprobajBtn, { bottom: insets.bottom + 24 }]}
                    textStyle={styles.modalIsprobajBtnText}
                    onPress={() => handleTryOn(selectedOutfit)}
                  >
                    Isprobaj
                  </IsprobajButtonAnimated>
                </View>
              </Animated.View>
            );
          })()}
        </View>
      </Modal>

      {/* Entrance Video Overlay */}
      {!isVideoFinished && (
        <Animated.View style={styles.videoOverlay} exiting={FadeOut.duration(800)}>
          <VideoView
            style={styles.videoPlayer}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            showsTimecodes={false}
            nativeControls={false}
            contentFit="cover"
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Feather name="arrow-left" size={24} color={CREAM} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.skipBtn, { top: insets.top + 10 }]}
            onPress={() => setIsVideoFinished(true)}
          >
            <Text style={styles.skipBtnText}>Preskoči</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ofingerBtn: {
    position: 'absolute',
    left: (W - 64) / 2,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomGuide: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 10,
  },
  guideTitle: {
    fontFamily: FONTS.heading.medium,
    fontSize: 18,
    color: CREAM,
    letterSpacing: 0.5,
  },
  guideSub: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  hotspotWrap: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    marginLeft: -22,
    marginTop: -22,
  },
  hotspot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DARK,
    zIndex: 100,
  },
  videoPlayer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  skipBtn: {
    position: 'absolute',
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  skipBtnText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 12,
    color: CREAM,
  },

  /* Virtual Closet panel (frosted style, one outfit per slide) */
  closetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  connectorLineWrap: {
    position: 'absolute',
    left: 0,
    width: W,
    zIndex: 8,
  },
  connectorSvg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  virtualClosetPanel: {
    position: 'absolute',
    alignSelf: 'center',
    top: H * 0.38,
    zIndex: 9,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  virtualClosetPanelGlass: {
    backgroundColor: PANEL_BG_GLASS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  vcTitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  vcTitleSpacer: {
    width: 40,
    height: 40,
  },
  vcTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 20,
    color: DARK,
    flex: 1,
    textAlign: 'center',
  },
  vcCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vcSwipeHint: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  vcCarouselContent: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  vcCard: {
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  vcCardImage: {
    width: '100%',
    height: '100%',
  },

  /* Modal – krem pozadina, slika u okviru, linija, Isprobaj */
  modalOuter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContentCream: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalCreamBg: {
    flex: 1,
    backgroundColor: CREAM,
  },
  modalCloseBtnCream: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalFrameWrap: {
    position: 'absolute',
  },
  modalFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(207, 143, 90, 0.5)',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  modalFrameImage: {
    width: '100%',
    height: '100%',
  },
  modalLineWrap: {
    position: 'absolute',
  },
  modalIsprobajBtn: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: 'rgba(255, 252, 249, 0.98)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalIsprobajBtnTouchable: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIsprobajBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 18,
    color: DARK,
    letterSpacing: 0.6,
  },
});