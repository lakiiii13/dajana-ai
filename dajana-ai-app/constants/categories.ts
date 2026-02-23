// ===========================================
// DAJANA AI - Outfit Categories
// ===========================================

export type CategoryId = 
  | 'all'
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'accessories'
  | 'obuca'
  | 'complete_looks';

export interface Category {
  id: CategoryId;
  labelKey: string; // i18n key
  icon: string; // Ionicons name
  tag?: string; // Tag to filter by in database (null for 'all')
}

export const CATEGORIES: Category[] = [
  {
    id: 'all',
    labelKey: 'capsule.categories.all',
    icon: 'grid-outline',
  },
  {
    id: 'tops',
    labelKey: 'capsule.categories.tops',
    icon: 'shirt-outline',
    tag: 'tops',
  },
  {
    id: 'bottoms',
    labelKey: 'capsule.categories.bottoms',
    icon: 'remove-outline', // Pants icon alternative
    tag: 'bottoms',
  },
  {
    id: 'dresses',
    labelKey: 'capsule.categories.dresses',
    icon: 'woman-outline',
    tag: 'dresses',
  },
  {
    id: 'outerwear',
    labelKey: 'capsule.categories.outerwear',
    icon: 'snow-outline', // Jacket/coat icon alternative
    tag: 'outerwear',
  },
  {
    id: 'accessories',
    labelKey: 'capsule.categories.accessories',
    icon: 'diamond-outline',
    tag: 'accessories',
  },
  {
    id: 'obuca',
    labelKey: 'capsule.categories.obuca',
    icon: 'footsteps-outline',
    tag: 'obuca',
  },
  {
    id: 'complete_looks',
    labelKey: 'capsule.categories.complete_looks',
    icon: 'sparkles-outline',
    tag: 'complete_look',
  },
];

// Get category by ID
export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id);
}

// Get tag for filtering (returns undefined for 'all')
export function getCategoryTag(id: CategoryId): string | undefined {
  const category = getCategoryById(id);
  return category?.tag;
}
