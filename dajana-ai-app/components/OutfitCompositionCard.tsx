// ===========================================
// DAJANA AI - Outfit Composition Card
// Flat-lay style display of outfit items
// ===========================================

import React from 'react';
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
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

interface Props {
  outfit: SavedOutfit;
  onPress?: () => void;
  onDelete?: () => void;
  colors: any;
}

export function OutfitCompositionCard({ outfit, onPress, onDelete, colors }: Props) {
  const items = outfit.items;
  const isSingle = items.length === 1;
  const date = new Date(outfit.timestamp);
  const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Item images — flat-lay layout */}
      <View style={styles.imageArea}>
        {isSingle ? (
          /* Single item — full card */
          <Image source={{ uri: items[0].imageUrl }} style={styles.singleImage} resizeMode="cover" />
        ) : items.length === 2 ? (
          /* Two items — side by side */
          <View style={styles.twoItemLayout}>
            <Image source={{ uri: items[0].imageUrl }} style={styles.halfImage} resizeMode="cover" />
            <Image source={{ uri: items[1].imageUrl }} style={styles.halfImage} resizeMode="cover" />
          </View>
        ) : (
          /* 3+ items — one big + small grid */
          <View style={styles.multiLayout}>
            <Image source={{ uri: items[0].imageUrl }} style={styles.mainImage} resizeMode="cover" />
            <View style={styles.sideImages}>
              {items.slice(1, 4).map((item, idx) => (
                <Image key={item.id || idx} source={{ uri: item.imageUrl }} style={styles.smallImage} resizeMode="cover" />
              ))}
              {items.length > 4 && (
                <View style={[styles.smallImage, styles.moreOverlay]}>
                  <Text style={styles.moreText}>+{items.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.itemCountBadge, { backgroundColor: `${COLORS.secondary}12` }]}>
            <Ionicons name="shirt-outline" size={11} color={COLORS.secondary} />
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
  },

  // Image area
  imageArea: {
    width: '100%',
    height: CARD_HEIGHT - 40,
    backgroundColor: '#F8F6F3',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  twoItemLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  halfImage: {
    flex: 1,
    height: '100%',
  },
  multiLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  mainImage: {
    flex: 2,
    height: '100%',
  },
  sideImages: {
    flex: 1,
    gap: 2,
  },
  smallImage: {
    flex: 1,
    width: '100%',
  },
  moreOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 14,
    color: COLORS.white,
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
