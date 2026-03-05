/**
 * KAPSULA – Local clothing catalog
 * Add your processed PNGs (354x797, transparent) to each folder, then add entries here.
 * Example: { id: '1', label: 'Beige Trench', image: require('./jakne/beige-trench.png') }
 */
import type { ImageSourcePropType } from 'react-native';

export type ClothingItem = {
  id: string;
  label: string;
  image: ImageSourcePropType;
};

export type ClothingCategoryKey = 'jakne' | 'gornji' | 'donji' | 'obuca' | 'nakit' | 'aksesoari';

export const clothingCatalog: Record<ClothingCategoryKey, ClothingItem[]> = {
  jakne: [],
  gornji: [],
  donji: [],
  obuca: [],
  nakit: [],
  aksesoari: [],
};
