// ===========================================
// DAJANA AI - Guest block modal
// Prikazuje se kada gost pokuša da otvori Kapsula / Video / Dajana / Profil
// ===========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';

interface GuestBlockModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GuestBlockModal({ visible, onClose }: GuestBlockModalProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const setGuest = useAuthStore((s) => s.setGuest);

  const handleSignIn = () => {
    setGuest(false);
    onClose();
    router.replace('/(auth)/login');
  };

  const handleRegister = () => {
    setGuest(false);
    onClose();
    router.replace('/(auth)/register');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Feather name="lock" size={32} color={COLORS.secondary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('guest_modal.title')}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{t('guest_modal.message')}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: COLORS.primary }]}
              onPress={handleSignIn}
              activeOpacity={0.9}
            >
              <Text style={styles.btnPrimaryText}>{t('guest_modal.sign_in')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecondary, { borderColor: COLORS.secondary }]}
              onPress={handleRegister}
              activeOpacity={0.9}
            >
              <Text style={[styles.btnSecondaryText, { color: COLORS.secondary }]}>{t('guest_modal.register')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeRow}>
            <Text style={[styles.closeText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
          </TouchableOpacity>
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
    borderRadius: 20,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.lg,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  buttons: {
    width: '100%',
    gap: SPACING.sm,
  },
  btnPrimary: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  btnSecondary: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
  },
  closeRow: {
    marginTop: SPACING.md,
  },
  closeText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
  },
});
