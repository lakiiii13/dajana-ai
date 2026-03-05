import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signUpWithEmail } from '@/hooks/useAuth';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';

const AUTH_CREAM = '#F8F4EF';
const AUTH_LOGO = require('@/assets/images/login-signup.png');
import { useTheme } from '@/contexts/ThemeContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert(t('error'), t('auth.error_fill_all_fields'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('auth.error_password_too_short'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('auth.error_password_mismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await signUpWithEmail(email, password, fullName);
      
      if (user?.identities?.length === 0) {
        Alert.alert(
          t('auth.account_exists'),
          t('auth.account_exists_message')
        );
      } else {
        Alert.alert(
          t('auth.success_registered'),
          t('auth.success_check_email'),
          [{ text: t('ok') }]
        );
      }
    } catch (error: any) {
      console.error('Register error:', error);
      let message = t('auth.error_generic');
      
      if (error.message?.includes('already registered')) {
        message = t('auth.error_email_exists');
      }
      
      Alert.alert(t('error'), message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: AUTH_CREAM }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={AUTH_LOGO} style={styles.logoImage} resizeMode="contain" />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{t('auth.create_account')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.subtitle}>{t('auth.sign_up_subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.full_name')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.full_name_placeholder')}
                  placeholderTextColor={COLORS.gray[400]}
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor={COLORS.gray[400]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  textContentType="emailAddress"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.min_password')}
                  placeholderTextColor={COLORS.gray[400]}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  textContentType="none"
                  autoComplete="off"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.confirm_password')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.confirm_password_placeholder')}
                  placeholderTextColor={COLORS.gray[400]}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  textContentType="none"
                  autoComplete="off"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Section - Inside ScrollView so it scrolls with content */}
          <View style={styles.bottomSection}>
            {/* Register Button - Indyx Style */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                <View style={{ width: 20 }} />
                {isLoading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.sign_up')}</Text>
                )}
                <Feather name="arrow-right" size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>

            {/* Decorative Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.have_account')} </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_CREAM,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  logoImage: {
    width: 200,
    height: 36,
    maxWidth: '70%',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.heading.semibold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  accentLine: {
    width: 30,
    height: 1,
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.md,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  form: {
    gap: SPACING.lg,
  },
  inputContainer: {
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    opacity: 0.8,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.regular,
    color: COLORS.black,
  },
  eyeButton: {
    padding: SPACING.xs,
  },
  bottomSection: {
    marginTop: SPACING.xxl,
    paddingTop: SPACING.lg,
  },
  button: {
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 2,
    borderWidth: 0,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.primary.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    opacity: 0.4,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: COLORS.gray[400],
  },
  dividerDiamond: {
    width: 4,
    height: 4,
    backgroundColor: COLORS.primary,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.regular,
    color: COLORS.gray[500],
  },
  footerLink: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
  },
});
