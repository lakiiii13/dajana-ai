// ===========================================
// DAJANA AI - Onboarding: Complete Screen
// ===========================================
// Shows different content based on has_dajana_analysis

import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';

const ONBOARDING_CREAM = '#F8F4EF';

export default function CompleteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();

  const hasDajanaAnalysis = profile?.has_dajana_analysis === true;

  const getBodyTypeName = () => {
    if (!profile?.body_type) return t('profile.not_set');
    return t(`body_types.${profile.body_type}`);
  };

  const getSeasonName = () => {
    if (!profile?.season) return t('onboarding.not_selected');
    return t(`seasons.${profile.season}`);
  };

  const handleFinish = () => {
    router.push('/(onboarding)/permissions');
  };

  const handleBookAnalysis = () => {
    // Link to Dajana's booking page (placeholder)
    Linking.openURL('https://otkrijsvojeboje.com');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ONBOARDING_CREAM }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress - Always 100% on complete */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>
            {t('onboarding.step_of', { current: 4, total: 4 })}
          </Text>
        </View>

        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Feather name="check" size={48} color={COLORS.white} />
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('onboarding.all_set')}</Text>
          <View style={styles.accentLine} />
          <Text style={styles.subtitle}>
            {t('onboarding.complete_subtitle')}
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('onboarding.your_profile')}</Text>
          
          {/* Body Type - Always shown */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryIconWrapper}>
                <Feather name="user" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.summaryTextWrapper}>
                <Text style={styles.summaryLabel}>{t('profile.body_type')}</Text>
                <Text style={styles.summaryValue}>{getBodyTypeName()}</Text>
              </View>
            </View>
          </View>

          {/* Season - Only shown if has analysis */}
          {hasDajanaAnalysis && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconWrapper, { backgroundColor: 'rgba(207, 143, 90, 0.1)' }]}>
                  <MaterialCommunityIcons name="palette-swatch" size={20} color={COLORS.secondary} />
                </View>
                <View style={styles.summaryTextWrapper}>
                  <Text style={styles.summaryLabel}>{t('profile.season')}</Text>
                  <Text style={styles.summaryValue}>{getSeasonName()}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Measurements - if available */}
          {profile?.height_cm && (
            <View style={[styles.summaryRow, styles.summaryRowLast]}>
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIconWrapper, { backgroundColor: COLORS.gray[100] }]}>
                  <Feather name="maximize-2" size={18} color={COLORS.gray[500]} />
                </View>
                <View style={styles.summaryTextWrapper}>
                  <Text style={styles.summaryLabel}>{t('profile.measurements')}</Text>
                  <Text style={styles.summaryValue}>
                    {profile.bust_cm} / {profile.waist_cm} / {profile.hips_cm} cm
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Upsell Box - Only shown if NO analysis */}
        {!hasDajanaAnalysis && (
          <TouchableOpacity 
            style={styles.upsellBox} 
            onPress={handleBookAnalysis}
            activeOpacity={0.8}
          >
            <View style={styles.upsellIconWrapper}>
              <MaterialCommunityIcons name="palette-swatch" size={28} color={COLORS.secondary} />
            </View>
            <View style={styles.upsellContent}>
              <Text style={styles.upsellTitle}>{t('onboarding.upsell_title')}</Text>
              <Text style={styles.upsellText}>{t('onboarding.upsell_text')}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
        )}

        {/* Features Preview */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>{t('onboarding.what_awaits')}</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="grid" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>
              {hasDajanaAnalysis 
                ? t('onboarding.feature_outfits') + ' i boja'
                : t('onboarding.feature_outfits')
              }
            </Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="camera" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>
              {t('onboarding.feature_tryon')}
            </Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Feather name="message-circle" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.featureText}>
              {t('onboarding.feature_advisor')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleFinish}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <View style={{ width: 20 }} />
            <Text style={styles.buttonText}>{t('onboarding.start')}</Text>
            <Feather name="arrow-right" size={20} color={COLORS.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_CREAM,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 120,
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
    backgroundColor: COLORS.success || COLORS.primary,
  },
  progressText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray[400],
    fontFamily: FONTS.primary.regular,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.heading.bold,
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
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
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 0.5,
    borderColor: COLORS.gray[200],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  summaryRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray[100],
  },
  summaryRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  summaryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 67, 38, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextWrapper: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[400],
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
  },
  upsellBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(207, 143, 90, 0.08)',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 0.5,
    borderColor: 'rgba(207, 143, 90, 0.3)',
  },
  upsellIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  upsellContent: {
    flex: 1,
  },
  upsellTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    marginBottom: 2,
  },
  upsellText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  featuresContainer: {
    gap: SPACING.md,
  },
  featuresTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
    opacity: 0.6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.gray[200],
  },
  featureText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: ONBOARDING_CREAM,
  },
  button: {
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
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.black,
    letterSpacing: 0.5,
  },
});
