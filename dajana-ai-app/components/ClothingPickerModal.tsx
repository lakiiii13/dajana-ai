/**
 * KAPSULA – Picker for local clothing catalog (thumbnails of actual PNGs)
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, COLORS } from '@/constants/theme';
import type { ClothingItem } from '@/assets/clothing/catalog';

const { width: SCREEN_W } = Dimensions.get('window');
const CREAM = '#F8F4EF';
const GOLD = COLORS.secondary;
const DARK = '#1A1A1A';
const THUMB_SIZE = (SCREEN_W - 48 - 24) / 3;

interface ClothingPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: ClothingItem) => void;
  title: string;
  items: ClothingItem[];
}

export function ClothingPickerModal({
  visible,
  onClose,
  onSelect,
  title,
  items,
}: ClothingPickerModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Nema komada u ovoj kategoriji. Dodaj PNG u assets/clothing i catalog.ts</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.row}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.85}
                >
                  <Image source={item.image} style={styles.thumbnail} resizeMode="cover" />
                  <Text style={styles.itemLabel} numberOfLines={2}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 16,
    maxHeight: '65%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C8BFB5',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: 15,
    letterSpacing: 2,
    color: DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: FONTS.primary.regular,
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: 'center',
    paddingVertical: 24,
  },
  grid: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    width: THUMB_SIZE,
    alignItems: 'center',
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * (797 / 354),
    borderRadius: 10,
    backgroundColor: COLORS.gray[100],
  },
  itemLabel: {
    marginTop: 6,
    fontFamily: FONTS.primary.medium,
    fontSize: 11,
    color: DARK,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
