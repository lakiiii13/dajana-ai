import React, { type ReactNode } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/theme';

const GOLD = '#CF8F5A';
const DARK_GREEN = COLORS.primary;

type VideoWizardShellProps = {
  children: ReactNode;
  stepIndex: number;
  totalSteps: number;
  prevRoute?: string;
  nextRoute?: string;
  swipeDisabled?: boolean;
  canGoNext?: boolean;
  onInvalidNext?: () => void;
  onClose?: () => void;
  backgroundColor?: string;
  contentStyle?: ViewStyle;
  hideStepIndicator?: boolean;
};

export function VideoWizardShell({
  children,
  stepIndex,
  totalSteps,
  onClose,
  backgroundColor = DARK_GREEN,
  contentStyle,
  hideStepIndicator = false,
}: VideoWizardShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose ?? (() => router.back())}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={22} color={COLORS.white} />
        </TouchableOpacity>

        {!hideStepIndicator && (
          <View style={styles.dotsRow}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === stepIndex ? styles.dotActive : undefined,
                  index < stepIndex ? styles.dotCompleted : undefined,
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.topSpacer} />
      </View>

      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 22,
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
  dotCompleted: {
    backgroundColor: GOLD,
  },
  topSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
  },
});
