// ===========================================
// DAJANA AI - Luxury "No credits" popup
// Prikazuje se kad korisnik nema kredite za sliku ili video.
// Stil: krem, zlatno, tamno zelena — u skladu sa aplikacijom.
// ===========================================

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';

const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
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
  const iconName = type === 'image' ? 'camera-outline' : 'videocam-outline';

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
            <View style={styles.iconWrap}>
              <Ionicons name={iconName as any} size={32} color={GOLD} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{t('no_credits_modal.message')}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryText}>{t('no_credits_modal.later')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  onClose();
                  onGoToShop();
                }}
                activeOpacity={0.88}
              >
                <Ionicons name="wallet-outline" size={18} color={COLORS.white} />
                <Text style={styles.primaryText}>{t('no_credits_modal.go_to_shop')}</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CREAM,
    borderRadius: 24,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(207,143,90,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.xl,
    color: DARK,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.md,
    color: DARK_GREEN,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 20,
    backgroundColor: DARK_GREEN,
    borderWidth: 0,
    shadowColor: DARK_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
});
