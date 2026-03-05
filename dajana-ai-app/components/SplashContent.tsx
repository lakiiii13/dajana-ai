// ===========================================
// DAJANA AI - Splash UI (OSB pozitiv logo + ispis teksta, sva slova bold)
// ===========================================

import { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Text, useWindowDimensions } from 'react-native';
import { SPACING, FONTS } from '@/constants/theme';

const SPLASH_LOGO = require('@/assets/images/OSB znak POZITIV.png');

const LINE1_FULL = 'dajana zgonjanin';
const LINE2_THIN = 'OTKRIJ ';
const LINE2_BOLD = 'SVOJE BOJE';
const CHAR_DELAY_MS = 75;

export function SplashContent() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.4, 200);

  const [line1Len, setLine1Len] = useState(0);
  const [line2Len, setLine2Len] = useState(0);

  useEffect(() => {
    if (line1Len < LINE1_FULL.length) {
      const t = setTimeout(() => setLine1Len((n) => n + 1), CHAR_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (line2Len < LINE2_THIN.length + LINE2_BOLD.length) {
      const t = setTimeout(() => setLine2Len((n) => n + 1), CHAR_DELAY_MS);
      return () => clearTimeout(t);
    }
  }, [line1Len, line2Len]);

  const line1Visible = LINE1_FULL.slice(0, line1Len);
  const line2ThinVisible = LINE2_THIN.slice(0, Math.min(line2Len, LINE2_THIN.length));
  const line2BoldVisible = LINE2_BOLD.slice(0, Math.max(0, line2Len - LINE2_THIN.length));

  return (
    <View style={styles.container}>
      <Image
        source={SPLASH_LOGO}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
      />
      <View style={styles.textBlock}>
        <Text style={styles.line1}>{line1Visible}</Text>
        <Text style={styles.line2}>
          <Text style={styles.line2Thin}>{line2ThinVisible}</Text>
          <Text style={styles.line2Bold}>{line2BoldVisible}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: '#ffffff',
  },
  logo: {
    width: 200,
    height: 200,
  },
  textBlock: {
    marginTop: SPACING.lg + 4,
    alignItems: 'center',
  },
  line1: {
    fontFamily: FONTS.primary.thin,
    fontSize: 18,
    letterSpacing: 2,
    color: '#000000',
    textTransform: 'lowercase',
  },
  line2: {
    marginTop: 10,
    fontSize: 14,
    letterSpacing: 3,
    color: '#000000',
  },
  line2Thin: {
    fontFamily: FONTS.primary.thin,
  },
  line2Bold: {
    fontFamily: FONTS.primary.bold,
  },
});
