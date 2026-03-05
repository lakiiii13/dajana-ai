// ===========================================
// DAJANA AI - Onboarding: Measurements Screen
// Premium interactive measuring flow
// ===========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import { COLORS, FONTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { calculateBodyType } from '@/constants/bodyTypes';
import { t } from '@/lib/i18n';

const { width: W, height: H } = Dimensions.get('window');

const SILHOUETTE_WIDTH = W * 0.92;
const SILHOUETTE_HEIGHT = 500;

const DAJANA_MERE_IMG = require('@/assets/images/dajana_mere.png');
const ONBOARDING_CREAM = '#F8F4EF';
const DARK = '#1A1A1A';

// Sve u primarnoj (tamno zelenoj) boji brenda
const APP_RING_COLOR = COLORS.primary;
const CREAM_RING = '#D8D2CA';

// Measurements Steps
type StepId = 'height_cm' | 'bust_cm' | 'waist_cm' | 'hips_cm' | 'weight_kg';

interface MeasureStep {
  id: StepId;
  title: string;
  min: number;
  max: number;
  initial: number;
  unit: string;
  ringY: number;
  ringW: number;
  ringH: number;
}

function getSteps(): MeasureStep[] {
  return [
    { id: 'height_cm', title: t('onboarding.height'), min: 140, max: 220, initial: 165, unit: 'cm', ringY: 170, ringW: 0, ringH: 0 },
    { id: 'bust_cm', title: t('onboarding.bust'), min: 60, max: 150, initial: 90, unit: 'cm', ringY: 114, ringW: 146, ringH: 125 },
    { id: 'waist_cm', title: t('onboarding.waist'), min: 50, max: 130, initial: 70, unit: 'cm', ringY: 214, ringW: 114, ringH: 100 },
    { id: 'hips_cm', title: t('onboarding.hips'), min: 60, max: 150, initial: 95, unit: 'cm', ringY: 316, ringW: 168, ringH: 146 },
    { id: 'weight_kg', title: t('onboarding.weight'), min: 40, max: 130, initial: 60, unit: 'kg', ringY: 170, ringW: 0, ringH: 0 },
  ];
}

const TICK_SPACING = 12;
const HALF_WIDTH = W / 2;

// --- RULER COMPONENT ---
function RulerPicker({
  step,
  value,
  onChange,
}: {
  step: MeasureStep;
  value: number;
  onChange: (v: number) => void;
}) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentVal, setCurrentVal] = useState(value);
  const range = step.max - step.min;
  const ticks = Array.from({ length: range + 1 }, (_, i) => i + step.min);

  useEffect(() => {
    setCurrentVal(value);
    const initialX = (value - step.min) * TICK_SPACING;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: initialX, animated: false });
    }, 100);
  }, [step.id]); // Run only when step changes

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    let v = Math.round(x / TICK_SPACING) + step.min;
    if (v < step.min) v = step.min;
    if (v > step.max) v = step.max;
    if (v !== currentVal) {
      setCurrentVal(v);
      onChange(v);
    }
  };

  return (
    <View style={rulerStyles.container}>
      {/* Current Value Display */}
      <View style={rulerStyles.valueDisplay}>
        <Text style={rulerStyles.valueText}>{currentVal}</Text>
        <Text style={rulerStyles.unitText}>{step.unit}</Text>
      </View>
      <View style={rulerStyles.rulerWrap}>
        <View style={rulerStyles.pointerWrap}>
          <View style={rulerStyles.pointerTriangle} />
          <View style={rulerStyles.pointerLine} />
        </View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_SPACING}
          decelerationRate="fast"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: HALF_WIDTH }}
        >
          {ticks.map((t) => {
            const isTenth = t % 10 === 0;
            const isFifth = t % 5 === 0 && !isTenth;
            return (
              <View key={t} style={[rulerStyles.tickWrap, { width: TICK_SPACING }]}>
                <View
                  style={[
                    rulerStyles.tick,
                    isTenth ? rulerStyles.tickLong : isFifth ? rulerStyles.tickMedium : rulerStyles.tickShort,
                  ]}
                />
                {isTenth && <Text style={rulerStyles.tickLabel}>{t}</Text>}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default function MeasurementsScreen() {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const STEPS = getSteps();
  
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [measurements, setMeasurements] = useState<Record<StepId, number>>({
    height_cm: STEPS[0].initial,
    bust_cm: STEPS[1].initial,
    waist_cm: STEPS[2].initial,
    hips_cm: STEPS[3].initial,
    weight_kg: STEPS[4].initial,
  });

  const activeStep = STEPS[stepIndex];

  const handleNext = async () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      // Last step -> Save
      setIsLoading(true);
      try {
        const bust = measurements.bust_cm;
        const waist = measurements.waist_cm;
        const hips = measurements.hips_cm;
        const bodyType = calculateBodyType(bust, waist, hips);

        await updateProfile({
          height_cm: measurements.height_cm,
          weight_kg: measurements.weight_kg,
          bust_cm: bust,
          waist_cm: waist,
          hips_cm: hips,
          body_type: bodyType,
        });

        router.push('/(onboarding)/body-type');
      } catch (error) {
        console.error('Save measurements error:', error);
        Alert.alert(t('error'), t('onboarding.error_save'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <Feather name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeStep.title}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((stepIndex + 1) / STEPS.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Slika Dajana – uvek u mestu; linija visine samo na koraku Visina; prsten na grudi/struk/kukovi */}
      <View style={styles.modelContainer}>
        <View style={styles.silhouetteWrap}>
          <Image
            source={DAJANA_MERE_IMG}
            style={styles.silhouetteImage}
            resizeMode="contain"
          />
          {/* Linija visine – samo na koraku Visina */}
          {activeStep.id === 'height_cm' && (
            <View style={styles.heightLineWrap} pointerEvents="none">
              <Svg width={36} height={SILHOUETTE_HEIGHT} style={styles.heightLineSvg}>
                <Line x1={18} y1={24} x2={18} y2={SILHOUETTE_HEIGHT - 24} stroke={APP_RING_COLOR} strokeWidth={2.5} strokeLinecap="round" />
                <Line x1={10} y1={24} x2={26} y2={24} stroke={APP_RING_COLOR} strokeWidth={2} />
                <Line x1={10} y1={SILHOUETTE_HEIGHT / 2} x2={26} y2={SILHOUETTE_HEIGHT / 2} stroke={COLORS.gray[400]} strokeWidth={1} strokeDasharray="6 3" />
                <Line x1={10} y1={SILHOUETTE_HEIGHT - 24} x2={26} y2={SILHOUETTE_HEIGHT - 24} stroke={APP_RING_COLOR} strokeWidth={2} />
              </Svg>
              <View style={styles.heightLineLabel}>
                <Text style={styles.heightLineValue}>{measurements.height_cm}</Text>
                <Text style={styles.heightLineUnit}> cm</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Ruler */}
      <View style={styles.rulerSection}>
        <RulerPicker
          key={activeStep.id} // Reset state on step change
          step={activeStep}
          value={measurements[activeStep.id]}
          onChange={(val) => setMeasurements((prev) => ({ ...prev, [activeStep.id]: val }))}
        />
      </View>

      {/* Footer – bez opcije Preskoči ni na težini */}
      <View style={styles.footer}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextBtnText}>{stepIndex === STEPS.length - 1 ? t('onboarding_finish') : t('next')}</Text>
          )}
          {!isLoading && <Feather name="chevron-right" size={20} color="#FFF" style={{ marginLeft: 4 }} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ONBOARDING_CREAM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONTS.heading.bold, fontSize: FONT_SIZES['2xl'], color: COLORS.primary, flex: 1, textAlign: 'center' },
  
  progressContainer: { paddingHorizontal: SPACING.xl, marginTop: SPACING.lg },
  progressBar: { height: 4, backgroundColor: COLORS.gray[200], borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary },

  modelContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: SPACING.sm },
  silhouetteWrap: { width: SILHOUETTE_WIDTH, height: SILHOUETTE_HEIGHT, alignSelf: 'center', position: 'relative' },
  silhouetteImage: { width: '100%', height: '100%' },
  heightLineWrap: {
    position: 'absolute',
    right: 8,
    top: 0,
    width: 36,
    height: SILHOUETTE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 5,
  },
  heightLineSvg: { position: 'absolute', left: 0, top: 0 },
  heightLineLabel: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  heightLineValue: { fontFamily: FONTS.heading.bold, fontSize: 16, color: COLORS.primary },
  heightLineUnit: { fontFamily: FONTS.primary.regular, fontSize: 13, color: COLORS.gray[600] },

  rulerSection: { height: 118, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 5, paddingTop: SPACING.sm, paddingBottom: SPACING.xs },
  
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl, backgroundColor: '#FFF' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: 30, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  nextBtnText: { fontFamily: FONTS.primary.semibold, fontSize: FONT_SIZES.md, color: '#FFF', letterSpacing: 0.5 },
});

const rulerStyles = StyleSheet.create({
  container: { flex: 1 },
  valueDisplay: { flexDirection: 'row', alignItems: 'baseline', alignSelf: 'center', marginBottom: 6, paddingHorizontal: SPACING.md, paddingVertical: 4, backgroundColor: ONBOARDING_CREAM, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.gray[200] },
  valueText: { fontFamily: FONTS.heading.bold, fontSize: 24, color: DARK },
  unitText: { fontFamily: FONTS.primary.medium, fontSize: FONT_SIZES.sm, color: COLORS.gray[500], marginLeft: 2, marginBottom: 2 },
  rulerWrap: { position: 'relative', height: 44 },
  pointerWrap: { position: 'absolute', top: 0, left: '50%', marginLeft: -1, alignItems: 'center', zIndex: 10 },
  pointerTriangle: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#EF4444' },
  pointerLine: { width: 2, height: 32, backgroundColor: '#EF4444' },
  tickWrap: { height: '100%', alignItems: 'center', justifyContent: 'flex-start' },
  tick: { width: 1.5, backgroundColor: COLORS.gray[300], borderRadius: 1 },
  tickLong: { height: 26, backgroundColor: COLORS.gray[400] },
  tickMedium: { height: 18 },
  tickShort: { height: 12 },
  tickLabel: { position: 'absolute', top: 30, fontFamily: FONTS.primary.regular, fontSize: 9, color: COLORS.gray[400] },
});
