// ===========================================
// DAJANA AI - Luxury "No credits" popup
// Transparentno, elegantno — box oko Obnovi pretplatu + animacija.
// ===========================================

import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';

const DARK_GREEN = '#0D4326';
const DARK = '#2C2A28';

export type NoCreditsType = 'image' | 'video';

interface NoCreditsModalProps {
  visible: boolean;
  type: NoCreditsType;
  onClose: () => void;
  onGoToShop: () => void;
}

export function NoCreditsModal({
  visible,
  type,
  onClose,
  onGoToShop,
}: NoCreditsModalProps) {
  const title = type === 'image' ? t('no_credits_modal.title_image') : t('no_credits_modal.title_video');
  const scale = useSharedValue(1);

  useEffect(() => {
    const ease = Easing.bezier(0.4, 0, 0.2, 1);
    if (visible) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 1800, easing: ease }),
          withTiming(1, { duration: 1800, easing: ease })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = 1;
    }
    return () => { cancelAnimation(scale); };
  }, [visible]);

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeInDown.duration(320).springify()}
            style={styles.card}
          >
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{t('no_credits_modal.message')}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryText}>{t('no_credits_modal.later')}</Text>
              </TouchableOpacity>
              <Animated.View style={[styles.primaryBtnWrap, animatedBtnStyle]}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    onClose();
                    onGoToShop();
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryText}>{t('no_credits_modal.go_to_shop')}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44,42,40,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(248,244,239,0.98)',
    borderRadius: 24,
    padding: SPACING.xl + 4,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.25)',
    shadowColor: 'rgba(13,67,38,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.xl,
    color: DARK,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: 0.3,
  },
  message: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
    color: '#525252',
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    justifyContent: 'center',
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.md,
    color: DARK_GREEN,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  primaryBtnWrap: {
    flex: 1,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 52,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    color: DARK_GREEN,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});
