import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { CreditDisplay } from '@/components/CreditDisplay';
import { deleteMyAccount } from '@/lib/deleteAccount';

const HAIRLINE_GOLD = 'rgba(207,143,90,0.30)';
const HAIRLINE_GREEN = 'rgba(13,67,38,0.12)';
const RADIUS = 22;

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scrollToCredits?: string }>();
  const { colors, mode } = useTheme();
  const { profile, allCredits, fetchCredits, fetchSubscription, language, setLanguage, signOut } = useAuth();

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyScrollEnabled, setPrivacyScrollEnabled] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const privacyScrollRef = useRef<ScrollView>(null);

  const handlePrivacyTap = useCallback(() => {
    setPrivacyScrollEnabled(true);
    requestAnimationFrame(() => {
      privacyScrollRef.current?.scrollToEnd({ animated: true });
      setTimeout(() => setPrivacyScrollEnabled(false), 500);
    });
  }, []);

  useEffect(() => {
    if (showPrivacyModal) {
      setPrivacyScrollEnabled(false);
      setTimeout(() => privacyScrollRef.current?.scrollTo({ y: 0, animated: false }), 0);
    }
  }, [showPrivacyModal]);

  const HELP_EMAIL = 'dzgonjanin@otkrijsvojeboje.com';
  const creditsSectionY = useRef(0);

  // Osveži kredite kad uđeš na Profil (da se vidi ažurirano posle skidanja)
  useFocusEffect(
    useCallback(() => {
      if (profile?.id) {
        fetchCredits();
        fetchSubscription();
      }
    }, [profile?.id, fetchCredits, fetchSubscription])
  );

  const handleLanguageChange = useCallback(async (lang: 'sr' | 'en') => {
    await setLanguage(lang);
    setShowLanguageModal(false);
  }, [setLanguage]);

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleOpenNotificationSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      try {
        await Linking.openURL('app-settings:');
      } catch {
        Alert.alert(t('error'), 'Nije moguće otvoriti podešavanja aplikacije.');
      }
    }
  }, []);

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

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.delete_account'),
      t('profile.delete_account_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('profile.delete_account'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMyAccount();
              await signOut();
              Alert.alert(t('profile.delete_account'), t('profile.delete_account_success'));
              router.replace('/(auth)');
            } catch (err: any) {
              Alert.alert(t('error'), err?.message ?? t('auth.error_generic'));
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

  const scrollToCreditsIfRequested = useCallback(() => {
    if (params.scrollToCredits && scrollRef.current) {
      const y = Math.max(0, creditsSectionY.current - 24);
      scrollRef.current.scrollTo({ y, animated: true });
      router.setParams({ scrollToCredits: undefined });
    }
  }, [params.scrollToCredits, router]);

  useEffect(() => {
    if (!params.scrollToCredits) return;
    const t = setTimeout(scrollToCreditsIfRequested, 200);
    return () => clearTimeout(t);
  }, [params.scrollToCredits, scrollToCreditsIfRequested]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <ScrollView ref={scrollRef} style={styles.scrollWrap} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity onPress={handleEditProfile} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={[styles.editLink, { color: GOLD }]}>{t('profile.edit_link')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.name, { color: text }]}>{profile?.full_name || t('profile_user')}</Text>
            <Text style={[styles.email, { color: textMuted }]}>{profile?.email}</Text>

            <TouchableOpacity
              style={[styles.primaryCta, { backgroundColor: 'transparent', borderColor: borderGold }]}
              onPress={handleEditProfile}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryCtaText, { color: text }]}>{t('profile.edit_data')}</Text>
              <Feather name="chevron-right" size={18} color={GOLD} style={{ opacity: 0.9 }} />
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

      {/* Credits — scroll target kada se dođe sa home ikonice kredita */}
      <View
        style={styles.section}
        onLayout={(e) => {
          creditsSectionY.current = e.nativeEvent.layout.y;
          if (params.scrollToCredits) setTimeout(scrollToCreditsIfRequested, 100);
        }}
      >
        <Text style={[styles.sectionTitle, { color: text }]}>{t('profile.credits')}</Text>
        
        <View style={[styles.creditsCardNew, { backgroundColor: surface, borderColor: borderGold }]}>
          <CreditDisplay credits={allCredits} compact />
        </View>

        <TouchableOpacity style={[styles.secondaryCta, { backgroundColor: surface, borderColor: borderGold }]} onPress={() => router.push('/shop')} activeOpacity={0.9}>
          <View style={styles.secondaryCtaLeft}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="plus" size={16} color={GOLD} />
            </View>
            <Text style={[styles.secondaryCtaText, { color: text }]}>{t('profile.buy_more')}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={GOLD} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      </View>

      {/* Sačuvano – outfiti, slike, videi */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.secondaryCta, { backgroundColor: surface, borderColor: borderGold }]} onPress={() => router.push('/saved')} activeOpacity={0.9}>
          <View style={styles.secondaryCtaLeft}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="heart" size={18} color={GOLD} />
            </View>
            <Text style={[styles.secondaryCtaText, { color: text }]}>{t('profile.saved_menu')}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={GOLD} style={{ opacity: 0.7 }} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <View style={[styles.menuCard, { backgroundColor: surface, borderColor: borderGold }]}>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemFirst, { borderBottomColor: border }]} onPress={() => setShowLanguageModal(true)} activeOpacity={0.8}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="globe" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.language')}</Text>
            <Text style={[styles.menuItemValue, { color: textMuted }]}>{language === 'en' ? t('profile_language_en') : t('profile_language_sr')}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: border }]} activeOpacity={0.8} onPress={handleOpenNotificationSettings}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="bell" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.notifications')}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: border }]} onPress={() => setShowHelpModal(true)} activeOpacity={0.8}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="help-circle" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.help')}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={() => setShowPrivacyModal(true)} activeOpacity={0.8}>
            <View style={[styles.iconPill, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : CREAM, borderColor: border }]}>
              <Feather name="file-text" size={18} color={GOLD} />
            </View>
            <Text style={[styles.menuItemText, { color: text }]}>{t('profile.privacy_policy')}</Text>
            <Feather name="chevron-right" size={20} color={mode === 'dark' ? 'rgba(255,255,255,0.35)' : COLORS.gray[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.9}>
        <Feather name="log-out" size={22} color="#FFFFFF" />
        <Text style={styles.logoutText}>{t('profile.sign_out')}</Text>
      </TouchableOpacity>

      {/* Obriši nalog – skroz na dnu */}
      <TouchableOpacity style={[styles.deleteAccountButton, { backgroundColor: surface, borderColor: mode === 'dark' ? 'rgba(120,120,120,0.4)' : 'rgba(0,0,0,0.12)' }]} onPress={handleDeleteAccount} activeOpacity={0.9}>
        <Feather name="trash-2" size={20} color={COLORS.gray[500]} />
        <Text style={[styles.deleteAccountText, { color: colors.textSecondary }]}>{t('profile.delete_account')}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.version, { color: textMuted }]}>v1.0.0</Text>
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

      {/* Pomoć – popup sa emailom */}
      <Modal visible={showHelpModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowHelpModal(false)}>
          <TouchableOpacity style={[styles.modalContent, { backgroundColor: surface, borderColor: borderGold }]} activeOpacity={1} onPress={() => {}}>
            <Text style={[styles.modalTitle, { color: text }]}>{t('profile.help')}</Text>
            <Text style={[styles.helpModalText, { color: textMuted }]}>
              Za pomoć nam pišite na email:
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${HELP_EMAIL}`)} activeOpacity={0.8}>
              <Text style={[styles.helpEmail, { color: GOLD }]}>{HELP_EMAIL}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalCloseBtn, { borderColor: borderGold }]} onPress={() => setShowHelpModal(false)} activeOpacity={0.85}>
              <Text style={[styles.modalCloseBtnText, { color: text }]}>OK</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Politika privatnosti – tap spušta do kraja teksta, nema swipe */}
      <Modal visible={showPrivacyModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPrivacyModal(false)}>
          <TouchableOpacity
            style={[styles.privacyModalContent, { backgroundColor: surface, borderColor: borderGold }]}
            activeOpacity={1}
            onPress={handlePrivacyTap}
          >
            <ScrollView
              ref={privacyScrollRef}
              style={[styles.privacyScroll, { maxHeight: Dimensions.get('window').height * 0.5 }]}
              contentContainerStyle={styles.privacyScrollContent}
              scrollEnabled={privacyScrollEnabled}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.privacyTitle, { color: text }]}>Politika privatnosti</Text>
              <Text style={[styles.privacyBody, { color: textMuted }]}>
                Aplikacija DAJANA AI poštuje vašu privatnost. Prikupljamo samo podatke neophodne za pružanje usluge: email, ime i mere koje unesete u profil, kao i podatke o korišćenju kredita (slike, videi, analize). Vaši podaci se ne dele sa trećim stranama u marketinške svrhe.{'\n\n'}
                Slike koje otpremite za virtual try-on i generisanje videa obrađuju se putem pouzdanih servisa u svrhu generisanja sadržaja i ne čuvaju se duže od potrebnog.{'\n\n'}
                Možete u bilo kom trenutku zatražiti pristup, ispravku ili brisanje svojih podataka. Za sva pitanja u vezi sa privatnošću i za zahteve obavestite nas putem emaila:{'\n\n'}
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${HELP_EMAIL}`)} activeOpacity={0.8}>
                <Text style={[styles.helpEmail, { color: GOLD }]}>{HELP_EMAIL}</Text>
              </TouchableOpacity>
              <Text style={[styles.privacyBody, { color: textMuted }]}>
                {'\n\n'}Poslednja izmena: 2025.
              </Text>
            </ScrollView>
            <TouchableOpacity style={[styles.modalCloseBtn, { borderColor: borderGold }]} onPress={() => setShowPrivacyModal(false)} activeOpacity={0.85}>
              <Text style={[styles.modalCloseBtnText, { color: text }]}>Zatvori</Text>
            </TouchableOpacity>
          </TouchableOpacity>
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
  editLink: {
    fontFamily: FONTS.primary.medium,
    fontSize: 15,
    letterSpacing: 0.4,
  },
  name: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.heading.semibold,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: SPACING.xs,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 14,
    borderWidth: 1,
  },
  primaryCtaText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    letterSpacing: 0.4,
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
    borderRadius: 20,
    borderBottomLeftRadius: 6,
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
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    borderWidth: 0,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: '#FFFFFF',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteAccountText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
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
  helpModalText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  helpEmail: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    textDecorationLine: 'underline',
  },
  modalCloseBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
  },
  privacyModalContent: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 360,
    maxHeight: '85%',
    minHeight: 280,
    borderWidth: 0.5,
    borderColor: 'rgba(207,143,90,0.15)',
    flexDirection: 'column',
  },
  privacyScroll: {
    marginBottom: SPACING.md,
  },
  privacyScrollContent: {
    paddingRight: 4,
    paddingBottom: SPACING.lg,
  },
  privacyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.heading.semibold,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  privacyBody: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
});
