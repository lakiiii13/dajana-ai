// ===========================================
// DAJANA AI - Outfit Card (elegant editorial style)
// ===========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { Database } from '@/types/database';

type Outfit = Database['public']['Tables']['outfits']['Row'];

interface OutfitCardProps {
  outfit: Outfit & { is_saved?: boolean };
  onPress: () => void;
  onToggleSave: () => Promise<void>;
  isLoggedIn: boolean;
  index?: number;
}

const { width } = Dimensions.get('window');
const GAP = 14;
const CARD_WIDTH = (width - SPACING.lg * 2 - GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.62;
const CARD_RADIUS = 20;

const loadedImages = new Set<string>();

export default function OutfitCard({
  outfit,
  onPress,
  onToggleSave,
  isLoggedIn,
  index = 0,
}: OutfitCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(
    outfit.image_url ? loadedImages.has(outfit.image_url) : false
  );
  const [imageError, setImageError] = useState(false);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 380 }));
  }, []);

  const handleToggleSave = async () => {
    if (!isLoggedIn || isSaving) return;
    setIsSaving(true);
    try {
      await onToggleSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageLoad = () => {
    if (outfit.image_url) loadedImages.add(outfit.image_url);
    setImageLoaded(true);
  };

  const hasValidImage = outfit.image_url && !imageError;
  const showLoading = hasValidImage && !imageLoaded;

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.wrapper, animatedCardStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.container}
      >
        <View style={styles.imageContainer}>
          {hasValidImage ? (
            <>
              <Image
                source={{ uri: outfit.image_url }}
                style={styles.image}
                resizeMode="contain"
                onLoad={handleImageLoad}
                onError={() => setImageError(true)}
              />
              {showLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator color={COLORS.secondary} size="small" />
                </View>
              )}
              {/* Gradient + title over image */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.75)']}
                style={styles.gradient}
              />
              {outfit.title && (
                <View style={styles.titleOverlay}>
                  <Text style={styles.titleOverlayText} numberOfLines={2}>
                    {outfit.title}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="shirt-outline" size={44} color={COLORS.gray[300]} />
              {outfit.title && (
                <Text style={styles.placeholderTitle} numberOfLines={2}>{outfit.title}</Text>
              )}
            </View>
          )}

          {isLoggedIn && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleToggleSave}
              disabled={isSaving}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.secondary} size="small" />
              ) : (
                <Ionicons
                  name={outfit.is_saved ? 'heart' : 'heart-outline'}
                  size={20}
                  color={outfit.is_saved ? COLORS.secondary : COLORS.white}
                />
              )}
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_WIDTH,
    marginBottom: GAP,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFCF9',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: CARD_HEIGHT,
    backgroundColor: '#F5F0E8',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  titleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  titleOverlayText: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E8',
    padding: SPACING.sm,
  },
  placeholderTitle: {
    fontFamily: FONTS.primary.medium,
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 8,
    textAlign: 'center',
  },
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
