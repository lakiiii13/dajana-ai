// ===========================================
// DAJANA AI - Onboarding: Body Type Result Screen
// ===========================================

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/lib/i18n';

const ONBOARDING_CREAM = '#F8F4EF';

export default function BodyTypeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();

  const handleNext = () => {
    router.push('/(onboarding)/analysis-question');
  };

  const handleBack = () => {
    router.back();
  };

  // Body type icons mapping using Feather/Material icons instead of emojis
  const renderBodyTypeIcon = () => {
    const iconSize = 80;
    const iconColor = COLORS.secondary;

    switch (profile?.body_type) {
      case 'hourglass':
        return <MaterialCommunityIcons name="timer-sand" size={iconSize} color={iconColor} />;
      case 'pear':
        return <MaterialCommunityIcons name="food-apple" size={iconSize} color={iconColor} />; // Using apple as placeholder for pear shape
      case 'apple':
        return <MaterialCommunityIcons name="fruit-cherries" size={iconSize} color={iconColor} />;
      case 'rectangle':
        return <Feather name="square" size={iconSize} color={iconColor} />;
      case 'inverted_triangle':
        return <Feather name="triangle" size={iconSize} color={iconColor} style={{ transform: [{ rotate: '180deg' }] }} />;
      default:
        return <Feather name="user" size={iconSize} color={iconColor} />;
    }
  };

  const getBodyTypeName = () => {
    if (!profile?.body_type) return t('body_types.unknown');
    return t(`body_types.${profile.body_type}`);
  };

  const getBodyTypeDesc = () => {
    if (!profile?.body_type) return '';
    return t(`body_types.${profile.body_type}_desc`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: ONBOARDING_CREAM }]}>
      <View style={styles.mainContainer}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
            <Text style={styles.progressText}>
              {t('onboarding.step_of', { current: 2, total: 4 })}
            </Text>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('onboarding.your_body_type')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.subtitle}>
              {t('onboarding.body_type_subtitle')}
            </Text>
          </View>

          {/* Body Type Result Card */}
          <View style={styles.resultCard}>
            <View style={styles.iconWrapper}>
              {renderBodyTypeIcon()}
            </View>
            <Text style={styles.bodyTypeName}>{getBodyTypeName()}</Text>
            <View style={styles.cardDivider} />
            <Text style={styles.bodyTypeDescription}>
              {getBodyTypeDesc()}
            </Text>
          </View>

          {/* Measurements Summary */}
          <View style={styles.measurementsCard}>
            <Text style={styles.measurementsTitle}>{t('onboarding.your_measurements')}</Text>
            
            <View style={styles.measurementGrid}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>{t('profile.bust')}</Text>
                <Text style={styles.measurementValue}>{profile?.bust_cm} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>{t('profile.waist')}</Text>
                <Text style={styles.measurementValue}>{profile?.waist_cm} cm</Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>{t('profile.hips')}</Text>
                <Text style={styles.measurementValue}>{profile?.hips_cm} cm</Text>
              </View>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Feather name="info" size={18} color={COLORS.secondary} />
            <Text style={styles.infoText}>
              {t('onboarding.body_type_info')}
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={{ width: 20 }} />
              <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
              <Feather name="arrow-right" size={20} color={COLORS.primary} />
            </View>
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
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 0.5,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrapper: {
    marginBottom: SPACING.lg,
    opacity: 0.9,
  },
  bodyTypeName: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.heading.semibold,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  cardDivider: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginBottom: SPACING.md,
  },
  bodyTypeDescription: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  measurementsCard: {
    backgroundColor: 'transparent',
    marginBottom: SPACING.xl,
  },
  measurementsTitle: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    opacity: 0.6,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  measurementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  measurementItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.gray[200],
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 10,
    fontFamily: FONTS.primary.medium,
    color: COLORS.gray[400],
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(207, 143, 90, 0.05)',
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
    lineHeight: 18,
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
