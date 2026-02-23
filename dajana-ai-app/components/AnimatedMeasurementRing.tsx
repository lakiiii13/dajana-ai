// ===========================================
// AnimatedMeasurementRing – statičan prsten (bez animacija)
// Vidljiv samo na Grudi / Struk / Kukovi. Polukrug nagnut ka kameri.
// ===========================================

import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, LinearGradient, Stop } from 'react-native-svg';

const GOLD_PRIMARY = '#E8B84C';
const GOLD_BRIGHT = '#F5D88A';
const GOLD_GLOW = '#E8B84C';

export interface AnimatedMeasurementRingProps {
  visible: boolean;
  color?: string;
}

export function AnimatedMeasurementRing({
  visible,
  color = GOLD_PRIMARY,
}: AnimatedMeasurementRingProps) {
  if (!visible) return null;

  return (
    <View
      style={[styles.fill, styles.tilt]}
      pointerEvents="none"
      collapsable={false}
    >
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={GOLD_BRIGHT} stopOpacity="1" />
            <Stop offset="50%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={GOLD_GLOW} stopOpacity="0.95" />
          </LinearGradient>
        </Defs>
        <Path d="M 0 50 A 50 50 0 0 0 100 50" stroke={color} strokeWidth={8} fill="none" opacity={0.25} />
        <Path d="M 1 50 A 49 49 0 0 0 99 50" stroke={color} strokeWidth={5} fill="none" opacity={0.4} />
        <Path d="M 3 50 A 47 47 0 0 0 97 50" stroke="url(#ringGradient)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  tilt: {
    transform: [{ perspective: 500 }, { rotateX: '-24deg' }],
  },
});
