// ===========================================
// DAJANA AI - Kapsula Choice Screen
// Kapsula LEVO (gde se bira), gore desno + dole desno dve opcije, linije od Kapsule ka njima
// ===========================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { FONTS, COLORS } from '@/constants/theme';
import { t } from '@/lib/i18n';

const { width: W, height: H } = Dimensions.get('window');

const CREAM = '#F8F4EF';
const CREAM_BOX = '#F2EDE8';
const BORDER_BROWN = 'rgba(196,167,125,0.5)';
const LINE_COLOR = 'rgba(207,143,90,0.32)';
const TEXT_DARK = '#1A1A1A';
const TEXT_SECONDARY = '#5C5C5C';
const GOLD = COLORS.secondary;

const BOX_LEFT = 20;
const BOX_WIDTH = 148;
const BOX_HEIGHT_APPROX = 48;
const CARD_RIGHT = 20;
const CARD_WIDTH = 132;
const CARD_HEIGHT_APPROX = 82;

export default function CapsuleChoiceScreen() {
  const insets = useSafeAreaInsets();

  const titleShine = useSharedValue(0.88);
  useEffect(() => {
    titleShine.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.88, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleShine.value,
  }));

  const cardCenterX = W - CARD_RIGHT - CARD_WIDTH / 2;
  const cardTopY = insets.top + H * 0.10;
  const cardBottomY = insets.top + H * 0.52;
  const midY = (cardTopY + CARD_HEIGHT_APPROX / 2 + cardBottomY + CARD_HEIGHT_APPROX / 2) / 2;
  const boxTop = midY - BOX_HEIGHT_APPROX / 2;
  const boxCenterY = boxTop + BOX_HEIGHT_APPROX / 2;
  const startX = BOX_LEFT + BOX_WIDTH + 6;

  const fromX = -W * 0.18;
  const pathIntoBox = `M ${fromX} ${boxCenterY} L ${BOX_LEFT - 1} ${boxCenterY}`;
  const pathToTop = `M ${startX} ${boxCenterY} C ${startX + 40} ${boxCenterY} ${cardCenterX - 48} ${cardTopY + 18} ${cardCenterX - 38} ${cardTopY + 36}`;
  const pathToBottom = `M ${startX} ${boxCenterY} C ${startX + 44} ${boxCenterY + 12} ${cardCenterX - 50} ${cardBottomY - 6} ${cardCenterX - 40} ${cardBottomY + 30}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      {/* Back */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Feather name="arrow-left" size={24} color={TEXT_DARK} />
      </TouchableOpacity>

      {/* Levo – hint za izbor */}
      <Animated.View
        entering={FadeIn.duration(400)}
        style={[styles.textBox, { top: boxTop, left: BOX_LEFT }]}
      >
        <Text style={styles.textBoxHint}>{t('wardrobe_choice.choice_hint')}</Text>
      </Animated.View>

      {/* Elegantne linije – zlatna nijansa, tanke, glatke krive */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={W} height={H} style={styles.svgOverlay}>
          <Path d={pathIntoBox} stroke={LINE_COLOR} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={pathToTop} stroke={LINE_COLOR} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d={pathToBottom} stroke={LINE_COLOR} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>

      {/* Gore desno: samo "Kapsula" u sredini, veći font */}
      <Animated.View
        entering={FadeInDown.delay(180).duration(450)}
        style={[styles.cardRight, { top: cardTopY }]}
      >
        <TouchableOpacity
          style={styles.cardInner}
          activeOpacity={0.82}
          onPress={() => router.push('/(tabs)/capsule/table-builder' as any)}
        >
          <Animated.Text style={[styles.cardTitle, { color: COLORS.primary }, titleAnimatedStyle]}>
            {t('wardrobe_choice.capsule_title')}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Dole desno: samo "Ormar outfita" u sredini, veći font */}
      <Animated.View
        entering={FadeInDown.delay(260).duration(450)}
        style={[styles.cardRight, { top: cardBottomY }]}
      >
        <TouchableOpacity
          style={styles.cardInner}
          activeOpacity={0.82}
          onPress={() => router.push('/(tabs)/capsule/closet' as any)}
        >
          <Animated.Text style={[styles.cardTitle, { color: COLORS.primary }, titleAnimatedStyle]} numberOfLines={2}>
            {t('wardrobe_choice.ormar_title')}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196,167,125,0.4)',
  },
  textBox: {
    position: 'absolute',
    width: BOX_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_BROWN,
    backgroundColor: CREAM_BOX,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  textBoxHint: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
    color: TEXT_SECONDARY,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  cardRight: {
    position: 'absolute',
    right: CARD_RIGHT,
    width: CARD_WIDTH,
  },
  cardInner: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER_BROWN,
    backgroundColor: CREAM_BOX,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 20,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});
