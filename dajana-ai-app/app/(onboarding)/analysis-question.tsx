// ===========================================
// DAJANA AI - Onboarding: Analysis Question Screen
// ===========================================
// Pitanje: "Da li si radila analizu kod Dajane?"
// DA -> season selection
// NE -> complete (has_dajana_analysis = false)

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';

const ONBOARDING_CREAM = '#F8F4EF';

export default function AnalysisQuestionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleYes = () => {
    // Korisnica je radila analizu - ide na izbor sezone
    router.push('/(onboarding)/season');
  };

  const handleNo = async () => {
    // Korisnica NIJE radila analizu - setujemo has_dajana_analysis = false i idemo na complete
    setIsLoading(true);
    try {
      await updateProfile({ 
        has_dajana_analysis: false,
        season: null 
      });
      router.push('/(onboarding)/complete');
    } catch (error) {
      console.error('Save analysis status error:', error);
      Alert.alert(t('error'), t('errors.save_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ONBOARDING_CREAM }]}>
      <View style={styles.mainContainer}>
        <View style={styles.scrollContent}>
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <Text style={styles.progressText}>
              {t('onboarding.step_of', { current: 3, total: 4 })}
            </Text>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('onboarding.analysis_question')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.subtitle}>
              {t('onboarding.analysis_subtitle')}
            </Text>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons 
                name="palette-swatch" 
                size={80} 
                color={COLORS.secondary} 
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Feather name="info" size={18} color={COLORS.secondary} />
            <Text style={styles.infoText}>
              {t('onboarding.analysis_info')}
            </Text>
          </View>
        </View>

        {/* Fixed Bottom Buttons */}
        <View style={styles.buttonContainer}>
          {/* DA Button */}
          <TouchableOpacity
            style={styles.buttonYes}
            onPress={handleYes}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <Feather name="check" size={20} color={COLORS.primary} />
              <Text style={styles.buttonYesText}>{t('onboarding.yes_did_analysis')}</Text>
            </View>
          </TouchableOpacity>

          {/* NE Button */}
          <TouchableOpacity
            style={[styles.buttonNo, isLoading && styles.buttonDisabled]}
            onPress={handleNo}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.gray[500]} size="small" />
            ) : (
              <Text style={styles.buttonNoText}>{t('onboarding.no_skip_analysis')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_CREAM,
  },
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  progressContainer: {
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[400],
    fontFamily: FONTS.primary.regular,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  backButton: {
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.heading.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  accentLine: {
    width: 30,
    height: 1,
    backgroundColor: COLORS.secondary,
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(207, 143, 90, 0.05)',
    borderRadius: 12,
    padding: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: ONBOARDING_CREAM,
    gap: SPACING.md,
  },
  buttonYes: {
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
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  buttonYesText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  buttonNo: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    borderWidth: 0.5,
    borderColor: COLORS.gray[300],
  },
  buttonNoText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: COLORS.gray[500],
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
