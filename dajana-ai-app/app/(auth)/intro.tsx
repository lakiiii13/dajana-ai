// ===========================================
// DAJANA AI - Intro (3 swipeable slides)
// Hero: horizontalni logo iz assets. Na svaki slajd: Dajanina slika + tekst + smooth animacije.
// ===========================================

import { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Horizontalni logo (iz foldera horizontalni logovi) – stavi u assets/images/logo-intro-horizontal.png
const INTRO_LOGO = require('@/assets/images/logo-intro-horizontal.png');
const SLIDE_IMAGES = [
  require('@/assets/images/prvaslika.jpg'),
  require('@/assets/images/drugaslika.jpg'),
  require('@/assets/images/trecaslika.jpg'),
];

interface SlideData {
  id: string;
  titleKey: string;
  subtitleKey: string;
  descKey: string;
  image: number;
}

const slides: SlideData[] = [
  {
    id: '1',
    titleKey: 'auth.slide1_title',
    subtitleKey: 'auth.slide1_subtitle',
    descKey: 'auth.slide1_desc',
    image: SLIDE_IMAGES[0],
  },
  {
    id: '2',
    titleKey: 'auth.slide2_title',
    subtitleKey: 'auth.slide2_subtitle',
    descKey: 'auth.slide2_desc',
    image: SLIDE_IMAGES[1],
  },
  {
    id: '3',
    titleKey: 'auth.slide3_title',
    subtitleKey: 'auth.slide3_subtitle',
    descKey: 'auth.slide3_desc',
    image: SLIDE_IMAGES[2],
  },
];

const LOGO_HEADER_HEIGHT = 42;

export default function IntroScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    [SCREEN_HEIGHT]
  );


  const handleContinue = () => {
    router.push('/(auth)/register');
  };

  const handleSkip = () => {
    router.push('/(auth)/register');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      if (newIndex !== currentIndex) setCurrentIndex(newIndex);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const renderSlide = useCallback(
    ({ item, index }: { item: SlideData; index: number }) => {
      const inputRange = [
        (index - 1) * SCREEN_WIDTH,
        index * SCREEN_WIDTH,
        (index + 1) * SCREEN_WIDTH,
      ];
      const imageOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.45, 1, 0.45],
      });
      const imageScale = scrollX.interpolate({
        inputRange,
        outputRange: [0.92, 1, 0.92],
      });
      const contentOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.5, 1, 0.5],
      });
      const contentTranslateY = scrollX.interpolate({
        inputRange,
        outputRange: [14, 0, 14],
      });

      return (
        <View style={[styles.slide, { height: SCREEN_HEIGHT }]}>
          <View style={styles.slideInner}>
            {/* Slika preko celog ekrana – centrirana, scale + opacity po scrollu */}
            <Animated.View
              style={[
                styles.slideImageWrap,
                {
                  opacity: imageOpacity,
                  transform: [{ scale: imageScale }],
                },
              ]}
            >
              <Image
                source={item.image}
                style={styles.slideImage}
                resizeMode="cover"
              />
            </Animated.View>

            {/* Gradient da tekst ostane čitljiv – luxury tamni fade */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
              style={styles.slideGradient}
              pointerEvents="none"
            />

            {/* Tekst preko slike – luxury stil, senka, dole u sredini */}
            <Animated.View
              style={[
                styles.slideContent,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslateY }],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={styles.slideSubtitle}>{t(item.subtitleKey)}</Text>
              <View style={styles.accentLine} />
              <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
              <Text style={styles.slideDesc}>{t(item.descKey)}</Text>
              <View style={styles.bottomDecor}>
                <View style={styles.decorLineSmall} />
                <View style={styles.decorDiamondSmall} />
                <View style={styles.decorLineSmall} />
              </View>
            </Animated.View>
          </View>
        </View>
      );
    },
    [scrollX, SCREEN_HEIGHT]
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];
        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [0.85, 1.35, 0.85],
        });
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.45, 1, 0.45],
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              styles.dotBase,
              {
                opacity,
                transform: [{ scale }],
              },
            ]}
          />
        );
      })}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* FlatList full-screen – slika od vrha do dna */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        style={styles.fullScreenList}
      />

      {/* Header – preko slike; blagi gradient da logo uvek bude čitljiv */}
      <SafeAreaView style={styles.headerOverlay} edges={['top']}>
        <LinearGradient
          colors={['rgba(0,0,0,0.28)', 'transparent']}
          style={styles.headerGradient}
          pointerEvents="none"
        />
        <View style={styles.header}>
          <View style={styles.miniLogoContainer}>
            <Image
              source={INTRO_LOGO}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          {!isLastSlide && (
            <TouchableOpacity style={styles.topSkipButton} onPress={handleSkip}>
              <Text style={styles.topSkipText}>{t('auth.skip')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Dno – preko slike */}
      <SafeAreaView style={styles.bottomOverlay} edges={['bottom']}>
      <View style={styles.bottomSection}>
        {renderDots()}
        <View style={styles.buttonWrapper}>
          {isLastSlide ? (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                <View style={{ width: 20 }} />
                <Text style={styles.continueText}>{t('auth.next')}</Text>
                <Feather name="arrow-right" size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ height: 60 }} />
          )}
        </View>
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>{t('auth.have_account')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite || '#FDFCFB',
  },
  fullScreenList: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  miniLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: SCREEN_WIDTH * 0.58,
    height: LOGO_HEADER_HEIGHT,
    maxWidth: 260,
  },
  topSkipButton: {
    position: 'absolute',
    right: SPACING.lg,
    top: SPACING.lg,
  },
  topSkipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideInner: {
    width: '100%',
    flex: 1,
    position: 'relative',
  },
  slideImageWrap: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  slideGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '72%',
    width: SCREEN_WIDTH,
  },
  slideContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl + 100,
  },
  slideSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.heading.italic,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  accentLine: {
    width: 36,
    height: 1,
    backgroundColor: COLORS.secondary,
    marginBottom: SPACING.md,
    opacity: 0.9,
  },
  slideTitle: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.heading.semibold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 40,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  slideDesc: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomDecor: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    marginTop: SPACING.lg,
    opacity: 0.6,
  },
  decorLineSmall: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  decorDiamondSmall: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.secondary,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: SPACING.xs,
  },
  bottomSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: 6,
  },
  dot: {},
  dotBase: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.white,
  },
  buttonWrapper: {
    marginBottom: SPACING.lg,
  },
  continueButton: {
    height: 60,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 2,
    borderWidth: 0.5,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  continueText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  loginText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
  },
  loginLink: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
  },
});
