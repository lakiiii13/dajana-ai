// ===========================================
// DAJANA AI - Outfit Composition Card
// Flat-lay style display of outfit items
// ===========================================

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { SavedOutfit } from '@/lib/tryOnService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - GRID_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.42;

interface Props {
  outfit: SavedOutfit;
  onPress?: () => void;
  onDelete?: () => void;
  colors: any;
}

export function OutfitCompositionCard({ outfit, onPress, onDelete, colors }: Props) {
  const items = outfit.items;
  const [thumbIndex, setThumbIndex] = useState(0);
  const date = new Date(outfit.timestamp);
  const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;

  const itemCount = items.length;
  const canSwipe = itemCount > 1;
  const listKey = useMemo(() => `outfit-thumb-${outfit.id}-${itemCount}`, [outfit.id, itemCount]);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray[200] }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Thumbnail — swipe kroz cele slike (kaput, duks...) bez seckanja */}
      <View style={styles.imageArea}>
        <FlatList
          key={listKey}
          data={items}
          keyExtractor={(it, idx) => it.id || `${outfit.id}-${idx}`}
          horizontal
          pagingEnabled={canSwipe}
          scrollEnabled={canSwipe}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH}
          snapToAlignment="start"
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
            setThumbIndex(Math.min(Math.max(idx, 0), itemCount - 1));
          }}
          renderItem={({ item }) => (
            <View style={styles.thumbSlide}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="contain" />
            </View>
          )}
          getItemLayout={(_, index) => ({ length: CARD_WIDTH, offset: CARD_WIDTH * index, index })}
        />

        {canSwipe && (
          <View style={styles.thumbPager} pointerEvents="none">
            <Text style={styles.thumbPagerText}>
              {thumbIndex + 1} / {itemCount}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.itemCountBadge, { backgroundColor: `${COLORS.secondary}12` }]}>
            <Ionicons name="shirt-outline" size={11} color={COLORS.secondary} />
            <Text style={[styles.itemCountText, { color: COLORS.secondary }]}>{itemCount}</Text>
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
  thumbPager: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  thumbPagerText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 11,
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
