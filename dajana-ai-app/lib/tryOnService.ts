// ===========================================
// DAJANA AI - Try-On Service
// Koristi SAMO Supabase Edge Function (Gemini ključ je u Supabase Secrets, ne u app-u).
// Slike i outfiti se čuvaju u Supabase Storage/DB, ne lokalno.
// ===========================================

import * as FileSystem from './safeFileSystem';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import { isR2Configured, uploadToR2, keyFromPublicUrl, deleteFromR2, R2_KEYS } from './r2Storage';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export interface TryOnResult {
  imageBase64: string;
  mimeType: string;
}

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

export interface TryOnOutfitItem {
  imageUrl: string;
  title: string | null;
}

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
      'Slika je prevelika. Izaberite manju fotografiju ili isečite samo lice/telo (preporuka do ~2-3 MB).'
    );
  }
  console.log('[TryOn] Starting generation...', 'face ~', approxMb.toFixed(2), 'MB');

  const items: TryOnOutfitItem[] = typeof outfitImageUrlOrItems === 'string'
    ? [{ imageUrl: outfitImageUrlOrItems, title: outfitTitle || null }]
    : outfitImageUrlOrItems;

  console.log('[TryOn] Number of outfit items:', items.length);

  const outfitDataArr = await Promise.all(
    items.map((item) => imageUrlToBase64(item.imageUrl))
  );

  if (SUPABASE_URL) {
    try {
      console.log('[TryOn] Calling Edge Function...');
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token ?? '';
      const edgeUrl = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/generate-try-on`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
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
        return { imageBase64: edgeJson.imageBase64, mimeType: edgeJson.mimeType || 'image/png' };
      }
      if (!edgeRes.ok && typeof edgeJson?.error === 'string') {
        console.error('[TryOn] Edge Function error:', edgeRes.status, edgeJson.error);
        throw new Error(edgeJson.error);
      }
      if (edgeRes.status === 400) {
        throw new Error(typeof edgeJson?.error === 'string' ? edgeJson.error : 'Neispravan zahtev. Pokušajte sa manjom slikom (do ~2 MB).');
      }
      if (edgeRes.status >= 500 || edgeRes.status === 403 || edgeRes.status === 429) {
        console.warn('[TryOn] Edge Function failed:', edgeRes.status, edgeJson?.error);
        if (edgeRes.status === 403) throw new Error('Gemini API ključ u Supabase nije validan. Proveri Edge Function secrets (GEMINI_API_KEY).');
        if (edgeRes.status === 429) throw new Error('Previše zahteva. Sačekajte minut i pokušajte ponovo.');
      }
      if (!edgeRes.ok) {
        throw new Error(typeof edgeJson?.error === 'string' ? edgeJson.error : `Greška (${edgeRes.status}). Pokušajte ponovo.`);
      }
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (err?.name === 'AbortError') throw new Error('Zahtev je istekao. Generisanje traje dugo - pokušajte ponovo.');
      if (msg === 'Network request failed' || (typeof msg === 'string' && msg.includes('Network request failed'))) {
        throw new Error('Nema konekcije sa serverom. Proverite internet, .env (EXPO_PUBLIC_SUPABASE_URL) i da li je Edge Function generate-try-on deploy-ovan.');
      }
      if (err?.message) throw err;
      throw new Error('Generisanje nije uspelo. Proverite konekciju i pokušajte ponovo.');
    }
  }

  throw new Error('Try-On zahteva Supabase. U .env postavite EXPO_PUBLIC_SUPABASE_URL i deploy-ujte Edge Function generate-try-on.');
}

// ===================================================
// SAVED TRY-ON IMAGES (Supabase Storage + generations table)
// ===================================================

const TRYON_BUCKET = 'try-on-results';
let _tryonBucketReady = false;

async function ensureTryOnBucket(): Promise<void> {
  if (_tryonBucketReady) return;
  try {
    const { error } = await supabase.storage.createBucket(TRYON_BUCKET, {
      public: true,
      fileSizeLimit: 10485760,
    });
    if (error && !error.message.includes('already exists')) {
      console.warn('[TryOn] Bucket create warning:', error.message);
    }
  } catch (e) {
    console.warn('[TryOn] Bucket check error:', e);
  }
  _tryonBucketReady = true;
}

export async function saveTryOnImage(base64: string, outfitId: string, userId: string): Promise<string> {
  const filename = `${userId}/tryon_${outfitId}_${Date.now()}.png`;
  const key = `${R2_KEYS.TRYON_PREFIX}${filename}`;

  if (!isR2Configured()) {
    throw new Error('Čuvanje try-on slike zahteva Cloudflare R2. Podesite R2 u Supabase Edge Function secrets.');
  }
  const url = await uploadToR2(key, base64, 'image/png');
  console.log('[TryOn] Saved to R2:', url);
  return url;
}

export interface SavedTryOnImage {
  generationId: string;
  uri: string;
  filename: string;
  timestamp: number;
  outfitId: string;
}

export async function getSavedTryOnImages(userId: string): Promise<SavedTryOnImage[]> {
  try {
    const { data, error } = await supabase
      .from('generations')
      .select('id, output_url, outfit_id, created_at')
      .eq('user_id', userId)
      .eq('type', 'image')
      .eq('status', 'completed')
      .not('output_url', 'is', null)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[TryOn] Load images error:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    const seenUrls = new Set<string>();
    const seenIds = new Set<string>();
    return data
      .filter((row) => row.output_url && row.output_url.startsWith('http'))
      .filter((row) => {
        const url = row.output_url!;
        const normal = url.split('?')[0].trim().toLowerCase().replace(/\/$/, '').replace(/^https?:\/\//, '');
        const id = row.id;
        if (seenUrls.has(normal) || seenIds.has(id)) return false;
        seenUrls.add(normal);
        seenIds.add(id);
        return true;
      })
      .map((row) => ({
        generationId: row.id,
        uri: row.output_url!,
        filename: row.output_url!.split('/').pop() || '',
        timestamp: new Date(row.created_at).getTime(),
        outfitId: row.outfit_id || '',
      }));
  } catch (err) {
    console.error('[TryOn] Error listing images:', err);
    return [];
  }
}

export async function deleteTryOnImage(generationId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('generations')
      .select('output_url')
      .eq('id', generationId)
      .maybeSingle();

    if (data?.output_url) {
      const url = data.output_url as string;
      if (isR2Configured()) {
        const key = keyFromPublicUrl(url);
        if (key) await deleteFromR2(key).catch(() => {});
      } else {
        const bucketPath = url.split(`/storage/v1/object/public/${TRYON_BUCKET}/`).pop();
        if (bucketPath) {
          await supabase.storage.from(TRYON_BUCKET).remove([bucketPath]).catch(() => {});
        }
      }
    }

    await supabase.from('generations').delete().eq('id', generationId);
  } catch (err) {
    console.error('[TryOn] Error deleting image:', err);
  }
}

/** @deprecated No longer needed - data is in Supabase, RLS protects per user. */
export async function clearAllLocalTryOnData(): Promise<void> {}

// ===================================================
// OUTFIT DRAFT (Kapsula builder) – vezan za profil, ništa lokalno
// ===================================================

export interface OutfitDraftItem {
  zoneId: string;
  id: string;
  image_url: string;
  title: string | null;
}

export async function loadOutfitDraft(userId: string): Promise<OutfitDraftItem[]> {
  try {
    const { data, error } = await supabase
      .from('user_outfit_draft')
      .select('items')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[OutfitDraft] Load error:', error.message);
      return [];
    }
    const items = (data?.items as OutfitDraftItem[] | null) ?? [];
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn('[OutfitDraft] Load error:', err);
    return [];
  }
}

export async function saveOutfitDraft(userId: string, items: OutfitDraftItem[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_outfit_draft')
      .upsert(
        {
          user_id: userId,
          items: items as unknown as Record<string, unknown>[],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.warn('[OutfitDraft] Save error:', error.message);
    }
  } catch (err) {
    console.warn('[OutfitDraft] Save error:', err);
  }
}

// ===================================================
// SAVED OUTFITS - Supabase outfit_compositions table
// ===================================================

export interface SavedOutfitItem {
  id: string;
  imageUrl: string;
  title: string | null;
  zoneId?: string;
}

export interface SavedOutfit {
  id: string;
  items: SavedOutfitItem[];
  timestamp: number;
  tryOnImageUri?: string;
}

function makeUUID(): string {
  const h = '0123456789abcdef';
  const s = (n: number) => Array.from({ length: n }, () => h[Math.floor(Math.random() * 16)]).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${h[8 + Math.floor(Math.random() * 4)]}${s(3)}-${s(12)}`;
}

export async function saveOutfitComposition(
  items: SavedOutfitItem[],
  tryOnImageUri?: string,
  userId?: string,
  forDate?: string | null
): Promise<SavedOutfit> {
  const uid = userId || (await supabase.auth.getSession()).data?.session?.user?.id;
  const id = makeUUID();

  const timestamp = forDate
    ? new Date(forDate + 'T12:00:00.000Z').getTime()
    : Date.now();
  const newOutfit: SavedOutfit = { id, items, timestamp, tryOnImageUri };

  if (uid) {
    const insertPayload: Record<string, unknown> = {
      id,
      user_id: uid,
      items: items as any,
      try_on_image_url: tryOnImageUri || null,
    };
    if (forDate) {
      insertPayload.created_at = new Date(forDate + 'T12:00:00.000Z').toISOString();
    }
    const { error } = await supabase.from('outfit_compositions').insert(insertPayload);
    if (error) {
      console.error('[Outfits] Save error:', error.message, error.code);
    }
  }

  return newOutfit;
}

export async function getSavedOutfits(userId: string): Promise<SavedOutfit[]> {
  try {
    const { data, error } = await supabase
      .from('outfit_compositions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Outfits] Load error:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row) => ({
      id: row.id,
      items: (row.items as unknown as SavedOutfitItem[]) ?? [],
      timestamp: new Date(row.created_at).getTime(),
      tryOnImageUri: row.try_on_image_url || undefined,
    }));
  } catch (err) {
    console.error('[Outfits] Error loading:', err);
    return [];
  }
}

export async function deleteOutfitComposition(outfitId: string, userId?: string): Promise<void> {
  let query = supabase.from('outfit_compositions').delete().eq('id', outfitId);
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) {
    console.error('[Outfits] Error deleting:', error.message, error.code);
  }
}
