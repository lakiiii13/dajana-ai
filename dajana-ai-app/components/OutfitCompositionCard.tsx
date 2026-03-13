// ===========================================
// DAJANA AI - Outfit Composition Card
// Flat-lay style display of outfit items
// ===========================================

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { SavedOutfit } from '@/lib/tryOnService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.62;

interface Props {
  outfit: SavedOutfit;
  onPress?: () => void;
  onDelete?: () => void;
  colors: any;
  /** Kad se prosledi, kartica koristi ovu širinu (npr. u Sačuvano da prva stane u prikaz) */
  cardWidth?: number;
}

export function OutfitCompositionCard({ outfit, onPress, onDelete, colors, cardWidth: customWidth }: Props) {
  const items = outfit.items ?? [];
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const date = new Date(outfit.timestamp);
  const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;

  const thumbnailItem = useMemo(() => {
    const topOrOuter = items.find(
      (it) => (it as { zoneId?: string }).zoneId === 'top' || (it as { zoneId?: string }).zoneId === 'outerwear'
    );
    return topOrOuter ?? items[0] ?? null;
  }, [items]);

  const thumbnailUri = useMemo(() => {
    if (!thumbnailItem) return null;
    const url =
      (thumbnailItem as { imageUrl?: string; image_url?: string }).imageUrl ??
      (thumbnailItem as { image_url?: string }).image_url;
    return typeof url === 'string' && url.trim() ? url : null;
  }, [thumbnailItem]);

  const thumbnailLabel = thumbnailItem?.title?.trim() || 'Outfit';

  useEffect(() => setImageLoadFailed(false), [outfit.id, thumbnailUri]);
  const showPlaceholder = !thumbnailUri || imageLoadFailed;

  const w = customWidth ?? CARD_WIDTH;
  const h = customWidth ? customWidth * (CARD_HEIGHT / CARD_WIDTH) : CARD_HEIGHT;

  return (
    <TouchableOpacity
      style={[styles.card, { width: w, backgroundColor: colors.surface, borderColor: colors.gray[200] }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Thumbnail — uvek prikazujemo stvar koju je korisnik izabrao, prioritetno gornji deo */}
      <View style={[styles.imageArea, { height: h - 40 }]}>
        {showPlaceholder ? (
          <View style={[styles.placeholderWrap, { width: w, minHeight: h - 40 }]}>
            <Text style={[styles.placeholderLabel, { color: colors.textSecondary }]} numberOfLines={3}>
              {thumbnailLabel}
            </Text>
          </View>
        ) : (
          <View style={[styles.thumbSlide, { width: w }]}>
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.thumbImage}
              resizeMode="contain"
              onError={() => setImageLoadFailed(true)}
            />
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.itemCountBadge, { backgroundColor: `${COLORS.secondary}12` }]}>
            <Text style={[styles.itemCountText, { color: COLORS.secondary }]}>{items.length}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateStr}</Text>
        </View>
      </View>

      {/* Delete button */}
      {onDelete && (
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: colors.surface }]}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={14} color={COLORS.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // Image area
  imageArea: {
    width: '100%',
    height: CARD_HEIGHT - 40,
    backgroundColor: '#F8F6F3',
  },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  placeholderLabel: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  thumbSlide: {
    width: CARD_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemCountText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 11,
  },
  dateText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 11,
  },

  // Delete
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});
