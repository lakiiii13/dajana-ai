// ===========================================
// DAJANA AI - Try-On Service
// Koristi SAMO Supabase Edge Function (Gemini ključ je u Supabase Secrets, ne u app-u).
// ===========================================

import * as FileSystem from './safeFileSystem';
import { supabase } from './supabase';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export interface TryOnResult {
  imageBase64: string;
  mimeType: string;
}

/**
 * Load an image from URL (http/https) or local file (file://) and convert to base64.
 */
async function imageUrlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  console.log('[TryOn] Loading outfit image...', url?.substring(0, 50));

  if (!url || typeof url !== 'string') {
    throw new Error('Outfit image URL is empty');
  }

  const isLocal = url.startsWith('file://') || url.startsWith('/');
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpeg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  try {
    if (isLocal) {
      const fileUri = url.startsWith('file://') ? url : `file://${url}`;
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('[TryOn] Local file base64 length:', base64.length);
      return { base64, mimeType };
    }

    const filename = `tryon_outfit_${Date.now()}.jpg`;
    const filePath = `${FileSystem.cacheDirectory}${filename}`;

    console.log('[TryOn] Downloading to:', filePath);
    const downloadResult = await FileSystem.downloadAsync(url, filePath);
    console.log('[TryOn] Download status:', downloadResult.status);

    if (downloadResult.status !== 200) {
      throw new Error(`Download failed: HTTP ${downloadResult.status}`);
    }

    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('[TryOn] Base64 length:', base64.length);

    await FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});

    return { base64, mimeType };
  } catch (error: any) {
    console.error('[TryOn] imageUrlToBase64 error:', error?.message || error);
    throw new Error(
      'Nije moguće učitati sliku outfita. Proverite konekciju ili izaberite drugi outfit.'
    );
  }
}

/**
 * An outfit item for multi-piece try-on.
 */
export interface TryOnOutfitItem {
  imageUrl: string;
  title: string | null;
}

/**
 * Generate a virtual try-on image using Gemini 3 Pro Image.
 * Supports multiple outfit items (e.g. top + pants).
 */
export async function generateTryOn(
  faceImageBase64: string,
  outfitImageUrlOrItems: string | TryOnOutfitItem[],
  outfitTitle?: string | null
): Promise<TryOnResult> {
  if (typeof faceImageBase64 !== 'string' || !faceImageBase64.trim()) {
    throw new Error('Slika lica nije ispravna. Pokušajte ponovo sa jasnom fotografijom.');
  }
  const approxMb = (faceImageBase64.length * 3) / 4 / 1024 / 1024;
  if (approxMb > 5) {
    throw new Error(
      'Slika je prevelika. Izaberite manju fotografiju ili isečite samo lice/telo (preporuka do ~2–3 MB).'
    );
  }
  console.log('[TryOn] Starting generation...', 'face ~', approxMb.toFixed(2), 'MB');

  // Normalize to array
  const items: TryOnOutfitItem[] = typeof outfitImageUrlOrItems === 'string'
    ? [{ imageUrl: outfitImageUrlOrItems, title: outfitTitle || null }]
    : outfitImageUrlOrItems;

  console.log('[TryOn] Number of outfit items:', items.length);

  // 1. Download all outfit images in parallel
  const outfitDataArr = await Promise.all(
    items.map((item) => imageUrlToBase64(item.imageUrl))
  );

  // 2. Prvo pokušaj Supabase Edge Function (Gemini ključ iz Supabase)
  if (SUPABASE_URL) {
    try {
      console.log('[TryOn] Calling Edge Function...');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? '';
      const edgeUrl = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/generate-try-on`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 min (edge retry + fallback model)
      const edgeRes = await fetch(edgeUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          ...(token ? { 'X-User-JWT': token } : {}),
        },
        body: JSON.stringify({
          faceImageBase64,
          outfitImages: outfitDataArr.map((od) => ({ base64: od.base64, mimeType: od.mimeType })),
          items: items.map((i) => ({ title: i.title })),
        }),
      });
      clearTimeout(timeoutId);
      const edgeJson = await edgeRes.json().catch(() => ({}));
      if (edgeRes.ok && edgeJson.imageBase64) {
        console.log('[TryOn] Image from Edge Function');
        return {
          imageBase64: edgeJson.imageBase64,
          mimeType: edgeJson.mimeType || 'image/png',
        };
      }
      if (!edgeRes.ok && typeof edgeJson?.error === 'string') {
        console.error('[TryOn] Edge Function error:', edgeRes.status, edgeJson.error);
        throw new Error(edgeJson.error);
      }
      if (edgeRes.status === 400) {
        const errMsg = typeof edgeJson?.error === 'string' ? edgeJson.error : 'Neispravan zahtev. Pokušajte sa manjom slikom (do ~2 MB).';
        throw new Error(errMsg);
      }
      if (edgeRes.status >= 500 || edgeRes.status === 403 || edgeRes.status === 429) {
        console.warn('[TryOn] Edge Function failed:', edgeRes.status, edgeJson?.error);
        if (edgeRes.status === 403) {
          throw new Error(
            'Gemini API ključ u Supabase nije validan. Proveri Edge Function secrets (GEMINI_API_KEY).'
          );
        }
        if (edgeRes.status === 429) {
          throw new Error('Previše zahteva. Sačekajte minut i pokušajte ponovo.');
        }
      }
      if (!edgeRes.ok) {
        throw new Error(typeof edgeJson?.error === 'string' ? edgeJson.error : `Greška (${edgeRes.status}). Pokušajte ponovo.`);
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      const isAbort = err?.name === 'AbortError';
      if (isAbort) {
        throw new Error('Zahtev je istekao. Generisanje traje dugo – pokušajte ponovo.');
      }
      if (msg === 'Network request failed' || (typeof msg === 'string' && msg.includes('Network request failed'))) {
        throw new Error(
          'Nema konekcije sa serverom. Proverite internet, .env (EXPO_PUBLIC_SUPABASE_URL) i da li je Edge Function generate-try-on deploy-ovan.'
        );
      }
      if (err?.message) throw err;
      throw new Error('Generisanje nije uspelo. Proverite konekciju i pokušajte ponovo.');
    }
  }

  throw new Error(
    'Try-On zahteva Supabase. U .env postavite EXPO_PUBLIC_SUPABASE_URL i deploy-ujte Edge Function generate-try-on (Gemini ključ u Supabase Secrets).'
  );
}

/**
 * Build the prompt for virtual try-on (supports multi-item).
 */
function buildTryOnPrompt(items: TryOnOutfitItem[]): string {
  const isSingle = items.length === 1;

  if (isSingle) {
    const outfitDesc = items[0].title ? ` "${items[0].title}"` : '';
    return `You are a professional fashion virtual try-on assistant. 

I'm sending you two images:
1. FIRST IMAGE: A photo of a person (face and/or body)
2. SECOND IMAGE: A fashion outfit${outfitDesc}

Your task: Generate a new, high-quality, photorealistic image of the SAME person from the first photo wearing the outfit from the second photo. 

CRITICAL IDENTITY RULES:
- The face must remain exactly the same person as in the source image
- Do not change facial structure, face shape, eyes, eyelids, eyebrows, nose, lips, jawline, cheekbones, forehead, ears, or chin
- Keep the exact same skin tone, undertone, facial proportions, eye spacing, nose width, lip shape, and bone structure
- Preserve the exact same hair color, hairstyle, hairline, and all visible personal details
- Do not beautify, retouch, glamorize, age up, age down, or make the person look like someone else
- Do not change makeup style unless it already exists in the source image
- The result must be unmistakably the same person on first glance

BODY AND STYLING RULES:
- Keep body proportions exactly the same
- The outfit should fit naturally and realistically on the person's body
- Preserve a realistic pose and natural garment drape
- Keep the person fully inside the frame
- Full body shot showing the complete outfit

IMAGE QUALITY RULES:
- Maintain natural lighting and realistic shadows
- Keep the composition clean, elegant, and photorealistic
- Background should stay simple, neutral, and non-distracting
- Do not add extra accessories, props, extra limbs, extra fingers, or distorted anatomy
- Do not crop out the face or any important body part
- The final result should look like a premium professional fashion photo

Generate the image now.`;
  }

  // Multi-item prompt
  const itemDescriptions = items
    .map((item, idx) => {
      const name = item.title ? `"${item.title}"` : `Clothing item ${idx + 1}`;
      return `  ${idx + 2}. IMAGE ${idx + 2}: ${name}`;
    })
    .join('\n');

  return `You are a professional fashion virtual try-on assistant.

I'm sending you ${items.length + 1} images:
1. FIRST IMAGE: A photo of a person (face and/or body)
${itemDescriptions}

Your task: Generate a new, high-quality, photorealistic image of the SAME person from the first photo wearing ALL the clothing items from the other images COMBINED as a single outfit.

CRITICAL IDENTITY RULES:
- The face must remain exactly the same person as in the source image
- Do not change facial structure, face shape, eyes, eyelids, eyebrows, nose, lips, jawline, cheekbones, forehead, ears, or chin
- Keep the exact same skin tone, undertone, facial proportions, eye spacing, nose width, lip shape, and bone structure
- Preserve the exact same hair color, hairstyle, hairline, and all visible personal details
- Do not beautify, retouch, glamorize, age up, age down, or make the person look like someone else
- Do not change makeup style unless it already exists in the source image
- The result must be unmistakably the same person on first glance

BODY AND STYLING RULES:
- Keep body proportions exactly the same
- Combine all the clothing items into one cohesive outfit on the person
- Each clothing piece should fit naturally on the appropriate body part
- Keep the person fully inside the frame
- Full body shot showing the complete combined outfit

IMAGE QUALITY RULES:
- Maintain natural lighting and realistic shadows
- Keep the composition clean, elegant, and photorealistic
- Background should stay simple, neutral, and non-distracting
- Do not add extra accessories, props, extra limbs, extra fingers, or distorted anatomy
- Do not crop out the face or any important body part
- The final result should look like a premium professional fashion photo

Generate the image now.`;
}

/**
 * Save a generated try-on image to the file system.
 */
export async function saveTryOnImage(base64: string, outfitId: string): Promise<string> {
  const dir = `${FileSystem.documentDirectory}tryon/`;

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const filename = `tryon_${outfitId}_${Date.now()}.png`;
  const filePath = `${dir}${filename}`;

  await FileSystem.writeAsStringAsync(filePath, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return filePath;
}

export interface SavedTryOnImage {
  uri: string;
  filename: string;
  timestamp: number;
  outfitId: string;
}

/**
 * List all saved try-on images, sorted newest first.
 */
export async function getSavedTryOnImages(): Promise<SavedTryOnImage[]> {
  const dir = `${FileSystem.documentDirectory}tryon/`;

  try {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) return [];

    const files = await FileSystem.readDirectoryAsync(dir);
    const images: SavedTryOnImage[] = [];

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      // Parse filename: tryon_{outfitId}_{timestamp}.png
      const parts = file.replace('.png', '').split('_');
      const timestamp = parseInt(parts[parts.length - 1]) || 0;
      const outfitId = parts.slice(1, -1).join('_');

      images.push({
        uri: `${dir}${file}`,
        filename: file,
        timestamp,
        outfitId,
      });
    }

    // Sort newest first
    images.sort((a, b) => b.timestamp - a.timestamp);
    return images;
  } catch (err) {
    console.error('[TryOn] Error listing images:', err);
    return [];
  }
}

/**
 * Delete a saved try-on image.
 */
export async function deleteTryOnImage(uri: string | { uri?: string; path?: string }): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (err) {
    console.error('[TryOn] Error deleting image:', err);
  }
}

/**
 * Clear all local try-on data and saved outfits (call on sign out so next user doesn't see previous user's data).
 */
export async function clearAllLocalTryOnData(): Promise<void> {
  const dir = FileSystem.documentDirectory;
  if (!dir) return;
  const tryonDir = `${dir}tryon/`;
  try {
    const files = await FileSystem.readDirectoryAsync(tryonDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        await FileSystem.deleteAsync(`${tryonDir}${file}`, { idempotent: true });
      }
    }
  } catch (err) {
    // Dir may not exist yet
  }
  const outfitsIndex = `${dir}outfits/index.json`;
  try {
    await FileSystem.writeAsStringAsync(outfitsIndex, '[]', {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    console.error('[TryOn] Error clearing outfits index:', err);
  }
}

// ===================================================
// SAVED OUTFITS (flat-lay style outfit compositions)
// ===================================================

export interface SavedOutfitItem {
  id: string;
  imageUrl: string;
  title: string | null;
  /** Zona iz Kapsule (top, outerwear, …) – za thumbnail prikaz „gornji deo koji je izabrala” */
  zoneId?: string;
}

export interface SavedOutfit {
  id: string;
  items: SavedOutfitItem[];
  timestamp: number;
  tryOnImageUri?: string; // link to generated try-on image
}

const OUTFITS_DIR = `${FileSystem.documentDirectory}outfits/`;
const OUTFITS_INDEX = `${OUTFITS_DIR}index.json`;

/**
 * Save an outfit composition (the items that were tried on together).
 */
export async function saveOutfitComposition(
  items: SavedOutfitItem[],
  tryOnImageUri?: string
): Promise<SavedOutfit> {
  const dirInfo = await FileSystem.getInfoAsync(OUTFITS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(OUTFITS_DIR, { intermediates: true });
  }

  // Load existing
  const existing = await getSavedOutfits();

  const newOutfit: SavedOutfit = {
    id: `outfit_${Date.now()}`,
    items,
    timestamp: Date.now(),
    tryOnImageUri,
  };

  existing.unshift(newOutfit);

  await FileSystem.writeAsStringAsync(OUTFITS_INDEX, JSON.stringify(existing), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return newOutfit;
}

/**
 * Get all saved outfit compositions, newest first.
 */
export async function getSavedOutfits(): Promise<SavedOutfit[]> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(OUTFITS_INDEX);
    if (!fileInfo.exists) return [];

    const raw = await FileSystem.readAsStringAsync(OUTFITS_INDEX, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const parsed = JSON.parse(raw);
    const data = Array.isArray(parsed) ? parsed as SavedOutfit[] : [];
    return data
      .filter((o): o is SavedOutfit => o != null && Array.isArray(o.items))
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('[Outfits] Error loading:', err);
    return [];
  }
}

/**
 * Delete a saved outfit composition.
 */
export async function deleteOutfitComposition(outfitId: string): Promise<void> {
  try {
    const existing = await getSavedOutfits();
    const updated = existing.filter((o) => o.id !== outfitId);
    await FileSystem.writeAsStringAsync(OUTFITS_INDEX, JSON.stringify(updated), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    console.error('[Outfits] Error deleting:', err);
  }
}
