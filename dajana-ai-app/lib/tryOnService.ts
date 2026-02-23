// ===========================================
// DAJANA AI - Try-On Service
// Uses Gemini 3 Pro Image (Nano Banana AI) to generate
// virtual try-on images
// ===========================================

import * as FileSystem from './safeFileSystem';

const GEMINI_API_KEY = 'AIzaSyANtLzK6wR06sn1KsSY5I1Oc04AAwVNL6Y';
const GEMINI_MODEL = 'gemini-3-pro-image-preview';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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
  console.log('[TryOn] Starting generation...');
  console.log('[TryOn] Face base64 length:', faceImageBase64.length);

  // Normalize to array
  const items: TryOnOutfitItem[] = typeof outfitImageUrlOrItems === 'string'
    ? [{ imageUrl: outfitImageUrlOrItems, title: outfitTitle || null }]
    : outfitImageUrlOrItems;

  console.log('[TryOn] Number of outfit items:', items.length);

  // 1. Download all outfit images in parallel
  const outfitDataArr = await Promise.all(
    items.map((item) => imageUrlToBase64(item.imageUrl))
  );

  // 2. Build the prompt
  const prompt = buildTryOnPrompt(items);

  // 3. Build the request body — person image + all outfit images
  const imageParts: any[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: faceImageBase64,
      },
    },
  ];

  outfitDataArr.forEach((od) => {
    imageParts.push({
      inlineData: {
        mimeType: od.mimeType,
        data: od.base64,
      },
    });
  });

  const requestBody = {
    contents: [{ parts: imageParts }],
    generationConfig: {
      responseModalities: ['image', 'text'],
      temperature: 1.0,
    },
  };

  // 4. Call Gemini API
  console.log('[TryOn] Calling Gemini 3 Pro Image API...');

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  console.log('[TryOn] API status:', response.status);

  const rawBody = await response.text();

  if (!response.ok) {
    console.error('[TryOn] API error:', response.status, rawBody.substring(0, 500));
    if (response.status === 400) {
      throw new Error('Neispravan zahtev. Pokušajte sa drugom slikom.');
    } else if (response.status === 429) {
      throw new Error('Previše zahteva. Sačekajte minut i pokušajte ponovo.');
    } else if (response.status === 403) {
      throw new Error('API ključ nije validan.');
    } else if (response.status >= 500) {
      throw new Error('Servis je privremeno nedostupan. Pokušajte ponovo za nekoliko minuta.');
    }
    throw new Error(`AI generisanje nije uspelo (${response.status})`);
  }

  let data: { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>; promptFeedback?: unknown };
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error('[TryOn] Invalid JSON from API');
    throw new Error('AI nije vratio ispravan odgovor. Pokušajte ponovo.');
  }
  console.log('[TryOn] Candidates:', data.candidates?.length);

  // 5. Extract generated image
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    if (data.promptFeedback) {
      console.error('[TryOn] Prompt feedback:', JSON.stringify(data.promptFeedback));
      throw new Error('AI je odbio zahtev. Pokušajte sa drugom slikom.');
    }
    throw new Error('AI nije vratio rezultat. Pokušajte ponovo.');
  }

  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error('Prazan odgovor od AI-a.');
  }

  // Find image part
  for (const part of parts) {
    if (part.inlineData?.data) {
      console.log('[TryOn] Image generated! MIME:', part.inlineData.mimeType);
      return {
        imageBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
  }

  // Text response (no image)
  for (const part of parts) {
    if (part.text) {
      console.warn('[TryOn] Text response:', part.text.substring(0, 200));
      throw new Error('AI nije mogao da generiše sliku. Pokušajte sa jasnijom slikom lica.');
    }
  }

  throw new Error('Neočekivan odgovor od AI-a.');
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
1. FIRST IMAGE: A photo of a person (face/body photo)
2. SECOND IMAGE: A fashion outfit${outfitDesc}

Your task: Generate a new, high-quality, photorealistic image of the SAME person from the first photo wearing the outfit from the second photo. 

Requirements:
- Keep the person's face, hair, and body proportions exactly the same
- The outfit should fit naturally on the person's body
- Maintain natural lighting and realistic shadows
- The background should be clean and elegant (soft neutral/fashion studio style)
- The generated image should look like a professional fashion photo
- Full body shot showing the complete outfit

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
1. FIRST IMAGE: A photo of a person (face/body photo)
${itemDescriptions}

Your task: Generate a new, high-quality, photorealistic image of the SAME person from the first photo wearing ALL the clothing items from the other images COMBINED as a single outfit.

Requirements:
- Keep the person's face, hair, and body proportions exactly the same
- Combine all the clothing items into one cohesive outfit on the person
- Each clothing piece should fit naturally on the appropriate body part
- Maintain natural lighting and realistic shadows
- The background should be clean and elegant (soft neutral/fashion studio style)
- The generated image should look like a professional fashion photo
- Full body shot showing the complete combined outfit

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

// ===================================================
// SAVED OUTFITS (flat-lay style outfit compositions)
// ===================================================

export interface SavedOutfitItem {
  id: string;
  imageUrl: string;
  title: string | null;
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
    const data = JSON.parse(raw) as SavedOutfit[];
    return data.sort((a, b) => b.timestamp - a.timestamp);
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
