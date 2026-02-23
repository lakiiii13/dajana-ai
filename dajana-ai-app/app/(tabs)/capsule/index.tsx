// ===========================================
// DAJANA AI - Kapsula Choice Screen
// Split 50/50: KAPSULA (gradi outfit) | ORMAR (gotovi outfiti)
// Animirana zlatna linija u centru
// ===========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FONTS } from '@/constants/theme';

const { width: W, height: H } = Dimensions.get('window');

const TABLE_IMG = require('@/assets/images/table-outfit.jpg');
const CLOSET_IMG = require('@/assets/images/slika_za_kapsulu.jpg');

const GOLD = '#CF8F5A';
const CREAM = '#F8F4EF';
const DARK = '#1A1A1A';

export default function CapsuleChoiceScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Leva polovina: KAPSULA – tekst u sredini, primamljiv */}
      <TouchableOpacity
        style={styles.half}
        activeOpacity={0.88}
        onPress={() => router.push('/(tabs)/capsule/table-builder' as any)}
      >
        <ImageBackground source={TABLE_IMG} style={styles.halfBg} resizeMode="cover">
          <View style={styles.halfOverlay} />
          <Animated.View
            entering={FadeIn.delay(200).duration(500)}
            style={[styles.labelWrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.labelCard}>
              <Text style={styles.labelSub}>Gradi sam</Text>
              <Text style={styles.labelTitle}>KAPSULA</Text>
              <View style={styles.labelLine} />
              <Text style={styles.labelDesc}>Složi outfit komad po komad</Text>
              <Text style={styles.labelCta}>Uđi</Text>
            </View>
          </Animated.View>
        </ImageBackground>
      </TouchableOpacity>

      {/* Desna polovina: ORMAR – tekst u sredini, primamljiv */}
      <TouchableOpacity
        style={styles.half}
        activeOpacity={0.88}
        onPress={() => router.push('/(tabs)/capsule/closet' as any)}
      >
        <ImageBackground source={CLOSET_IMG} style={styles.halfBg} resizeMode="cover">
          <View style={[styles.halfOverlay, { backgroundColor: 'rgba(10,10,8,0.52)' }]} />
          <Animated.View
            entering={FadeIn.delay(320).duration(500)}
            style={[styles.labelWrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}
          >
            <View style={styles.labelCard}>
              <Text style={styles.labelSub}>Gotovi outfiti</Text>
              <Text style={styles.labelTitle}>ORMAR</Text>
              <View style={styles.labelLine} />
              <Text style={styles.labelDesc}>Izaberi outfit iz svog ormara</Text>
              <Text style={styles.labelCta}>Uđi</Text>
            </View>
          </Animated.View>
        </ImageBackground>
      </TouchableOpacity>

      {/* Tanka elegantna linija u sredini */}
      <View style={styles.dividerContainer} pointerEvents="none">
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: DARK,
  },

  half: {
    flex: 1,
    height: H,
  },

  halfBg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  halfOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,6,0.48)',
  },

  labelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  labelCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(207,143,90,0.4)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    minWidth: 120,
  },

  labelSub: {
    fontFamily: FONTS.primary.light,
    fontSize: 9,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  labelTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 20,
    color: CREAM,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  labelLine: {
    width: 24,
    height: 1.5,
    backgroundColor: GOLD,
    marginTop: 8,
    marginBottom: 10,
    opacity: 0.9,
  },

  labelDesc: {
    fontFamily: FONTS.primary.light,
    fontSize: 11,
    color: 'rgba(248,244,239,0.85)',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },

  labelCta: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 11,
    color: GOLD,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    overflow: 'hidden',
  },

  /* ===== Divider – tanka elegantna linija ===== */
  dividerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: W / 2 - 0.5,
    width: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(207,143,90,0.5)',
  },
});
