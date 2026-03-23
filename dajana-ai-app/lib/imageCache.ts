/**
 * Download remote image to local cache and return file URI.
 * Uses URL-based cache key so same image is not re-downloaded on next visit.
 */
import * as FileSystem from './safeFileSystem';

const CACHE_PREFIX = 'img_';

function hashUrl(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = (h * 33) ^ url.charCodeAt(i);
  }
  return Math.abs(h >>> 0).toString(36);
}

export function isRemoteUri(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

/**
 * If uri is remote (http/https), returns cached local file if exists, else downloads and caches.
 * Otherwise returns uri unchanged (e.g. file:// or content URI).
 */
export async function ensureLocalImageUri(uri: string): Promise<string> {
  if (!isRemoteUri(uri)) return uri;
  const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext : 'jpg';
  const dir = FileSystem.cacheDirectory;
  if (!dir) return uri;
  const key = hashUrl(uri);
  const localPath = `${dir}${CACHE_PREFIX}${key}.${safeExt}`;
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;
  } catch {
    /* proceed to download */
  }
  try {
    const res = await FileSystem.downloadAsync(uri, localPath);
    if (res.status === 200 && res.uri) return res.uri;
    return uri;
  } catch {
    return uri;
  }
}
