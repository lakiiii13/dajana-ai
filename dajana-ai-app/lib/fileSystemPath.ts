/**
 * Normalize path/URI to string for FileSystem APIs.
 * Prevents ERR_INVALID_ARG_TYPE when picker/store passes an object.
 * Always returns a string (never object); recursively extracts .uri/.path.
 */
export function toPathString(pathOrUri: unknown): string {
  if (typeof pathOrUri === 'string') return pathOrUri;
  if (pathOrUri === null || pathOrUri === undefined) return '';
  if (typeof pathOrUri === 'object') {
    const o = pathOrUri as Record<string, unknown>;
    if (typeof o.uri === 'string') return o.uri;
    if (typeof o.path === 'string') return o.path;
    if (o.uri !== null && typeof o.uri === 'object') return toPathString(o.uri);
    if (o.path !== null && typeof o.path === 'object') return toPathString(o.path);
  }
  return '';
}

/** Guarantee string for native/Node APIs that throw on object. */
export function ensurePathString(p: unknown): string {
  const s = toPathString(p);
  return typeof s === 'string' ? s : '';
}
