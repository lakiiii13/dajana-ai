import { useState } from 'react';
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
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { signInWithEmail } from '@/hooks/useAuth';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '@/constants/theme';
import { t } from '@/lib/i18n';

const AUTH_CREAM = '#F8F4EF';
const AUTH_LOGO = require('@/assets/images/login-signup.png');
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('auth.error_enter_email_password'));
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      let message = t('auth.error_generic');
      
      if (error.message?.includes('Invalid login credentials')) {
        message = t('auth.error_invalid_credentials');
      } else if (error.message?.includes('Email not confirmed')) {
        message = t('auth.error_email_not_confirmed');
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
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            <Text style={styles.title}>{t('auth.welcome_back')}</Text>
            <View style={styles.accentLine} />
            <Text style={styles.subtitle}>{t('auth.sign_in_subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor={colors.gray[400]}
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
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t('auth.password')}</Text>
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password_placeholder')}
                  placeholderTextColor={colors.gray[400]}
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
                    color={colors.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Section - Inside ScrollView */}
          <View style={styles.bottomSection}>
            {/* Login Button - Indyx Style */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <View style={styles.buttonContent}>
                <View style={{ width: 20 }} />
                {isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.sign_in')}</Text>
                )}
                <Feather name="arrow-right" size={20} color={colors.primary} />
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
              <Text style={styles.footerText}>{t('auth.no_account')} </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>{t('auth.register')}</Text>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.semibold,
    color: COLORS.primary,
    opacity: 0.8,
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
  forgotPasswordText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.primary.medium,
    color: COLORS.secondary,
    textDecorationLine: 'underline',
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
