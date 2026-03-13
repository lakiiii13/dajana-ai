// ===========================================
// DAJANA AI - Video Service
// TheNewBlack AI Video API integration
// 2-step async: start → poll for result
// ===========================================

import * as FileSystem from './safeFileSystem';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import { toPathString } from './fileSystemPath';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

export interface VideoStartResult {
  jobId: string;
  publicImageUrl: string;
}

export interface VideoResult {
  videoUrl: string | null;
}

export interface SavedVideo {
  id: string;
  uri: string;
  sourceImageUrl: string;
  prompt: string;
  duration: '5' | '10';
  createdAt: string;
}

const BUCKET_NAME = 'video-sources';
let bucketReady = false;

/**
 * Ensure Supabase storage bucket exists (create on first use).
 */
async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  try {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10 MB
    });
    if (error && !error.message.includes('already exists')) {
      console.warn('[Video] Bucket create warning:', error.message);
    }
  } catch (e) {
    console.warn('[Video] Bucket check error:', e);
  }
  bucketReady = true;
}

/**
 * If the image is a local file (file:///...), upload to Supabase
 * storage and return a public URL. Otherwise return as-is.
 */
async function ensurePublicUrl(imageUrl: string): Promise<string> {
  const path = toPathString(imageUrl);
  if (!path) throw new Error('Slika za video nije ispravna.');
  if (!path.startsWith('file://') && !path.startsWith('/')) {
    return path; // already a remote URL
  }

  console.log('[Video] Uploading local image to Supabase...');
  await ensureBucket();

  const base64 = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const filename = `src_${Date.now()}.jpg`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, decode(base64), {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('[Video] Upload error:', error.message);
    throw new Error('Greška pri uploadu slike: ' + error.message);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  console.log('[Video] Public URL:', urlData.publicUrl);
  return urlData.publicUrl;
}

const VIDEO_START_RETRIES = 3;
const VIDEO_START_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Map server/Edge error text to jasne poruke za korisnika. */
function friendlyVideoError(serverMessage: string): string {
  const s = serverMessage.toLowerCase();
  if (s.includes('prebukiran') || s.includes('previše zahteva') || s.includes('429')) return 'Servis je privremeno prebukiran. Sačekajte malo i pokušajte ponovo.';
  if (s.includes('ključ') || s.includes('api key') || s.includes('invalid') || s.includes('401') || s.includes('403')) return 'Video API ključ nije ispravan. Administrator treba da proveri VIDEO_API_KEY u Supabase.';
  if (s.includes('veza') || s.includes('network') || s.includes('timeout') || s.includes('failed')) return 'Veza sa servisom nije uspela. Proverite internet i pokušajte ponovo.';
  if (s.includes('nije podešen') || s.includes('not set')) return 'Video servis nije podešen. Administrator treba da doda VIDEO_API_KEY u Supabase Secrets.';
  if (serverMessage.length > 0 && serverMessage.length < 180) return serverMessage;
  return 'Servis za video je privremeno nedostupan. Pokušajte ponovo za nekoliko trenutaka.';
}

/**
 * Step 1: Start video generation (returns a job ID).
 * Retry do 3 puta na 5xx/mrežu; jasne poruke grešaka.
 */
export async function startVideoGeneration(
  imageUrl: string | { uri?: string; path?: string },
  prompt: string,
  duration: '5' | '10' = '5'
): Promise<VideoStartResult> {
  const pathOrUrl = toPathString(imageUrl);
  if (!pathOrUrl.trim()) {
    throw new Error('Slika za video nije ispravna.');
  }
  if (typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('Opis za video je obavezan.');
  }
  console.log('[Video] Starting generation, duration:', duration);

  const publicUrl = await ensurePublicUrl(pathOrUrl);
  console.log('[Video] Using image URL:', publicUrl);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Video zahteva Supabase. U .env postavite EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY. Deploy-ujte Edge Functions video-start i video-result i u Supabase Secrets dodajte VIDEO_API_KEY.'
    );
  }

  const edgeUrl = `${SUPABASE_URL}/functions/v1/video-start`;
  // Zoom ka licu: kad korisnik izabere Zoom, šaljemo jasnu instrukciju za zoom na lice
  const rawPrompt = prompt.trim();
  const sceneMotion =
    /^\s*zoom\s*$/i.test(rawPrompt) || /zoom\s*(ka\s*)?licu|zoom\s+to\s+face/i.test(rawPrompt)
      ? 'Subject stands still while the camera performs a smooth, moderately slow zoom in toward the face'
      : rawPrompt;
  const preserveFacePrompt =
    `Preserve the person's face and identity exactly. Keep all facial features, skin tone, expression, and likeness identical to the source photo. The result must look like the same person. Scene or motion: ${sceneMotion}`.trim();
  const body = JSON.stringify({ image: publicUrl, prompt: preserveFacePrompt, time: duration });
  let lastErrMsg = '';

  for (let attempt = 1; attempt <= VIDEO_START_RETRIES; attempt++) {
    try {
      const res = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body,
      });

      const responseText = await res.text().catch(() => '');
      if (!res.ok) {
        let errMsg = 'Servis za video je privremeno nedostupan. Pokušajte ponovo kasnije.';
        try {
          const j = JSON.parse(responseText);
          if (j.error && typeof j.error === 'string') errMsg = j.error;
        } catch {}
        lastErrMsg = errMsg;
        if (res.status === 401 || res.status === 403 || res.status === 429) {
          throw new Error(friendlyVideoError(errMsg));
        }
        if (attempt < VIDEO_START_RETRIES && res.status >= 500) {
          console.warn('[Video] Start attempt', attempt, 'failed', res.status, '- retrying...');
          await sleep(VIDEO_START_RETRY_DELAY_MS * attempt);
          continue;
        }
        throw new Error(friendlyVideoError(errMsg));
      }

      let data: { jobId?: string };
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Neispravan odgovor od video servisa. Pokušajte ponovo.');
      }
      const jobId = String(data.jobId ?? responseText).trim();
      console.log('[Video] Job ID:', jobId);
      return { jobId, publicImageUrl: publicUrl };
    } catch (e: unknown) {
      lastErrMsg = e instanceof Error ? e.message : String(e);
      if (attempt < VIDEO_START_RETRIES) {
        console.warn('[Video] Start attempt', attempt, 'error - retrying...', lastErrMsg);
        await sleep(VIDEO_START_RETRY_DELAY_MS * attempt);
        continue;
      }
      throw new Error(friendlyVideoError(lastErrMsg));
    }
  }

  throw new Error(friendlyVideoError(lastErrMsg || 'Servis za video nije dostupan. Pokušajte ponovo.'));
}

/**
 * Step 2: Poll for video result (returns URL or null if not ready).
 */
export async function getVideoResult(jobId: string): Promise<VideoResult> {
  console.log('[Video] Checking result for:', jobId);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Video zahteva Supabase. Postavite EXPO_PUBLIC_SUPABASE_URL i anon key.');
  }

  const edgeUrl = `${SUPABASE_URL}/functions/v1/video-result`;
  const res = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ jobId }),
  });
  const text = await res.text().catch(() => '');
  if (!res.ok) {
    if (res.status === 404 || text.toLowerCase().includes('not ready')) return { videoUrl: null };
    console.error('[Video] Result error:', res.status, text);
    let errMsg = 'Greška pri proveri videa. Pokušajte ponovo.';
    try {
      const j = JSON.parse(text);
      if (j.error && typeof j.error === 'string') errMsg = friendlyVideoError(j.error);
    } catch {}
    throw new Error(errMsg);
  }
  let data: { videoUrl?: string | null };
  try {
    data = JSON.parse(text);
  } catch {
    return { videoUrl: null };
  }
  let url: string | null = data.videoUrl ?? null;

  const notReady =
    !url ||
    url.length < 20 ||
    !url.startsWith('http') ||
    /error|not ready|processing|pending|generating|queue/i.test(url);

  if (notReady) {
    console.log('[Video] Not ready yet, response:', (url || '').substring(0, 80));
    return { videoUrl: null };
  }

  console.log('[Video] Video URL:', url);
  return { videoUrl: url };
}

/**
 * Poll until video is ready (max ~5 min).
 */
export async function pollVideoResult(
  jobId: string,
  onProgress?: (attempt: number) => void,
  maxAttempts = 48,
  intervalMs = 10000
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    onProgress?.(i + 1);
    const result = await getVideoResult(jobId);
    if (result.videoUrl) return result.videoUrl;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Video se dugo generiše. Možete pokušati ponovo ili proveriti kasnije u sekciji Video.');
}

// ---- Local gallery (saved videos) ----

const VIDEOS_DIR = `${FileSystem.documentDirectory}videos/`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(VIDEOS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(VIDEOS_DIR, { intermediates: true });
}

export async function saveVideo(
  videoUrl: string,
  sourceImageUrl: string,
  prompt: string,
  duration: '5' | '10'
): Promise<SavedVideo> {
  await ensureDir();
  const id = `vid_${Date.now()}`;
  const localPath = `${VIDEOS_DIR}${id}.mp4`;

  console.log('[Video] Downloading to local:', localPath);
  const dl = await FileSystem.downloadAsync(videoUrl, localPath);
  if (dl.status !== 200) throw new Error('Failed to download video');

  const saved: SavedVideo = {
    id,
    uri: localPath,
    sourceImageUrl,
    prompt,
    duration,
    createdAt: new Date().toISOString(),
  };

  // Store metadata
  const metaPath = `${VIDEOS_DIR}meta.json`;
  let list: SavedVideo[] = [];
  try {
    const raw = await FileSystem.readAsStringAsync(metaPath);
    const parsed = JSON.parse(raw);
    list = Array.isArray(parsed) ? parsed : [];
  } catch {}
  list.unshift(saved);
  await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(list));

  return saved;
}

export async function getSavedVideos(): Promise<SavedVideo[]> {
  await ensureDir();
  const metaPath = `${VIDEOS_DIR}meta.json`;
  try {
    const info = await FileSystem.getInfoAsync(metaPath);
    if (!info.exists) {
      console.log('[Video] No meta.json yet');
      return [];
    }
    const raw = await FileSystem.readAsStringAsync(metaPath);
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed as SavedVideo[] : [];
    console.log('[Video] Loaded', list.length, 'saved videos');
    return list;
  } catch (e) {
    console.error('[Video] Error loading saved videos:', e);
    return [];
  }
}

export async function deleteSavedVideo(id: string): Promise<void> {
  const metaPath = `${VIDEOS_DIR}meta.json`;
  let list: SavedVideo[] = [];
  try {
    const raw = await FileSystem.readAsStringAsync(metaPath);
    const parsed = JSON.parse(raw);
    list = Array.isArray(parsed) ? parsed : [];
  } catch {}
  const vid = list.find((v) => v.id === id);
  if (vid) {
    try { await FileSystem.deleteAsync(vid.uri, { idempotent: true }); } catch {}
  }
  list = list.filter((v) => v.id !== id);
  await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(list));
}

/**
 * Clear all local saved videos (call on sign out so next user doesn't see previous user's data).
 */
export async function clearAllLocalVideos(): Promise<void> {
  const metaPath = `${VIDEOS_DIR}meta.json`;
  let list: SavedVideo[] = [];
  try {
    const raw = await FileSystem.readAsStringAsync(metaPath);
    const parsed = JSON.parse(raw);
    list = Array.isArray(parsed) ? parsed : [];
  } catch {}
  for (const v of list) {
    try {
      await FileSystem.deleteAsync(v.uri, { idempotent: true });
    } catch {}
  }
  try {
    await FileSystem.writeAsStringAsync(metaPath, '[]');
  } catch (e) {
    console.error('[Video] Error clearing saved videos list:', e);
  }
}
