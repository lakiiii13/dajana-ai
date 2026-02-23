// ===========================================
// DAJANA AI - Onboarding: Season Selection Screen
// ===========================================

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Season } from '@/types/database';
import { t } from '@/lib/i18n';

const ONBOARDING_CREAM = '#F8F4EF';

// Group seasons by main season with color palettes
const SEASON_GROUPS = [
  { 
    titleKey: 'seasons.spring', 
    colors: ['#FEB2B2', '#FEEBC8', '#C6F6D5'],
    seasons: ['light_spring', 'warm_spring', 'clear_spring'] as Season[] 
  },
  { 
    titleKey: 'seasons.summer', 
    colors: ['#BEE3F8', '#E9D8FD', '#FED7E2'],
    seasons: ['light_summer', 'cool_summer', 'soft_summer'] as Season[] 
  },
  { 
    titleKey: 'seasons.autumn', 
    colors: ['#F6AD55', '#B83280', '#744210'],
    seasons: ['soft_autumn', 'warm_autumn', 'deep_autumn'] as Season[] 
  },
  { 
    titleKey: 'seasons.winter', 
    colors: ['#2D3748', '#4A5568', '#E2E8F0'],
    seasons: ['deep_winter', 'cool_winter', 'clear_winter'] as Season[] 
  },
];

export default function SeasonScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, updateProfile } = useAuth();

  const [selectedSeason, setSelectedSeason] = useState<Season | null>(
    profile?.season || null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectSeason = (season: Season) => {
    setSelectedSeason(season);
  };

  const handleNext = async () => {
    if (!selectedSeason) {
      Alert.alert(t('onboarding.your_season'), t('onboarding.select_season'));
      return;
    }

    setIsLoading(true);
    try {
      // Ako je korisnica ovde, znači da je rekla DA na pitanje o analizi
      await updateProfile({ 
        season: selectedSeason,
        has_dajana_analysis: true 
      });
      router.push('/(onboarding)/complete');
    } catch (error) {
      console.error('Save season error:', error);
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress - Step 4 of 4 (only if user said YES to analysis) */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>
              {t('onboarding.step_of', { current: 4, total: 4 })}
            </Text>
          </View>

          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Feather name="chevron-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('onboarding.your_season')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.subtitle}>
              {t('onboarding.season_subtitle')}
            </Text>
          </View>

          {/* Season Groups */}
          <View style={styles.groupsContainer}>
            {SEASON_GROUPS.map((group) => (
              <View key={group.titleKey} style={styles.seasonGroup}>
                <View style={styles.groupHeader}>
                  <View style={styles.palette}>
                    {group.colors.map((color, idx) => (
                      <View key={idx} style={[styles.colorDot, { backgroundColor: color }]} />
                    ))}
                  </View>
                  <Text style={styles.groupTitle}>{t(group.titleKey)}</Text>
                </View>
                
                <View style={styles.seasonOptions}>
                  {group.seasons.map((seasonKey) => {
                    const isSelected = selectedSeason === seasonKey;
                    
                    return (
                      <TouchableOpacity
                        key={seasonKey}
                        style={[
                          styles.seasonOption,
                          isSelected && styles.seasonOptionSelected,
                        ]}
                        onPress={() => handleSelectSeason(seasonKey)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.seasonName,
                            isSelected && styles.seasonNameSelected,
                          ]}
                        >
                          {t(`seasons.${seasonKey}`)}
                        </Text>
                        {isSelected && (
                          <Feather
                            name="check"
                            size={18}
                            color={COLORS.secondary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Feather name="info" size={18} color={COLORS.secondary} />
            <Text style={styles.infoText}>
              {t('onboarding.season_info')}
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Button - No skip since user confirmed they did analysis */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <View style={styles.buttonContent}>
              <View style={{ width: 20 }} />
              {isLoading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
              )}
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
    paddingBottom: 140,
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
  groupsContainer: {
    gap: SPACING.xl,
  },
  seasonGroup: {
    gap: SPACING.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  palette: {
    flexDirection: 'row',
    gap: -4, // Overlapping dots
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  groupTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.heading.semibold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  seasonOptions: {
    gap: SPACING.sm,
  },
  seasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: COLORS.gray[200],
  },
  seasonOptionSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  seasonName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.medium,
    color: COLORS.gray[600],
  },
  seasonNameSelected: {
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
    marginTop: SPACING.xxl,
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
    paddingHorizontal: 20,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.black,
    letterSpacing: 0.5,
  },
});
