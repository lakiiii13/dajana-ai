// ===========================================
// DAJANA AI - Language Switcher Component
// ===========================================

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS, FONT_SIZES } from '@/constants/theme';
import { getLanguage, setLanguage } from '@/lib/i18n';

interface LanguageSwitcherProps {
  onLanguageChange?: (lang: 'sr' | 'en') => void;
}

export function LanguageSwitcher({ onLanguageChange }: LanguageSwitcherProps) {
  const [currentLang, setCurrentLang] = useState<'sr' | 'en'>(getLanguage());

  const handleLanguageChange = (lang: 'sr' | 'en') => {
    setLanguage(lang);
    setCurrentLang(lang);
    onLanguageChange?.(lang);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, currentLang === 'sr' && styles.buttonActive]}
        onPress={() => handleLanguageChange('sr')}
      >
        <Text style={[styles.buttonText, currentLang === 'sr' && styles.buttonTextActive]}>
          SR
        </Text>
      </TouchableOpacity>
      <View style={styles.divider} />
      <TouchableOpacity
        style={[styles.button, currentLang === 'en' && styles.buttonActive]}
        onPress={() => handleLanguageChange('en')}
      >
        <Text style={[styles.buttonText, currentLang === 'en' && styles.buttonTextActive]}>
          EN
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: 20,
    padding: 4,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  buttonActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.primary.medium,
    color: COLORS.gray[500],
  },
  buttonTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.primary.semibold,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.gray[300],
    marginHorizontal: 4,
  },
});
