// ===========================================
// DAJANA AI – App logo (OSB znak POZITIV)
// Zajednička komponenta za header / brand tekst
// Fajl u assets/images: "OSB znak POZITIV.png" ili "OSB_znak_POZITIV.png"
// ===========================================

import { Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';

const LOGO = require('@/assets/images/OSB znak POZITIV.png');

interface AppLogoProps {
  height?: number;
  maxWidth?: number;
  style?: ImageStyle | ViewStyle;
}

export function AppLogo({ height = 40, maxWidth = 200, style }: AppLogoProps) {
  return (
    <Image
      source={LOGO}
      style={[styles.logo, { height, width: maxWidth, maxWidth }, style]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {},
});
