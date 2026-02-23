import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { BODY_TYPES } from '@/constants/bodyTypes';

const CREAM = '#F8F4EF';
const GOLD = '#CF8F5A';
const CARD_BG = '#FFFCF9';
const DARK = '#2C2A28';
import { SEASONS } from '@/constants/seasons';
import { t } from '@/lib/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CreditDisplay } from '@/components/CreditDisplay';
import { getAllCredits, AllCredits } from '@/lib/creditService';
import { AppLogo } from '@/components/AppLogo';

const HAIRLINE_GOLD = 'rgba(207,143,90,0.30)';
const HAIRLINE_GREEN = 'rgba(13,67,38,0.12)';
const RADIUS = 22;

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { profile, credits, language, setLanguage, signOut } = useAuth();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [allCredits, setAllCredits] = useState<AllCredits | null>(null);

  // Load credits when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        getAllCredits(profile.id).then(setAllCredits).catch(console.error);
      }
    }, [profile?.id])
  );

  const handleLanguageChange = useCallback(async (lang: 'sr' | 'en') => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  }, [setLanguage]);

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleSignOut = () => {
    Alert.alert(
      t('profile.sign_out'),
      t('profile.sign_out_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('profile.sign_out'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert(t('error'), t('auth.error_generic'));
            }
          },
        },
      ]
    );
  };

  const getBodyTypeName = () => {
    if (!profile?.body_type) return t('profile.not_set');
    const bodyType = BODY_TYPES[profile.body_type];
    return language === 'en' ? bodyType?.en : bodyType?.sr || profile.body_type;
  };

  const getSeasonName = () => {
    if (!profile?.season) return t('profile.not_set');
    const season = SEASONS[profile.season];
    return language === 'en' ? season?.en : season?.sr || profile.season;
  };

  const notSet = t('profile.not_set');
  const bg = mode === 'dark' ? colors.background : CREAM;
  const surface = mode === 'dark' ? colors.surface : CARD_BG;
  const text = mode === 'dark' ? colors.text : DARK;
  const textMuted = mode === 'dark' ? colors.textSecondary : '#6F6A64';
  const border = mode === 'dark' ? 'rgba(232,226,218,0.16)' : HAIRLINE_GREEN;
  const borderGold = mode === 'dark' ? 'rgba(207,143,90,0.22)' : HAIRLINE_GOLD;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView style={styles.scrollWrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={[styles.heroWrap, { backgroundColor: bg }]}>
          <View style={[styles.heroCard, { backgroundColor: surface, borderColor: borderGold }]}>
            <LinearGradient
              colors={mode === 'dark' ? ['rgba(207,143,90,0.14)', 'rgba(207,143,90,0)'] : ['rgba(207,143,90,0.12)', 'rgba(207,143,90,0)']}
              locations={[0, 1]}
              style={styles.heroGlow}
            />

            <View style={styles.heroTopRow}>
              <Text style={[styles.pageTitle, { color: text }]}>Profil</Text>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}
                onPress={handleEditProfile}
                activeOpacity={0.85}
              >
                <Feather name="edit-2" size={18} color={GOLD} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarWrap}>
              <LinearGradient colors={[GOLD, '#E7C3A5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
                <View style={[styles.avatarInner, { backgroundColor: bg }]}>
                  <Text style={[styles.avatarText, { color: GOLD }]}>
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'K'}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <Text style={[styles.name, { color: text }]}>{profile?.full_name || (language === 'en' ? 'User' : 'Korisnik')}</Text>
            <Text style={[styles.email, { color: textMuted }]}>{profile?.email}</Text>

            <TouchableOpacity
              style={[styles.primaryCta, { backgroundColor: COLORS.primary, borderColor: borderGold }]}
              onPress={handleEditProfile}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryCtaText}>{t('profile.edit_data')}</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

      {/* Profile Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: text }]}>{t('profile.my_data')}</Text>
        
        <View style={[styles.infoCard, { backgroundColor: surface, borderColor: borderGold }]}>
          <InfoRow icon="user" label={t('profile.body_type')} value={getBodyTypeName()} isLast={false} textColor={text} mutedColor={textMuted} />
          <InfoRow icon="sun" label={t('profile.season')} value={getSeasonName()} isLast={false} textColor={text} mutedColor={textMuted} />
          <InfoRow 
            icon="maximize-2" 
            label={t('profile.height')} 
            value={profile?.height_cm ? `${profile.height_cm} cm` : notSet} 
            isLast={false}
            textColor={text}
            mutedColor={textMuted}
          />
          <InfoRow 
            icon="activity" 
            label={t('profile.weight')} 
            value={profile?.weight_kg ? `${profile.weight_kg} kg` : notSet} 
            isLast
            textColor={text}
            mutedColor={textMuted}
          />
        </View>
      </View>

      {/* Measurements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: text }]}>{t('profile.measurements')}</Text>
        
        <View style={[styles.infoCard, { backgroundColor: surface, borderColor: borderGold }]}>
          <InfoRow icon="circle" label={t('profile.bust')} value={profile?.bust_cm ? `${profile.bust_cm} cm` : notSet} isLast={false} textColor={text} mutedColor={textMuted} />
          <InfoRow icon="minus" label={t('profile.waist')} value={profile?.waist_cm ? `${profile.waist_cm} cm` : notSet} isLast={false} textColor={text} mutedColor={textMuted} />
          <InfoRow icon="circle" label={t('profile.hips')} value={profile?.hips_cm ? `${profile.hips_cm} cm` : notSet} isLast textColor={text} mutedColor={textMuted} />
        </View>
      </View>

      {/* Credits */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: text }]}>{t('profile.credits')}</Text>
        
        <View style={[styles.creditsCardNew, { backgroundColor: surface, borderColor: borderGold }]}>
          <CreditDisplay credits={allCredits} compact />
        </View>

        <TouchableOpacity style={[styles.secondaryCta, { backgroundColor: surface, borderColor: borderGold }]} activeOpacity={0.9}>
          <View style={styles.secondaryCtaLeft}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="plus-circle" size={18} color={GOLD} />
            </View>
            <Text style={[styles.secondaryCtaText, { color: text }]}>{t('profile.buy_more')}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(13,67,38,0.35)'} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <View style={[styles.menuCard, { backgroundColor: surface, borderColor: borderGold }]}>
          <View style={[styles.menuItem, styles.menuItemFirst, { borderBottomColor: border }]}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="sun" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.theme')}</Text>
            <ThemeToggle />
          </View>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: border }]} onPress={() => setShowLanguageModal(true)} activeOpacity={0.8}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="globe" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.language')}</Text>
            <Text style={[styles.menuItemValue, { color: textMuted }]}>{language === 'en' ? 'English' : 'Srpski'}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: border }]} activeOpacity={0.8} onPress={() => router.push('/notifications')}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="bell" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.notifications')}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: border }]} activeOpacity={0.8}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="help-circle" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.help')}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} activeOpacity={0.8}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="file-text" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.privacy_policy')}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: surface, borderColor: mode === 'dark' ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.30)' }]} onPress={handleSignOut} activeOpacity={0.9}>
        <Feather name="log-out" size={22} color={COLORS.error} />
        <Text style={styles.logoutText}>{t('profile.sign_out')}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <AppLogo height={24} maxWidth={120} />
        <Text style={styles.version}>v1.0.0</Text>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: surface, borderColor: borderGold }]}>
            <Text style={[styles.modalTitle, { color: text }]}>{t('profile.language')}</Text>
            
            <TouchableOpacity
              style={[styles.languageOption, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : CREAM, borderColor: border }, language === 'sr' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('sr')}
            >
              <Text style={[styles.languageText, { color: textMuted }, language === 'sr' && styles.languageTextActive]}>
                Srpski
              </Text>
              {language === 'sr' && (
                <Feather name="check" size={20} color={GOLD} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.languageOption, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : CREAM, borderColor: border }, language === 'en' && styles.languageOptionActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[styles.languageText, { color: textMuted }, language === 'en' && styles.languageTextActive]}>
                English
              </Text>
              {language === 'en' && (
                <Feather name="check" size={20} color={GOLD} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ 
  icon, 
  label, 
  value,
  isLast,
  textColor,
  mutedColor,
}: { 
  icon: string; 
  label: string; 
  value: string;
  isLast?: boolean;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowDivider]}>
      <View style={styles.infoLeft}>
        <Feather name={icon as any} size={20} color={GOLD} />
        <Text style={[styles.infoLabel, { color: mutedColor }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scrollWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  heroWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  heroCard: {
    borderRadius: RADIUS,
    padding: SPACING.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  pageTitle: {
    fontFamily: FONTS.logo,
    fontSize: 28,
    letterSpacing: 1.6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232,226,218,0.90)',
  },
  avatarText: {
    fontSize: FONT_SIZES['4xl'],
    fontFamily: FONTS.heading.bold,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.heading.semibold,
    color: DARK,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  email: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  primaryCta: {
    marginTop: SPACING.lg,
    borderRadius: 18,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 2,
  },
  primaryCtaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: DARK,
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: SPACING.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  infoRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,67,38,0.08)',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: DARK,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: GOLD,
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: GOLD,
    letterSpacing: 0.5,
  },
  creditsCardNew: {
    backgroundColor: CARD_BG,
    borderRadius: RADIUS,
    padding: SPACING.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  secondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
  },
  secondaryCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  secondaryCtaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
  },
  menuCard: {
    borderRadius: RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
  },
  menuItemFirst: {},
  menuItemLast: {
    borderBottomWidth: 0,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: DARK,
  },
  menuItemValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    margin: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.error,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.error,
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  version: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 300,
    borderWidth: 0.5,
    borderColor: 'rgba(207,143,90,0.15)',
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.heading.semibold,
    color: DARK,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    backgroundColor: CREAM,
    borderWidth: 0.5,
    borderColor: 'rgba(207,143,90,0.12)',
  },
  languageOptionActive: {
    backgroundColor: `${GOLD}18`,
    borderWidth: 0.5,
    borderColor: GOLD,
  },
  languageText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[600],
  },
  languageTextActive: {
    color: GOLD,
    fontFamily: FONTS.primary.semibold,
  },
});
