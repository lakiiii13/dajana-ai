// ===========================================
// DAJANA AI - Video Service
// TheNewBlack AI Video API integration
// 2-step async: start → poll for result
// ===========================================

import * as FileSystem from './safeFileSystem';
import { supabase } from './supabase';
import { toPathString } from './fileSystemPath';
import { isR2Configured, uploadToR2, uploadToR2FromFile, keyFromPublicUrl, deleteFromR2, R2_KEYS } from './r2Storage';

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
 * If the image is a local file (file:///...) or data URI, upload to Supabase
 * storage and return a public URL. Otherwise return as-is.
 */
async function ensurePublicUrl(imageUrl: string): Promise<string> {
  const path = toPathString(imageUrl);
  if (!path) throw new Error('Slika za video nije ispravna.');

  let base64: string;
  let isPng = false;

  if (path.startsWith('data:')) {
    // data URI (e.g. data:image/png;base64,iVBOR...) — extract base64 payload
    console.log('[Video] Converting data URI to upload...');
    isPng = path.includes('image/png');
    const commaIdx = path.indexOf(',');
    if (commaIdx < 0) throw new Error('Neispravan data URI za video.');
    base64 = path.substring(commaIdx + 1);
  } else if (path.startsWith('file://') || path.startsWith('/')) {
    console.log('[Video] Uploading local image to Supabase...');
    isPng = path.toLowerCase().endsWith('.png');
    base64 = await FileSystem.readAsStringAsync(path, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    return path; // already a remote URL
  }

  const approxKB = Math.round(base64.length * 3 / 4 / 1024);
  if (approxKB > 8192) {
    console.warn(`[Video] Image too large: ${approxKB} KB, max 8 MB`);
    throw new Error('Slika je prevelika za video (max ~8 MB). Pokušajte sa manjom slikom.');
  }

  const ext = isPng ? 'png' : 'jpg';
  const contentType = isPng ? 'image/png' : 'image/jpeg';
  const filename = `src_${Date.now()}.${ext}`;

  if (!isR2Configured()) {
    throw new Error('Slika za video zahteva Cloudflare R2. Podesite R2 u Supabase Edge Function secrets.');
  }
  console.log(`[Video] Uploading as ${contentType}, size ~${approxKB} KB (R2)`);
  const key = `${R2_KEYS.SOURCES_PREFIX}${filename}`;
  const url = await uploadToR2(key, base64, contentType);
  console.log('[Video] Public URL (R2):', url);
  return url;
}

const VIDEO_START_RETRIES = 3;
const VIDEO_START_RETRY_DELAY_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Map server/Edge error text to jasne poruke za korisnika. */
function friendlyVideoError(serverMessage: string): string {
  const s = serverMessage.toLowerCase();
  if (s.includes('worker_limit') || s.includes('compute resources')) return 'Servis je preopterećen. Pokušaj za minutu ili izaberi nešto manju sliku.';
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
  const rawPrompt = prompt.trim();
  const sceneMotion =
    /^\s*zoom\s*$/i.test(rawPrompt) || /zoom\s*(ka\s*)?licu|zoom\s+to\s+face/i.test(rawPrompt)
      ? 'Subject stands still while the camera performs a smooth, moderately slow zoom in toward the face'
      : rawPrompt;
  const preserveFacePrompt =
    `Preserve the person's face and identity exactly. Keep all facial features, skin tone, expression, and likeness identical to the source photo. The result must look like the same person. Scene or motion: ${sceneMotion}`.trim();
  const body = JSON.stringify({ image: publicUrl, prompt: preserveFacePrompt, time: duration });

  const { data: sessionData } = await supabase.auth.getSession();
  const userToken = sessionData?.session?.access_token ?? '';
  let lastErrMsg = '';

  for (let attempt = 1; attempt <= VIDEO_START_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(edgeUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          ...(userToken ? { 'X-User-JWT': userToken } : {}),
        },
        body,
      });
      clearTimeout(timeoutId);

      const responseText = await res.text().catch(() => '');
      if (!res.ok) {
        let errMsg = 'Servis za video je privremeno nedostupan. Pokušajte ponovo kasnije.';
        try {
          const j = JSON.parse(responseText);
          if (j.error && typeof j.error === 'string') errMsg = j.error;
        } catch {}
        lastErrMsg = errMsg;
        const isCreditError = /kredita|credits|dovoljno/i.test(errMsg);
        if (isCreditError) {
          throw new Error(errMsg);
        }
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
      const isCreditError = /kredita|credits|dovoljno/i.test(lastErrMsg);
      if (isCreditError) {
        throw new Error(lastErrMsg);
      }
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
  const { data: sessionData } = await supabase.auth.getSession();
  const userToken = sessionData?.session?.access_token ?? '';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const res = await fetch(edgeUrl, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      ...(userToken ? { 'X-User-JWT': userToken } : {}),
    },
    body: JSON.stringify({ jobId }),
  });
  clearTimeout(timeoutId);
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
 * Poll until video is ready (max ~8 min).
 * Resilient to transient network errors — skips failed polls instead of aborting.
 */
export async function pollVideoResult(
  jobId: string,
  onProgress?: (attempt: number) => void,
  maxAttempts = 48,
  intervalMs = 10000
): Promise<string> {
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 5;

  for (let i = 0; i < maxAttempts; i++) {
    onProgress?.(i + 1);
    try {
      const result = await getVideoResult(jobId);
      consecutiveErrors = 0;
      if (result.videoUrl) return result.videoUrl;
    } catch (e: unknown) {
      consecutiveErrors++;
      console.warn(`[Video] Poll attempt ${i + 1} failed (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, e instanceof Error ? e.message : e);
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        throw new Error('Veza sa video servisom nije stabilna. Proverite internet i pokušajte ponovo.');
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error('Video se dugo generiše. Možete pokušati ponovo ili proveriti kasnije u sekciji Video.');
}

// ---- Saved videos (Supabase Storage + generations table) ----

const VIDEO_BUCKET = 'user-videos';
let _videoBucketReady = false;

async function ensureVideoBucket(): Promise<void> {
  if (_videoBucketReady) return;
  try {
    const { error } = await supabase.storage.createBucket(VIDEO_BUCKET, {
      public: true,
      fileSizeLimit: 52428800, // 50 MB
    });
    if (error && !error.message.includes('already exists')) {
      console.warn('[Video] Bucket create warning:', error.message);
    }
  } catch (e) {
    console.warn('[Video] Bucket check error:', e);
  }
  _videoBucketReady = true;
}

export async function saveVideo(
  videoUrl: string,
  sourceImageUrl: string,
  prompt: string,
  duration: '5' | '10',
  userId?: string
): Promise<SavedVideo> {
  const uid = userId || (await supabase.auth.getSession()).data?.session?.user?.id;

  const tmpPath = `${FileSystem.cacheDirectory}vid_tmp_${Date.now()}.mp4`;
  console.log('[Video] Downloading video for upload...');
  const dl = await FileSystem.downloadAsync(videoUrl, tmpPath);
  if (dl.status !== 200) throw new Error('Failed to download video');

  const storagePath = `${uid || 'anon'}/vid_${Date.now()}.mp4`;
  let publicVideoUrl: string;

  if (!isR2Configured()) {
    await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
    throw new Error('Čuvanje videa zahteva Cloudflare R2. Podesite R2 u Supabase Edge Function secrets.');
  }
  const key = `${R2_KEYS.VIDEOS_PREFIX}${storagePath}`;
  try {
    publicVideoUrl = await uploadToR2FromFile(key, tmpPath, 'video/mp4');
    console.log('[Video] Saved to R2:', publicVideoUrl);
  } catch (r2Err: any) {
    const r2Msg = r2Err?.message ?? '';
    if (r2Msg.includes('preopterećen') || r2Msg.includes('prebukirana')) {
      throw new Error('Cloudflare R2 je trenutno preopterećen. Pokušajte ponovo za nekoliko minuta.');
    }
    throw r2Err;
  } finally {
    await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
  }

  let generationId = `vid_${Date.now()}`;
  if (uid) {
    const { data: insertedRow, error: insertErr } = await supabase
      .from('generations')
      .insert({
        user_id: uid,
        type: 'video' as const,
        output_url: publicVideoUrl,
        input_image_url: sourceImageUrl,
        prompt,
        metadata: { duration },
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (insertErr) {
      console.error('[Video] Generation log insert error:', insertErr.message, insertErr.code);
    } else if (insertedRow) {
      generationId = insertedRow.id;
      console.log('[Video] Generation logged OK, id:', generationId);
    }
  }

  return {
    id: generationId,
    uri: publicVideoUrl,
    sourceImageUrl,
    prompt,
    duration,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Insert video into generations only (no file upload). Use when we have a remote URL
 * but saveVideo failed – so the video still appears in Kolekcija (sve iz baze).
 */
export async function insertVideoGenerationOnly(
  userId: string,
  outputUrl: string,
  sourceImageUrl: string,
  prompt: string,
  duration: '5' | '10'
): Promise<SavedVideo | null> {
  try {
    const { data: insertedRow, error: insertErr } = await supabase
      .from('generations')
      .insert({
        user_id: userId,
        type: 'video' as const,
        output_url: outputUrl,
        input_image_url: sourceImageUrl,
        prompt,
        metadata: { duration },
        status: 'completed' as const,
        completed_at: new Date().toISOString(),
      })
      .select('id, created_at')
      .single();

    if (insertErr) {
      console.error('[Video] Insert-only error:', insertErr.message);
      return null;
    }
    return {
      id: insertedRow.id,
      uri: outputUrl,
      sourceImageUrl,
      prompt,
      duration,
      createdAt: insertedRow.created_at ?? new Date().toISOString(),
    };
  } catch (e) {
    console.error('[Video] Insert-only exception:', e);
    return null;
  }
}

export async function getSavedVideos(userId?: string): Promise<SavedVideo[]> {
  const uid = userId || (await supabase.auth.getSession()).data?.session?.user?.id;
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from('generations')
      .select('id, output_url, input_image_url, prompt, metadata, created_at')
      .eq('user_id', uid)
      .eq('type', 'video')
      .eq('status', 'completed')
      .not('output_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Video] Load videos error:', error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data
      .filter((row) => row.output_url && row.output_url.startsWith('http'))
      .map((row) => {
        const meta = (row.metadata ?? {}) as Record<string, any>;
        return {
          id: row.id,
          uri: row.output_url!,
          sourceImageUrl: (row.input_image_url as string) || '',
          prompt: (row.prompt as string) || '',
          duration: (meta.duration || '5') as '5' | '10',
          createdAt: row.created_at,
        };
      });
  } catch (err) {
    console.error('[Video] Error loading saved videos:', err);
    return [];
  }
}

export async function deleteSavedVideo(id: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('generations')
      .select('output_url')
      .eq('id', id)
      .maybeSingle();

    if (data?.output_url) {
      const url = data.output_url as string;
      if (isR2Configured()) {
        const key = keyFromPublicUrl(url);
        if (key) await deleteFromR2(key).catch(() => {});
      } else {
        const bucketPath = url.split(`/storage/v1/object/public/${VIDEO_BUCKET}/`).pop();
        if (bucketPath) {
          await supabase.storage.from(VIDEO_BUCKET).remove([bucketPath]).catch(() => {});
        }
      }
    }

    const { error: delErr } = await supabase.from('generations').delete().eq('id', id);
    if (delErr) {
      console.error('[Video] Delete generation error:', delErr.message, delErr.code);
    }
  } catch (err) {
    console.error('[Video] Error deleting video:', err);
  }
}

/** @deprecated No longer needed - data is in Supabase, RLS protects per user. */
export async function clearAllLocalVideos(): Promise<void> {}
