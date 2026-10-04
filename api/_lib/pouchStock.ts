import type { NeonQueryFunction } from '@neondatabase/serverless';
import { MAX_PIECES_PER_PRODUCT } from './validate';

type Db = NeonQueryFunction<false, false>;

export interface PouchLine {
  pouchId: string;
  quantity: number;
}

// Sums duplicate lines for the same pouch, so two cart lines can't each
// pass a stock check against the same last piece.
export function totalsByPouch(lines: PouchLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) totals.set(line.pouchId, (totals.get(line.pouchId) ?? 0) + line.quantity);
  return totals;
}

// True when one pouch design exceeds the per-order limit across all lines.
export function exceedsPerOrderLimit(lines: PouchLine[]): boolean {
  for (const total of totalsByPouch(lines).values()) if (total > MAX_PIECES_PER_PRODUCT) return true;
  return false;
}

// Atomically takes stock. Each UPDATE only succeeds while enough pieces are
// left (quantity >= n), and Postgres row-locks the pouch for the statement,
// so two buyers racing for the last piece cannot both succeed: exactly one
// UPDATE returns a row. If any pouch is short, everything taken so far is
// put back and the failing pouch id is returned. Placeholder pouches are only
// sellable when allowPlaceholders is true (i.e. not in production).
export async function reservePouchStock(
  db: Db,
  lines: PouchLine[],
  allowPlaceholders: boolean
): Promise<{ ok: true; reserved: PouchLine[] } | { ok: false; pouchId: string }> {
  const reserved: PouchLine[] = [];
  for (const [pouchId, quantity] of totalsByPouch(lines)) {
    const rows = await db`
      UPDATE pouches SET quantity = quantity - ${quantity}
      WHERE id = ${pouchId} AND quantity >= ${quantity} AND (is_placeholder = false OR ${allowPlaceholders})
      RETURNING id
    `;
    if (rows.length === 0) {
      await restorePouchStock(db, reserved);
      return { ok: false, pouchId };
    }
    reserved.push({ pouchId, quantity });
  }
  return { ok: true, reserved };
}

// Puts previously reserved stock back (failed checkout). Failures are logged
// and swallowed per pouch so one bad restore can't skip the rest.
export async function restorePouchStock(db: Db, reserved: PouchLine[]): Promise<void> {
  for (const { pouchId, quantity } of reserved) {
    try {
      await db`UPDATE pouches SET quantity = quantity + ${quantity} WHERE id = ${pouchId}`;
    } catch (err) {
      console.error(`Failed to restore stock for pouch ${pouchId}:`, err);
    }
  }
}
