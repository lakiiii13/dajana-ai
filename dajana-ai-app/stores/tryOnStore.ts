// ===========================================
// DAJANA AI - Try-On Store (Zustand)
// Supports multiple outfit items (Outfit Builder)
// ===========================================

import { create } from 'zustand';

/** Zone from Kapsula table-builder: redosled prikaza (gornji deo prvi) */
export type OutfitZoneId = 'top' | 'outerwear' | 'bottom' | 'shoes' | 'bag' | 'accessory';

const ZONE_ORDER: OutfitZoneId[] = ['top', 'outerwear', 'bottom', 'shoes', 'bag', 'accessory'];

export interface OutfitItem {
  id: string;
  imageUrl: string;
  title: string | null;
  /** Iz Kapsula buildera – za sortiranje (gornji deo prvi) */
  zoneId?: OutfitZoneId;
}

export interface TryOnState {
  // Input — multiple items
  outfitItems: OutfitItem[];

  // Legacy single item (for backward compat)
  outfitId: string | null;
  outfitImageUrl: string | null;
  outfitTitle: string | null;

  // Face
  faceImageUri: string | null;
  faceImageBase64: string | null;

  // Output
  generatedImageBase64: string | null;
  generatedImageUri: string | null;

  // Status
  isGenerating: boolean;
  error: string | null;

  // Actions — multi item
  addOutfitItem: (item: OutfitItem) => void;
  removeOutfitItem: (id: string) => void;
  clearOutfitItems: () => void;
  hasItem: (id: string) => boolean;

  // Legacy single
  setOutfit: (id: string, imageUrl: string, title: string | null) => void;
  setOutfitTitle: (title: string | null) => void;
  setOutfitImageUrl: (url: string | null) => void;
  setFaceImage: (uri: string, base64: string) => void;
  setGeneratedImage: (base64: string, uri?: string) => void;
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  outfitItems: [] as OutfitItem[],
  outfitId: null,
  outfitImageUrl: null,
  outfitTitle: null,
  faceImageUri: null,
  faceImageBase64: null,
  generatedImageBase64: null,
  generatedImageUri: null,
  isGenerating: false,
  error: null,
};

export const useTryOnStore = create<TryOnState>((set, get) => ({
  ...initialState,

  // --- Multi-item actions ---
  addOutfitItem: (item) =>
    set((state) => {
      if (state.outfitItems.some((i) => i.id === item.id)) return state;
      const items = [...state.outfitItems, item];
      const sorted = [...items].sort((a, b) => {
        const ai = a.zoneId ? ZONE_ORDER.indexOf(a.zoneId) : 999;
        const bi = b.zoneId ? ZONE_ORDER.indexOf(b.zoneId) : 999;
        return ai - bi;
      });
      return {
        outfitItems: sorted,
        outfitId: sorted[0].id,
        outfitImageUrl: sorted[0].imageUrl,
        outfitTitle: items.map((i) => i.title || 'Outfit').join(' + '),
      };
    }),

  removeOutfitItem: (id) =>
    set((state) => {
      const items = state.outfitItems.filter((i) => i.id !== id);
      return {
        outfitItems: items,
        outfitId: items[0]?.id || null,
        outfitImageUrl: items[0]?.imageUrl || null,
        outfitTitle: items.length > 0 ? items.map((i) => i.title || 'Outfit').join(' + ') : null,
      };
    }),

  clearOutfitItems: () =>
    set({
      outfitItems: [],
      outfitId: null,
      outfitImageUrl: null,
      outfitTitle: null,
    }),

  hasItem: (id) => get().outfitItems.some((i) => i.id === id),

  // --- Legacy single item ---
  setOutfit: (id, imageUrl, title) =>
    set({
      outfitId: id,
      outfitImageUrl: imageUrl,
      outfitTitle: title,
      outfitItems: [{ id, imageUrl, title }],
    }),

  setOutfitTitle: (title) => set({ outfitTitle: title }),

  setOutfitImageUrl: (url) => set({ outfitImageUrl: url }),

  setFaceImage: (uri, base64) =>
    set({ faceImageUri: uri, faceImageBase64: base64 }),

  setGeneratedImage: (base64, uri) =>
    set({ generatedImageBase64: base64, generatedImageUri: uri || null }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
