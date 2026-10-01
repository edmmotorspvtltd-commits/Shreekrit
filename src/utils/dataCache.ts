// Bump this whenever the shape of Painting or Artist changes (a field added,
// renamed or removed). Every visitor's cached gallery data is then discarded
// on their next load and refetched, instead of being read with the old shape.
export const CACHE_SCHEMA_VERSION = 1;

interface CacheEnvelope<T> {
  version: number;
  data: T[];
}

export function readCache<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>> | null;
    // Old caches were a bare array with no version; treat them as stale too.
    if (!parsed || Array.isArray(parsed) || parsed.version !== CACHE_SCHEMA_VERSION) {
      localStorage.removeItem(key);
      return null;
    }
    return Array.isArray(parsed.data) && parsed.data.length > 0 ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T[]) {
  try {
    const envelope: CacheEnvelope<T> = { version: CACHE_SCHEMA_VERSION, data };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // ignore quota
  }
}
