import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/** Floating hanger tab bar body height (approx). */
export const HANGER_NAV_HEIGHT = 110;

const NAV_BOTTOM_OFFSET = 38;

/** Android 3-button / gesture nav when edge-to-edge reports bottom inset 0. */
const ANDROID_NAV_FALLBACK = 40;

export function getBottomInset(insets: EdgeInsets): number {
  if (Platform.OS === 'android') {
    return Math.max(insets.bottom, ANDROID_NAV_FALLBACK);
  }
  return insets.bottom;
}

/** Distance from screen bottom to tab bar anchor. */
export function getTabBarBottomOffset(insets: EdgeInsets): number {
  return NAV_BOTTOM_OFFSET + getBottomInset(insets);
}

/** Space to reserve above system nav + custom tab bar (scroll padding, layout). */
export function getTabBarReservedHeight(insets: EdgeInsets): number {
  return HANGER_NAV_HEIGHT + getTabBarBottomOffset(insets);
}
