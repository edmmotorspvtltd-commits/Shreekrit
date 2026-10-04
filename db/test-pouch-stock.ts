// Stock-safety tests for pouches, run against a real Neon database.
//
//   NEON_BRANCH_CONFIRMED=yes DATABASE_URL=<NEON BRANCH url> npm run test:stock
//
// These WRITE to the database (they create and delete rows whose ids start
// with "test-stock-"), so they refuse to run unless NEON_BRANCH_CONFIRMED=yes.
// Never point DATABASE_URL at production. Requires db/migrations/002_pouches.sql
// to be applied and at least one row in `artists`.
//
// They exercise the same functions api/orders/create.ts uses
// (api/_lib/pouchStock.ts and the validators), so a pass here covers the
// order path's stock handling.
import { neon } from '@neondatabase/serverless';
import { reservePouchStock, restorePouchStock, exceedsPerOrderLimit } from '../api/_lib/pouchStock';
import { quantity as validQuantity } from '../api/_lib/validate';

const url = process.env.DATABASE_URL;
if (!url || process.env.NEON_BRANCH_CONFIRMED !== 'yes') {
  console.error('Set DATABASE_URL to a Neon BRANCH (not production) and NEON_BRANCH_CONFIRMED=yes. See the header of this file.');
  process.exit(1);
}
const db = neon(url);

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};

const stock = async (id: string) => Number((await db`SELECT quantity FROM pouches WHERE id = ${id}`)[0].quantity);

const artist = (await db`SELECT id, name FROM artists LIMIT 1`)[0];
if (!artist) throw new Error('No artists in the database; seed artists first.');

const created: string[] = [];
async function makePouch(id: string, quantity: number, placeholder = true) {
  created.push(id);
  await db`
    INSERT INTO pouches (id, name, artist_id, artist_name, price_inr, size_cm, material, paint_type, care_instructions, quantity, description, images, is_placeholder)
    VALUES (${id}, ${'Test ' + id}, ${artist.id}, ${artist.name}, 100, '10 x 10', 'test', 'test', 'test', ${quantity}, 'test', '[]', ${placeholder})
  `;
}

try {
  // 1. Two (or more) buyers racing for the last piece: exactly one wins.
  await makePouch('test-stock-last', 1);
  const race = await Promise.all(
    Array.from({ length: 12 }, () => reservePouchStock(db, [{ pouchId: 'test-stock-last', quantity: 1 }], true))
  );
  check('last piece: exactly one of 12 concurrent buyers succeeds', race.filter((r) => r.ok).length === 1, `got ${race.filter((r) => r.ok).length}`);
  check('last piece: stock ends at 0, never negative', (await stock('test-stock-last')) === 0);

  // 2. Concurrent multi-piece orders never oversell.
  await makePouch('test-stock-multi', 5);
  const multi = await Promise.all(
    Array.from({ length: 8 }, () => reservePouchStock(db, [{ pouchId: 'test-stock-multi', quantity: 2 }], true))
  );
  check('5 pieces, 8 buyers x2: exactly 2 succeed', multi.filter((r) => r.ok).length === 2, `got ${multi.filter((r) => r.ok).length}`);
  check('5 pieces, 8 buyers x2: 1 piece left', (await stock('test-stock-multi')) === 1);

  // 3. Failed checkout restores stock.
  await makePouch('test-stock-restore', 3);
  const taken = await reservePouchStock(db, [{ pouchId: 'test-stock-restore', quantity: 2 }], true);
  check('restore: reserving 2 of 3 leaves 1', taken.ok && (await stock('test-stock-restore')) === 1);
  if (taken.ok) await restorePouchStock(db, taken.reserved);
  check('restore: stock is back to 3 after restore', (await stock('test-stock-restore')) === 3);

  // 3b. A multi-pouch order where one pouch is short rolls back the others.
  await makePouch('test-stock-a', 2);
  await makePouch('test-stock-b', 0);
  const partial = await reservePouchStock(db, [{ pouchId: 'test-stock-a', quantity: 1 }, { pouchId: 'test-stock-b', quantity: 1 }], true);
  check('rollback: order fails when one pouch is sold out', partial.ok === false && partial.pouchId === 'test-stock-b');
  check('rollback: the other pouch is untouched (2)', (await stock('test-stock-a')) === 2);

  // 4. Duplicate cart lines for one pouch are summed, not checked one by one.
  await makePouch('test-stock-dup', 2);
  const dupOver = await reservePouchStock(db, [1, 2, 3].map(() => ({ pouchId: 'test-stock-dup', quantity: 1 })), true);
  check('duplicate lines: 3 lines x1 against stock 2 is rejected', !dupOver.ok);
  check('duplicate lines: rejected order leaves stock at 2', (await stock('test-stock-dup')) === 2);
  const dupOk = await reservePouchStock(db, [1, 2].map(() => ({ pouchId: 'test-stock-dup', quantity: 1 })), true);
  check('duplicate lines: 2 lines x1 against stock 2 succeeds', dupOk.ok && (await stock('test-stock-dup')) === 0);

  // 5. Demo pouches cannot be bought when placeholders are not allowed (production).
  await makePouch('test-stock-demo', 5, true);
  const demo = await reservePouchStock(db, [{ pouchId: 'test-stock-demo', quantity: 1 }], false);
  check('placeholder pouch is not purchasable in production mode', demo.ok === false && (await stock('test-stock-demo')) === 5);
  await makePouch('test-stock-real', 5, false);
  const real = await reservePouchStock(db, [{ pouchId: 'test-stock-real', quantity: 1 }], false);
  check('real pouch is purchasable in production mode', real.ok && (await stock('test-stock-real')) === 4);

  // 6. The database itself refuses negative stock.
  let dbRefused = false;
  try { await db`UPDATE pouches SET quantity = -1 WHERE id = 'test-stock-real'`; } catch { dbRefused = true; }
  check('DB CHECK rejects negative quantity', dbRefused);

  // 7. Server-side quantity limits (pure checks used by api/orders/create.ts).
  check('quantity: 0, 11, 1.5, "2", null, NaN are rejected',
    [0, 11, 1.5, '2', null, NaN, -1].every((v) => validQuantity(v) === null));
  check('quantity: 1 and 10 are accepted', validQuantity(1) === 1 && validQuantity(10) === 10);
  check('per-order limit counts split lines (6 + 5 of one pouch > 10)',
    exceedsPerOrderLimit([{ pouchId: 'x', quantity: 6 }, { pouchId: 'x', quantity: 5 }]) &&
    !exceedsPerOrderLimit([{ pouchId: 'x', quantity: 6 }, { pouchId: 'y', quantity: 5 }]));
} finally {
  for (const id of created) await db`DELETE FROM pouches WHERE id = ${id}`;
}

console.log(failures === 0 ? '\nAll stock tests passed.' : `\n${failures} stock test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
