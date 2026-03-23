/**
 * Safe wrapper around expo-file-system/legacy that always normalizes path arguments
 * to strings. Prevents ERR_INVALID_ARG_TYPE when an object is passed (e.g. from
 * image picker or persisted store). Never passes non-string to native.
 */
import * as FS from 'expo-file-system/legacy';
import { toPathString, ensurePathString } from './fileSystemPath';

function path(p: unknown, label = 'path'): string {
  const s = toPathString(p);
  if (typeof p === 'object' && p !== null && s === '') {
    throw new TypeError(`FileSystem ${label} must be a string, got object. Use .uri or .path.`);
  }
  return ensurePathString(s);
}

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  if (typeof v === 'object' && 'uri' in (v as object)) return toPathString((v as { uri: unknown }).uri);
  if (typeof v === 'object' && 'path' in (v as object)) return toPathString((v as { path: unknown }).path);
  return '';
}

export const documentDirectory: string | null = typeof FS.documentDirectory === 'string' ? FS.documentDirectory : (FS.documentDirectory != null && typeof FS.documentDirectory === 'object' ? (safeStr(FS.documentDirectory) || null) : FS.documentDirectory as string | null);
export const cacheDirectory: string | null = typeof FS.cacheDirectory === 'string' ? FS.cacheDirectory : (FS.cacheDirectory != null && typeof FS.cacheDirectory === 'object' ? (safeStr(FS.cacheDirectory) || null) : FS.cacheDirectory as string | null);
export const bundleDirectory: string | null = typeof FS.bundleDirectory === 'string' ? FS.bundleDirectory : (FS.bundleDirectory != null && typeof FS.bundleDirectory === 'object' ? (safeStr(FS.bundleDirectory) || null) : FS.bundleDirectory as string | null);
export const EncodingType = FS.EncodingType;

export async function getInfoAsync(fileUri: unknown, options?: Parameters<typeof FS.getInfoAsync>[1]) {
  return FS.getInfoAsync(path(fileUri, 'getInfoAsync'), options);
}

export async function readAsStringAsync(
  fileUri: unknown,
  options?: Parameters<typeof FS.readAsStringAsync>[1]
) {
  const p = path(fileUri, 'readAsStringAsync');
  try {
    return await FS.readAsStringAsync(p, options);
  } catch (e: unknown) {
    const err = e as Error;
    if (err?.message?.includes('path') && err?.message?.includes('Object')) {
      console.error('[safeFileSystem] readAsStringAsync received non-string path:', typeof fileUri, fileUri);
      throw new Error('Putanja do fajla mora biti string. Proverite da li je slika pravilno sačuvana.');
    }
    throw e;
  }
}

export async function writeAsStringAsync(
  fileUri: unknown,
  contents: string,
  options?: Parameters<typeof FS.writeAsStringAsync>[2]
) {
  return FS.writeAsStringAsync(path(fileUri, 'writeAsStringAsync'), contents, options);
}

export async function deleteAsync(fileUri: unknown, options?: Parameters<typeof FS.deleteAsync>[1]) {
  const p = toPathString(fileUri);
  if (!p) return;
  return FS.deleteAsync(p, options);
}

export async function makeDirectoryAsync(
  fileUri: unknown,
  options?: Parameters<typeof FS.makeDirectoryAsync>[1]
) {
  return FS.makeDirectoryAsync(path(fileUri, 'makeDirectoryAsync'), options);
}

export async function readDirectoryAsync(fileUri: unknown) {
  return FS.readDirectoryAsync(path(fileUri, 'readDirectoryAsync'));
}

export async function downloadAsync(
  uri: unknown,
  fileUri: unknown,
  options?: Parameters<typeof FS.downloadAsync>[2]
) {
  return FS.downloadAsync(path(uri, 'downloadAsync(uri)'), path(fileUri, 'downloadAsync(fileUri)'), options);
}

export async function getContentUriAsync(fileUri: unknown) {
  return FS.getContentUriAsync(path(fileUri, 'getContentUriAsync'));
}

export async function uploadAsync(
  url: string,
  fileUri: unknown,
  options?: Parameters<typeof FS.uploadAsync>[2]
) {
  return FS.uploadAsync(url, path(fileUri, 'uploadAsync(fileUri)'), options ?? {});
}

export const FileSystemUploadType = FS.FileSystemUploadType;

// Re-export the rest unchanged (no path args or optional)
export const getFreeDiskStorageAsync = FS.getFreeDiskStorageAsync;
export const getTotalDiskCapacityAsync = FS.getTotalDiskCapacityAsync;
