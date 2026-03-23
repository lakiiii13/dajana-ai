// ===========================================
// DAJANA AI - R2 storage via Supabase Edge Function
// Upload/delete go through upload-to-r2 (credentials stay in Supabase Secrets).
// ===========================================

import { supabase } from './supabase';
import * as FileSystem from './safeFileSystem';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
const R2_PUBLIC_URL = (process.env.EXPO_PUBLIC_R2_PUBLIC_URL ?? '').trim().replace(/\/$/, '');

export const R2_KEYS = {
  TRYON_PREFIX: 'try-on/',
  VIDEOS_PREFIX: 'videos/',
  SOURCES_PREFIX: 'sources/',
  OUTFIT_PREFIX: 'outfit-images/',
} as const;

export function isR2Configured(): boolean {
  return Boolean(R2_PUBLIC_URL && SUPABASE_URL);
}

/** Get R2 object key from stored public URL (for delete). */
export function keyFromPublicUrl(url: string): string | null {
  if (!url || !R2_PUBLIC_URL) return null;
  if (!url.startsWith(R2_PUBLIC_URL + '/')) return null;
  return url.slice((R2_PUBLIC_URL + '/').length);
}

const R2_RETRIES = 3;
const R2_RETRY_DELAY_MS = 2500;

function isCloudflareErrorPage(raw: string): boolean {
  return (
    raw.includes('Temporarily unavailable') ||
    raw.includes('Cloudflare') && raw.includes('Error') ||
    raw.trimStart().startsWith('<!DOCTYPE')
  );
}

function friendlyR2Error(raw: string, status: number): string {
  if (isCloudflareErrorPage(raw) || status === 502 || status === 503 || status === 504) {
    return 'Servis privremeno nedostupan. Pokušaj ponovo za minutu.';
  }
  let json: { error?: string; code?: string; message?: string };
  try {
    json = JSON.parse(raw);
    if (json?.code === 'WORKER_LIMIT' || (json?.message && json.message.includes('compute resources'))) {
      return 'Servis je preopterećen. Pokušaj za minutu ili izaberi nešto manju sliku.';
    }
    if (json?.error && typeof json.error === 'string') return json.error;
    if (json?.message && typeof json.message === 'string') return json.message;
  } catch {
    // ignore
  }
  return raw && raw.length < 200 ? raw : `Greška ${status}. Pokušaj ponovo.`;
}

/** True if response indicates overload (do not retry). */
function isOverloadError(raw: string): boolean {
  try {
    const j = JSON.parse(raw);
    return (
      j?.code === 'WORKER_LIMIT' ||
      (j?.message && (String(j.message).includes('compute resources') || String(j.message).includes('preopterećen'))) ||
      (j?.error && String(j.error).includes('preopterećen'))
    );
  } catch {
    return false;
  }
}

async function getPresignedUploadUrl(key: string, contentType: string): Promise<{ uploadUrl: string; publicUrl: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token ?? '';
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-r2-upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { 'X-User-JWT': token } : {}),
    },
    body: JSON.stringify({ key, contentType }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(friendlyR2Error(raw, res.status));
  }
  let json: { uploadUrl?: string; publicUrl?: string; error?: string };
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Invalid response from get-r2-upload-url.');
  }
  if (json.error || !json.uploadUrl || !json.publicUrl) {
    throw new Error(json.error ?? 'Presigned URL nije vraćen.');
  }
  return { uploadUrl: json.uploadUrl, publicUrl: json.publicUrl };
}

/** Upload direktno na R2 preko presigned URL – fajl ne prolazi kroz Edge Function (nema memory limit).
 * Koristi expo-file-system uploadAsync jer React Native fetch ne podržava ArrayBuffer/Blob kao body. */
export async function uploadToR2(key: string, bodyBase64: string, contentType: string): Promise<string> {
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

  const tmpPath = `${FileSystem.cacheDirectory}r2_upload_${Date.now()}_${Math.random().toString(36).slice(2)}.bin`;
  try {
    await FileSystem.writeAsStringAsync(tmpPath, bodyBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    let lastStatus = 0;
    let lastBody = '';
    for (let attempt = 1; attempt <= R2_RETRIES; attempt++) {
      const res = await FileSystem.uploadAsync(uploadUrl, tmpPath, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': contentType },
      });
      lastStatus = res.status;
      lastBody = res.body ?? '';
      if (lastStatus >= 200 && lastStatus < 300) return publicUrl;
      if (isOverloadError(lastBody)) {
        throw new Error(friendlyR2Error(lastBody, lastStatus));
      }
      const retryable = lastStatus === 502 || lastStatus === 503 || lastStatus === 504;
      if (!retryable || attempt === R2_RETRIES) {
        throw new Error(friendlyR2Error(lastBody, lastStatus));
      }
      await new Promise((r) => setTimeout(r, R2_RETRY_DELAY_MS * attempt));
    }
    throw new Error(`Greška ${lastStatus}. Pokušaj ponovo.`);
  } finally {
    await FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
  }
}

/** Upload fajl direktno na R2 preko presigned URL – bez učitavanja u memoriju.
 * Idealno za velike fajlove (video). */
export async function uploadToR2FromFile(key: string, filePath: string, contentType: string): Promise<string> {
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl(key, contentType);

  let lastStatus = 0;
  let lastBody = '';
  for (let attempt = 1; attempt <= R2_RETRIES; attempt++) {
    const res = await FileSystem.uploadAsync(uploadUrl, filePath, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Content-Type': contentType },
    });
    lastStatus = res.status;
    lastBody = res.body ?? '';
    if (lastStatus >= 200 && lastStatus < 300) return publicUrl;
    if (isOverloadError(lastBody)) {
      throw new Error(friendlyR2Error(lastBody, lastStatus));
    }
    const retryable = lastStatus === 502 || lastStatus === 503 || lastStatus === 504;
    if (!retryable || attempt === R2_RETRIES) {
      throw new Error(friendlyR2Error(lastBody, lastStatus));
    }
    await new Promise((r) => setTimeout(r, R2_RETRY_DELAY_MS * attempt));
  }
  throw new Error(`Greška ${lastStatus}. Pokušaj ponovo.`);
}

async function callR2EdgeDelete(key: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token ?? '';
  const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-to-r2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      ...(token ? { 'X-User-JWT': token } : {}),
    },
    body: JSON.stringify({ action: 'delete', key }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(friendlyR2Error(raw, res.status));
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  await callR2EdgeDelete(key);
}
