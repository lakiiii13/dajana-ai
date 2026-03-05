// ===========================================
// DAJANA AI – FLOATING HANGER NAVIGATION BAR
// SVG hanger shape + Feather icons + Reanimated
// Premium floating nav bar shaped like a clothes hanger
// ===========================================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { FONTS, COLORS } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NAV_WIDTH = SCREEN_WIDTH * 0.88;
const NAV_BOTTOM_OFFSET = 38;

const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const MUTED = '#9B9590';
const DARK = '#2C2A28';
const STROKE_COLOR = '#E8E2DA';

export const HANGER_NAV_HEIGHT = 110;

const HANGER_HOOK_IMAGE = require('@/assets/images/hanger-hook.png');

const SVG_W = 340;
const SVG_H = 100;

const HANGER_BODY = 'M 25,88 Q 5,88 5,70 L 10,50 Q 20,36 55,32 L 152,22 Q 170,18 188,22 L 285,32 Q 320,36 330,50 L 335,70 Q 335,88 315,88 Z';

const TAB_NAMES = ['index', 'capsule', 'videos', 'ai-advice', 'profile'] as const;
type TabName = (typeof TAB_NAMES)[number];

const TAB_LABELS: Record<TabName, string> = {
  index: 'Početna',
  capsule: 'Kapsula',
  videos: 'Video',
  'ai-advice': 'Dajana',
  profile: 'Profil',
};

const NAV_HOME = require('@/assets/images/nav-home.jpg');
const CAPSULE_LOGO = require('@/assets/images/logo_za_kapsulu.png');
const NAV_VIDEOS = require('@/assets/images/nav-videos.jpg');
const NAV_AI_ADVICE = require('@/assets/images/nav-ai-advice.jpg');
const NAV_PROFILE = require('@/assets/images/nav-profile.jpg');

const TAB_ICONS: Record<TabName, number> = {
  index: NAV_HOME,
  capsule: CAPSULE_LOGO,
  videos: NAV_VIDEOS,
  'ai-advice': NAV_AI_ADVICE,
  profile: NAV_PROFILE,
};

const SPRING_CONFIG = { damping: 14, stiffness: 160, mass: 0.8 };

function HangerTabItem({
  name,
  isActive,
  tabIndex,
  onPress,
  onPressIn,
  onPressOut,
  title,
}: {
  name: TabName;
  isActive: boolean;
  tabIndex: number;
  onPress: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  title: string;
}) {
  const scale = useSharedValue(isActive ? 1.15 : 1);
  const translateY = useSharedValue(isActive ? -3 : 0);
  const dotScale = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.15 : 1, SPRING_CONFIG);
    translateY.value = withSpring(isActive ? -3 : 0, SPRING_CONFIG);
    dotScale.value = withSpring(isActive ? 1 : 0, SPRING_CONFIG);
  }, [isActive]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const dotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 60 });
    onPressIn();
  };

  const handlePressOut = () => {
    scale.value = withSpring(isActive ? 1.15 : 1, SPRING_CONFIG);
    onPressOut();
  };

  const labelColor = isActive ? COLORS.primary : MUTED;
  const iconOpacity = isActive ? 1 : 0.75;
  const isCapsule = name === 'capsule';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View style={[styles.iconWrap, iconAnimStyle]}>
        <Image
          source={TAB_ICONS[name]}
          style={[
            styles.tabIconImage,
            isCapsule && styles.tabIconCapsule,
            { opacity: iconOpacity },
          ]}
          resizeMode="cover"
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: labelColor,
            fontFamily: isActive ? FONTS.primary.semibold : FONTS.primary.regular,
          },
        ]}
        numberOfLines={1}
      >
        {TAB_LABELS[name]}
      </Text>
      <Animated.View style={[styles.activeDot, { backgroundColor: COLORS.primary }, dotAnimStyle]} />
    </TouchableOpacity>
  );
}

const GUEST_PROTECTED_TABS: TabName[] = ['capsule', 'videos', 'ai-advice', 'profile'];

export function WardrobeRailTabBar({
  state,
  descriptors,
  navigation,
  isGuest,
  onGuestBlock,
}: BottomTabBarProps & { isGuest?: boolean; onGuestBlock?: () => void }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  // Hide tab bar on full-screen pages (including Dajana chat – luxury full-screen)
  if (
    pathname.includes('table-builder') ||
    pathname.includes('closet') ||
    pathname.includes('video-generate') ||
    pathname.includes('video-result') ||
    pathname.includes('try-on') ||
    pathname.includes('ai-advice')
  ) {
    return null;
  }

  const visibleRoutes = state.routes.filter(
    (r) => TAB_NAMES.includes(r.name as TabName)
  );

  const bottomOffset = NAV_BOTTOM_OFFSET + Math.max(insets.bottom - 10, 0);

  return (
    <View style={[styles.floatingContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
      <View style={styles.hangerWrap}>
        {/* SVG hanger body (no hook — hook is PNG below) */}
        <Svg
          width={NAV_WIDTH}
          height={(NAV_WIDTH / SVG_W) * SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={styles.svgLayer}
        >
          <Path d={HANGER_BODY} fill={CREAM} stroke={STROKE_COLOR} strokeWidth={1.2} />
        </Svg>

        {/* Hook PNG — centered on top of hanger */}
        <View style={styles.hookWrap} pointerEvents="none">
          <Image source={HANGER_HOOK_IMAGE} style={styles.hookImage} resizeMode="contain" />
        </View>

        {/* Icons overlay — positioned inside hanger body */}
        <View style={styles.iconsRow}>
          {visibleRoutes.map((route) => {
            const tabIndex = TAB_NAMES.indexOf(route.name as TabName);
            if (tabIndex < 0) return null;
            const isActive = state.index === tabIndex;
            const isProtected = GUEST_PROTECTED_TABS.includes(route.name as TabName);
            const handlePress = () => {
              if (isGuest && isProtected && onGuestBlock) {
                onGuestBlock();
                return;
              }
              navigation.navigate(route.name);
            };

            return (
              <HangerTabItem
                key={route.key}
                name={route.name as TabName}
                isActive={isActive}
                tabIndex={tabIndex}
                title={descriptors[route.key]?.options?.title ?? route.name}
                onPress={handlePress}
                onPressIn={() => {}}
                onPressOut={() => {}}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  hangerWrap: {
    width: NAV_WIDTH,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 10,
  },
  svgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  hookWrap: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  hookImage: {
    width: 48,
    height: 40,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    position: 'relative',
    top: (NAV_WIDTH / SVG_W) * 38,
    height: (NAV_WIDTH / SVG_W) * 52,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  tabIconImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  tabIconCapsule: {
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 2,
    textAlign: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
