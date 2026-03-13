// ===========================================
// DAJANA AI - Onboarding: Dozvole (kamera → galerija)
// Jedna po jedna, u stilu aplikacije, logo gore u sredini
// ===========================================

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { AppLogo } from '@/components/AppLogo';
import { t } from '@/lib/i18n';

const ONBOARDING_CREAM = '#F8F4EF';

type Step = 'camera' | 'gallery' | 'done';

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('camera');

  const handleAllowCamera = async () => {
    await ImagePicker.requestCameraPermissionsAsync();
    setStep('gallery');
  };

  const handleAllowGallery = async () => {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    setStep('done');
  };

  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ONBOARDING_CREAM }]}>
      {/* Dajana logo gore u sredini */}
      <View style={[styles.logoHeader, { paddingTop: insets.top + SPACING.sm }]}>
        <AppLogo height={40} maxWidth={180} />
      </View>

      <View style={styles.content}>
        {step === 'camera' && (
          <>
            <View style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Feather name="camera" size={48} color={COLORS.primary} />
              </View>
            </View>
            <Text style={styles.title}>{t('onboarding.permission_camera_title')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.desc}>{t('onboarding.permission_camera_desc')}</Text>
            <TouchableOpacity style={styles.allowBtn} onPress={handleAllowCamera} activeOpacity={0.9}>
              <Text style={styles.allowBtnText}>{t('onboarding.permission_allow')}</Text>
              <Feather name="chevron-right" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </>
        )}

        {step === 'gallery' && (
          <>
            <View style={styles.iconWrap}>
              <View style={styles.iconCircle}>
                <Feather name="image" size={48} color={COLORS.primary} />
              </View>
            </View>
            <Text style={styles.title}>{t('onboarding.permission_gallery_title')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.desc}>{t('onboarding.permission_gallery_desc')}</Text>
            <TouchableOpacity style={styles.allowBtn} onPress={handleAllowGallery} activeOpacity={0.9}>
              <Text style={styles.allowBtnText}>{t('onboarding.permission_allow')}</Text>
              <Feather name="chevron-right" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </>
        )}

        {step === 'done' && (
          <>
            <View style={styles.iconWrap}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primary }]}>
                <Feather name="check" size={48} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.title}>{t('onboarding.all_set')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.desc}>{t('onboarding.complete_subtitle')}</Text>
            <TouchableOpacity style={styles.allowBtn} onPress={handleFinish} activeOpacity={0.9}>
              <Text style={styles.allowBtnText}>{t('onboarding.permission_continue')}</Text>
              <Feather name="arrow-right" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.heading.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    maxWidth: 320,
  },
  accentLine: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.secondary,
    marginBottom: SPACING.md,
    opacity: 0.7,
  },
  desc: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    maxWidth: 320,
  },
  allowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: 28,
    minWidth: 200,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  allowBtnText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
