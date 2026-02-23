// ===========================================
// DAJANA AI - Video Service
// TheNewBlack AI Video API integration
// 2-step async: start → poll for result
// ===========================================

import * as FileSystem from './safeFileSystem';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import { toPathString } from './fileSystemPath';

const API_KEY = 'USXCRCWDWH8OPNNHDT3VQCBUJQIYJE';
const BASE = 'https://thenewblack.ai/api/1.1/wf';

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

/**
 * Step 1: Start video generation (returns a job ID).
 * Automatically uploads local files to get a public URL.
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
  console.log('[Video] Using image URL:', publicUrl.substring(0, 80));

  const formData = new FormData();
  formData.append('image', publicUrl);
  formData.append('prompt', prompt);
  formData.append('time', duration);

  const res = await fetch(`${BASE}/ai-video?api_key=${API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const responseText = await res.text().catch(() => '');
  if (!res.ok) {
    console.error('[Video] Start error:', res.status, responseText);
    if (res.status >= 500) {
      throw new Error('Servis za video je privremeno nedostupan. Pokušajte ponovo kasnije.');
    }
    throw new Error(`Video API greška: ${res.status}`);
  }

  const jobId = responseText;
  console.log('[Video] Job ID:', jobId.trim());
  return { jobId: jobId.trim(), publicImageUrl: publicUrl };
}

/**
 * Step 2: Poll for video result (returns URL or null if not ready).
 */
export async function getVideoResult(jobId: string): Promise<VideoResult> {
  console.log('[Video] Checking result for:', jobId);

  const formData = new FormData();
  formData.append('id', jobId);

  const res = await fetch(`${BASE}/results_video?api_key=${API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 404 || text.includes('not ready')) {
      return { videoUrl: null };
    }
    console.error('[Video] Result error:', res.status, text);
    throw new Error(`Video result error: ${res.status}`);
  }

  const body = await res.text();
  const url = body.trim();

  // API returns various non-URL strings while processing
  const notReady =
    !url ||
    url.length < 20 ||
    !url.startsWith('http') ||
    url.toLowerCase().includes('error') ||
    url.toLowerCase().includes('not ready') ||
    url.toLowerCase().includes('processing') ||
    url.toLowerCase().includes('pending') ||
    url.toLowerCase().includes('generating') ||
    url.toLowerCase().includes('queue');

  if (notReady) {
    console.log('[Video] Not ready yet, response:', url.substring(0, 80));
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
  throw new Error('Video generation timed out');
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
    list = JSON.parse(raw);
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
    const list = JSON.parse(raw) as SavedVideo[];
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
    list = JSON.parse(raw);
  } catch {}
  const vid = list.find((v) => v.id === id);
  if (vid) {
    try { await FileSystem.deleteAsync(vid.uri, { idempotent: true }); } catch {}
  }
  list = list.filter((v) => v.id !== id);
  await FileSystem.writeAsStringAsync(metaPath, JSON.stringify(list));
}
