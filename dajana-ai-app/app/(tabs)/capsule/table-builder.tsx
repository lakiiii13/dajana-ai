// ===========================================
// DAJANA AI - TableBuilderScreen
// Interaktivni flat-lay builder: sto + drop zone + plusevi
// ===========================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FONTS, COLORS } from '@/constants/theme';
import { useTryOnStore } from '@/stores/tryOnStore';
import { OutfitPickerModal } from '@/components/OutfitPickerModal';
import { OutfitWithSaved } from '@/lib/api';

const { width: W, height: H } = Dimensions.get('window');

// Pozadina: tvoja slika – sačuvaj je kao assets/images/table-outfit-2.jpg
const TABLE_IMG = require('@/assets/images/table-outfit-2.jpg');

const GOLD = '#CF8F5A';
const CREAM = '#F8F4EF';
const DARK = '#1A1A1A';
const GLASS = 'rgba(248,244,239,0.18)';
const GLASS_BORDER = 'rgba(207,143,90,0.45)';

type ZoneId = 'top' | 'outerwear' | 'bottom' | 'shoes' | 'bag' | 'accessory';

interface Zone {
  id: ZoneId;
  label: string;
  icon: string;
  color: string;
  top: number;
  left: number;
}

// Lepše poređane zone: 2 kolone + sredina (simetrično)
const ZONES: Zone[] = [
  { id: 'outerwear', label: 'Kaput / Jakna',     icon: 'layers-outline',     color: '#8B7355', top: H * 0.11, left: W * 0.16 },
  { id: 'top',       label: 'Majica / Bluza',     icon: 'shirt-outline',      color: '#7A6B5A', top: H * 0.11, left: W * 0.58 },
  { id: 'bottom',    label: 'Pantalone / Suknja', icon: 'cut-outline',         color: '#6B5E4E', top: H * 0.30, left: W * 0.37 },
  { id: 'shoes',     label: 'Cipele',            icon: 'footsteps-outline',  color: '#5E4F3E', top: H * 0.49, left: W * 0.16 },
  { id: 'bag',       label: 'Tašna',             icon: 'briefcase-outline',  color: '#7B6A58', top: H * 0.49, left: W * 0.58 },
  { id: 'accessory', label: 'Nakit / Šešir',     icon: 'diamond-outline',     color: '#9A8060', top: H * 0.67, left: W * 0.37 },
];

const MOCK_COLORS: Record<ZoneId, string> = {
  outerwear: '#8B7355',
  top:       '#B8A898',
  bottom:    '#6B7B8E',
  shoes:     '#4A3C2E',
  bag:       '#A0896E',
  accessory: '#C4A882',
};

const ZONE_SIZE = 70;

export default function TableBuilderScreen() {
  const insets = useSafeAreaInsets();
  const [added, setAdded] = useState<Record<ZoneId, OutfitWithSaved>>({} as any);
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { setOutfitTitle, clearOutfitItems, addOutfitItem } = useTryOnStore();

  const count = Object.keys(added).length;
  const canTryOn = count >= 2;

  const tryOnScale = useSharedValue(1);
  const tryOnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tryOnScale.value }],
  }));

  const handleZoneTap = useCallback((zone: Zone) => {
    setActiveZone(zone.id);
    setModalVisible(true);
  }, []);

  const handleRemoveZone = useCallback((zoneId: ZoneId) => {
    setAdded((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
  }, []);

  const handleSelectOutfit = useCallback((outfit: OutfitWithSaved) => {
    if (activeZone) {
      setAdded((prev) => ({ ...prev, [activeZone]: outfit }));
    }
    setModalVisible(false);
  }, [activeZone]);

  const handleTryOn = () => {
    if (!canTryOn) return;
    tryOnScale.value = withSpring(0.92, { damping: 8 }, () => {
      tryOnScale.value = withSpring(1, { damping: 10 });
    });
    clearOutfitItems();
    (Object.entries(added) as [ZoneId, OutfitWithSaved][]).forEach(([zoneId, outfit]) => {
      addOutfitItem({
        id: outfit.id,
        imageUrl: outfit.image_url,
        title: outfit.title ?? null,
        zoneId,
      });
    });
    setOutfitTitle('Moj outfit');
    router.push('/try-on/upload' as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ImageBackground source={TABLE_IMG} style={styles.bg} resizeMode="cover">
        <View style={styles.overlay} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="arrow-left" size={20} color={CREAM} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>KAPSULA</Text>
            <Text style={styles.headerSub}>Složi svoj outfit</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{count}</Text>
          </View>
        </View>

        {/* Drop Zones – lepše poređani */}
        {ZONES.map((zone) => {
          const item = added[zone.id];
          const isAdded = !!item;
          return (
            <View key={zone.id} style={[styles.zone, { top: zone.top, left: zone.left }]}>
              {isAdded ? (
                <Animated.View
                  entering={FadeIn.duration(280)}
                  style={[styles.zoneAdded, { backgroundColor: COLORS.white }]}
                >
                  <Image source={{ uri: item.image_url }} style={styles.zoneImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.zoneRemoveBtn}
                    activeOpacity={0.8}
                    onPress={() => handleRemoveZone(zone.id)}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Ionicons name="close" size={12} color={COLORS.white} />
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <TouchableOpacity activeOpacity={0.85} onPress={() => handleZoneTap(zone)}>
                  <Animated.View entering={FadeIn.duration(200)} style={styles.zonePlus}>
                    <Ionicons name="add" size={22} color={GOLD} />
                    <Text style={styles.zonePlusLabel} numberOfLines={1}>{zone.label}</Text>
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Modal za biranje komada */}
        <OutfitPickerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={handleSelectOutfit}
        />

        {/* Hint tekst na dnu */}
        {count === 0 && (
          <Animated.View
            entering={FadeIn.delay(600).duration(500)}
            exiting={FadeOut.duration(300)}
            style={styles.hintWrap}
          >
            <Text style={styles.hintText}>Dodaj najmanje 2 komada da bi isprobao outfit</Text>
          </Animated.View>
        )}

        {/* Isprobaj – elegantno dugme */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 20 }]}>
          <Animated.View style={tryOnStyle}>
            <TouchableOpacity
              style={[styles.tryOnBtn, canTryOn ? styles.tryOnBtnActive : styles.tryOnBtnDisabled]}
              activeOpacity={canTryOn ? 0.88 : 1}
              onPress={handleTryOn}
            >
              <Text style={[styles.tryOnText, { color: canTryOn ? COLORS.white : 'rgba(255,255,255,0.4)' }]}>
                Isprobaj outfit
              </Text>
              {canTryOn && (
                <View style={styles.tryOnBadge}>
                  <Text style={styles.tryOnBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  bg: { flex: 1, width: '100%', height: '100%' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,9,7,0.38)',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 18,
    color: CREAM,
    letterSpacing: 4,
  },

  headerSub: {
    fontFamily: FONTS.primary.light,
    fontSize: 11,
    color: GOLD,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GOLD + '22',
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerBadgeText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 16,
    color: GOLD,
  },

  /* Drop Zones */
  zone: {
    position: 'absolute',
    width: ZONE_SIZE + 20,
    alignItems: 'center',
  },

  zonePlus: {
    width: ZONE_SIZE,
    height: ZONE_SIZE,
    borderRadius: ZONE_SIZE / 2,
    backgroundColor: GLASS,
    borderWidth: 1.5,
    borderColor: GLASS_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  zonePlusLabel: {
    position: 'absolute',
    bottom: -18,
    fontFamily: FONTS.primary.medium,
    fontSize: 9,
    color: CREAM,
    letterSpacing: 0.2,
    textAlign: 'center',
    width: ZONE_SIZE + 24,
  },

  zoneAdded: {
    width: ZONE_SIZE,
    height: ZONE_SIZE,
    borderRadius: ZONE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },

  zoneAddedLabel: {
    position: 'absolute',
    bottom: -20,
    fontFamily: FONTS.primary.regular,
    fontSize: 10,
    color: GOLD,
    letterSpacing: 0.3,
    textAlign: 'center',
    width: ZONE_SIZE + 20,
  },

  zoneImage: {
    width: '100%',
    height: '100%',
    borderRadius: ZONE_SIZE / 2,
  },

  zoneRemoveBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  /* Hint */
  hintWrap: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  hintText: {
    fontFamily: FONTS.primary.light,
    fontSize: 12,
    color: 'rgba(248,244,239,0.55)',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 18,
  },

  /* Bottom bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  tryOnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 40,
    minWidth: 220,
  },

  tryOnBtnActive: {
    backgroundColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },

  tryOnBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  tryOnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 15,
    letterSpacing: 0.5,
  },

  tryOnBadge: {
    marginLeft: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tryOnBadgeText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 12,
    color: DARK,
  },
});
