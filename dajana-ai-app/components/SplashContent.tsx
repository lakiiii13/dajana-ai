// ===========================================
// DAJANA AI - Splash UI (OSB znak + ispis imena i slogana)
// Bez crop-a: prikazuje se cela slika "OSB znak.png"
// ===========================================

import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { SPACING, FONTS, COLORS } from '@/constants/theme';

const SPLASH_LOGO = require('@/assets/images/splash-osb-znak.png');

const LINE1_FULL = 'dajana zgonjanin';
const LINE2_THIN = 'OTKRIJ ';
const LINE2_BOLD = 'SVOJE BOJE';
const CHAR_DELAY_MS = 72;

const GREEN_MAIN = COLORS.primary;
const GREEN_LIGHT = '#3d7a52';

export function SplashContent() {
  const { width } = useWindowDimensions();
  const logoSize = Math.min(width * 0.46, 230);

  const [line1Len, setLine1Len] = useState(0);
  const [line2Len, setLine2Len] = useState(0);
  const cursorOpacity = useState(() => new Animated.Value(1))[0];
  const totalChars = LINE1_FULL.length + LINE2_THIN.length + LINE2_BOLD.length;
  const typedSoFar = line1Len + line2Len;
  const typingDone = typedSoFar >= totalChars;

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

  useEffect(() => {
    if (typingDone) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0,
          duration: 420,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [typingDone, cursorOpacity]);

  const line1Visible = LINE1_FULL.slice(0, line1Len);
  const line2ThinVisible = LINE2_THIN.slice(0, Math.min(line2Len, LINE2_THIN.length));
  const line2BoldVisible = LINE2_BOLD.slice(0, Math.max(0, line2Len - LINE2_THIN.length));

  const showCursorLine1 = !typingDone && line1Len < LINE1_FULL.length;
  const showCursorLine2 = !typingDone && line1Len >= LINE1_FULL.length;

  return (
    <View style={styles.container}>
      <Image
        source={SPLASH_LOGO}
        style={[styles.logo, { width: logoSize, height: logoSize }]}
        resizeMode="contain"
        accessibilityLabel="OSB"
      />

      <View style={styles.textBlock}>
        <View style={[styles.lineRow, styles.lineRowFirst]}>
          <Text style={styles.line1}>{line1Visible}</Text>
          {showCursorLine1 ? (
            <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>|</Animated.Text>
          ) : null}
        </View>

        <View style={[styles.lineRow, styles.lineRowSecond]}>
          <Text style={styles.line2Thin}>{line2ThinVisible}</Text>
          <Text style={styles.line2Bold}>{line2BoldVisible}</Text>
          {showCursorLine2 ? (
            <Animated.Text style={[styles.cursorLine2, { opacity: cursorOpacity }]}>|</Animated.Text>
          ) : null}
        </View>
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
    backgroundColor: COLORS.onboarding_cream,
  },
  logo: {},
  textBlock: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  lineRowFirst: {
    marginTop: 0,
  },
  lineRowSecond: {
    marginTop: 10,
  },
  line1: {
    fontFamily: FONTS.primary.thin,
    fontSize: 18,
    letterSpacing: 2,
    color: GREEN_MAIN,
    textTransform: 'lowercase',
  },
  line2Thin: {
    fontFamily: FONTS.primary.thin,
    fontSize: 14,
    letterSpacing: 3.5,
    color: GREEN_LIGHT,
  },
  line2Bold: {
    fontFamily: FONTS.primary.bold,
    fontSize: 14,
    letterSpacing: 3.5,
    color: GREEN_MAIN,
  },
  cursor: {
    fontFamily: FONTS.primary.medium,
    color: GREEN_MAIN,
    fontSize: 18,
    marginLeft: 1,
  },
  cursorLine2: {
    fontFamily: FONTS.primary.medium,
    color: GREEN_MAIN,
    fontSize: 14,
    marginLeft: 1,
  },
});
