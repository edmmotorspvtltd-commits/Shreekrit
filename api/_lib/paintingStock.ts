import type { NeonQueryFunction } from '@neondatabase/serverless';

type Db = NeonQueryFunction<false, false>;

// Atomically reserves one original: the UPDATE only succeeds while the
// painting is still available, so two buyers racing for the same one
// cannot both get it: exactly one UPDATE returns a row.
export async function reservePainting(db: Db, paintingId: string): Promise<boolean> {
  const rows = await db`
    UPDATE paintings SET is_available = false
    WHERE id = ${paintingId} AND is_available = true
    RETURNING id
  `;
  return rows.length > 0;
}

// Puts reserved originals back (failed checkout). Failures are logged and
// swallowed per painting so one bad release can't skip the rest.
export async function releasePaintings(db: Db, ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      await db`UPDATE paintings SET is_available = true WHERE id = ${id}`;
    } catch (releaseErr) {
      console.error(`Failed to release reserved painting ${id}:`, releaseErr);
    }
  }
}
