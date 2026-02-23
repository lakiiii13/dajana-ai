// ===========================================
// DAJANA AI - Edit Profile Modal
// ===========================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { calculateBodyType } from '@/constants/bodyTypes';
import { Season } from '@/types/database';
import { t } from '@/lib/i18n';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, updateProfile, fetchProfile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    height_cm: '',
    weight_kg: '',
    bust_cm: '',
    waist_cm: '',
    hips_cm: '',
    season: '' as Season | '',
  });

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        height_cm: profile.height_cm?.toString() || '',
        weight_kg: profile.weight_kg?.toString() || '',
        bust_cm: profile.bust_cm?.toString() || '',
        waist_cm: profile.waist_cm?.toString() || '',
        hips_cm: profile.hips_cm?.toString() || '',
        season: profile.season || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    if (['height_cm', 'weight_kg', 'bust_cm', 'waist_cm', 'hips_cm'].includes(field)) {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSelectSeason = (season: Season) => {
    setFormData(prev => ({ 
      ...prev, 
      season: prev.season === season ? '' : season 
    }));
  };

  const validateForm = () => {
    const { bust_cm, waist_cm, hips_cm, height_cm } = formData;
    
    if (height_cm) {
      const height = parseInt(height_cm);
      if (height < 100 || height > 250) {
        Alert.alert(t('error'), t('edit_profile.error_height'));
        return false;
      }
    }

    if (bust_cm && waist_cm && hips_cm) {
      const bust = parseInt(bust_cm);
      const waist = parseInt(waist_cm);
      const hips = parseInt(hips_cm);

      if (bust < 60 || bust > 200 || waist < 40 || waist > 200 || hips < 60 || hips > 200) {
        Alert.alert(t('error'), t('edit_profile.error_measurements'));
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updates: any = {
        full_name: formData.full_name || null,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        bust_cm: formData.bust_cm ? parseInt(formData.bust_cm) : null,
        waist_cm: formData.waist_cm ? parseInt(formData.waist_cm) : null,
        hips_cm: formData.hips_cm ? parseInt(formData.hips_cm) : null,
        season: formData.season || null,
      };

      // Recalculate body type if measurements changed
      if (updates.bust_cm && updates.waist_cm && updates.hips_cm) {
        updates.body_type = calculateBodyType(
          updates.bust_cm,
          updates.waist_cm,
          updates.hips_cm
        );
      }

      await updateProfile(updates);
      await fetchProfile();
      
      Alert.alert(t('edit_profile.success'), t('edit_profile.profile_updated'), [
        { text: t('ok'), onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert(t('error'), t('edit_profile.error_save'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  // Group seasons for display
  const seasonGroups = [
    { titleKey: 'seasons.spring', icon: '🌸', seasons: ['light_spring', 'warm_spring', 'clear_spring'] as Season[] },
    { titleKey: 'seasons.summer', icon: '☀️', seasons: ['light_summer', 'cool_summer', 'soft_summer'] as Season[] },
    { titleKey: 'seasons.autumn', icon: '🍂', seasons: ['soft_autumn', 'warm_autumn', 'deep_autumn'] as Season[] },
    { titleKey: 'seasons.winter', icon: '❄️', seasons: ['deep_winter', 'cool_winter', 'clear_winter'] as Season[] },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('edit_profile.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('edit_profile.personal_data')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('edit_profile.full_name')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('edit_profile.full_name_placeholder')}
                value={formData.full_name}
                onChangeText={(v) => handleChange('full_name', v)}
              />
            </View>
          </View>

          {/* Measurements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('edit_profile.measurements')}</Text>
            
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.label}>{t('edit_profile.height')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputWithUnit}
                    placeholder="165"
                    keyboardType="numeric"
                    value={formData.height_cm}
                    onChangeText={(v) => handleChange('height_cm', v)}
                    maxLength={3}
                  />
                  <Text style={styles.unit}>cm</Text>
                </View>
              </View>
              
              <View style={[styles.inputGroup, styles.halfInput]}>
                <Text style={styles.label}>{t('edit_profile.weight')}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.inputWithUnit}
                    placeholder="60"
                    keyboardType="numeric"
                    value={formData.weight_kg}
                    onChangeText={(v) => handleChange('weight_kg', v)}
                    maxLength={5}
                  />
                  <Text style={styles.unit}>kg</Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('edit_profile.bust')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputWithUnit}
                  placeholder="90"
                  keyboardType="numeric"
                  value={formData.bust_cm}
                  onChangeText={(v) => handleChange('bust_cm', v)}
                  maxLength={3}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('edit_profile.waist')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputWithUnit}
                  placeholder="70"
                  keyboardType="numeric"
                  value={formData.waist_cm}
                  onChangeText={(v) => handleChange('waist_cm', v)}
                  maxLength={3}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('edit_profile.hips')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.inputWithUnit}
                  placeholder="95"
                  keyboardType="numeric"
                  value={formData.hips_cm}
                  onChangeText={(v) => handleChange('hips_cm', v)}
                  maxLength={3}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
            </View>
          </View>

          {/* Season Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('edit_profile.color_season')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('edit_profile.color_season_subtitle')}
            </Text>

            {seasonGroups.map((group) => (
              <View key={group.titleKey} style={styles.seasonGroup}>
                <View style={styles.seasonGroupHeader}>
                  <Text style={styles.seasonGroupIcon}>{group.icon}</Text>
                  <Text style={styles.seasonGroupTitle}>{t(group.titleKey)}</Text>
                </View>
                
                <View style={styles.seasonOptions}>
                  {group.seasons.map((seasonKey) => {
                    const isSelected = formData.season === seasonKey;
                    
                    return (
                      <TouchableOpacity
                        key={seasonKey}
                        style={[
                          styles.seasonChip,
                          isSelected && styles.seasonChipSelected,
                        ]}
                        onPress={() => handleSelectSeason(seasonKey)}
                      >
                        <Text
                          style={[
                            styles.seasonChipText,
                            isSelected && styles.seasonChipTextSelected,
                          ]}
                        >
                          {t(`seasons.${seasonKey}`)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Ionicons name="checkmark" size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>
              {isLoading ? t('edit_profile.saving') : t('edit_profile.save_changes')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.black,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: COLORS.gray[700],
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    backgroundColor: COLORS.gray[50],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[50],
  },
  inputWithUnit: {
    flex: 1,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
  },
  unit: {
    paddingRight: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
  },
  seasonGroup: {
    marginBottom: SPACING.md,
  },
  seasonGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  seasonGroupIcon: {
    fontSize: 16,
  },
  seasonGroupTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: COLORS.gray[600],
  },
  seasonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  seasonChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  seasonChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  seasonChipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: COLORS.gray[700],
  },
  seasonChipTextSelected: {
    color: COLORS.white,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.white,
  },
});
