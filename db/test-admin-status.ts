// Status-aware stock and republish tests, run against a real Neon BRANCH.
//
//   NEON_BRANCH_CONFIRMED=yes DATABASE_URL=<NEON BRANCH url> npm run test:status
//
// WRITES to the database (creates and deletes rows whose ids start with
// "test-status-", plus their orders), so it refuses to run unless
// NEON_BRANCH_CONFIRMED=yes. Never point DATABASE_URL at production.
// Requires db/migrations/004_product_status.sql, and for section B also
// 004c_republish_allowlist.sql, applied to that branch.
//
// Section A: checkout stock functions must respect status (draft, archived and
// manually-Sold items cannot be reserved; restore puts status back).
// Section B: the database triggers (republish allowlist, is_available on
// archived -> published, pouch publish needs stock).
import { neon } from '@neondatabase/serverless';
import { reservePainting, releasePaintings } from '../api/_lib/paintingStock';
import { reservePouchStock, restorePouchStock } from '../api/_lib/pouchStock';

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
const raises = async (fn: () => Promise<unknown>) => { try { await fn(); return false; } catch { return true; } };

const artist = (await db`SELECT id, name FROM artists LIMIT 1`)[0];
if (!artist) throw new Error('No artists in the database; seed artists first.');
const hasStatus = (await db`SELECT 1 FROM information_schema.columns WHERE table_name = 'paintings' AND column_name = 'status'`).length > 0;
if (!hasStatus) throw new Error('paintings.status does not exist: apply 004_product_status.sql to this branch first.');

const paintingIds: string[] = [];
const pouchIds: string[] = [];
async function makePainting(id: string) {
  paintingIds.push(id);
  await db`INSERT INTO paintings (id, title, artist_id, artist_name, price_inr, is_placeholder) VALUES (${id}, ${'Test ' + id}, ${artist.id}, ${artist.name}, 100, true)`;
}
async function makePouch(id: string, quantity: number) {
  pouchIds.push(id);
  await db`
    INSERT INTO pouches (id, name, artist_id, artist_name, price_inr, size_cm, material, paint_type, care_instructions, quantity, description, images, is_placeholder)
    VALUES (${id}, ${'Test ' + id}, ${artist.id}, ${artist.name}, 100, '10 x 10', 'test', 'test', 'test', ${quantity}, 'test', '[]', true)`;
}
const painting = async (id: string) => (await db`SELECT status, sold_via, is_available FROM paintings WHERE id = ${id}`)[0];
const pouch = async (id: string) => (await db`SELECT status, sold_via, quantity FROM pouches WHERE id = ${id}`)[0];

let orderSeq = 0;
async function makeOrder(paintingId: string, status: string, editionType = 'original') {
  const o = (await db`
    INSERT INTO orders (full_name, email, phone, address_line1, city, state, postal_code, country, currency, subtotal_inr, shipping_inr, total_inr, razorpay_order_id, status)
    VALUES ('Test', 'test@example.com', '0000000000', 'x', 'x', 'x', '000000', 'IN', 'INR', 100, 0, 100, ${`test-status-${Date.now()}-${orderSeq++}`}, ${status})
    RETURNING id`)[0];
  await db`
    INSERT INTO order_items (order_id, painting_id, painting_title, edition_type, frame, frame_price_inr, unit_price_inr)
    VALUES (${o.id}, ${paintingId}, 'Test', ${editionType}, 'None', 0, 100)`;
}

try {
  // ───────── Section A: checkout stock functions respect status ─────────
  console.log('— A. checkout respects status');

  await makePainting('test-status-p-published');
  check('painting: published can be reserved', (await reservePainting(db, 'test-status-p-published')) === true);
  let row = await painting('test-status-p-published');
  check('painting: reserve flips status to sold (checkout)', row.status === 'sold' && row.sold_via === 'checkout' && row.is_available === false, JSON.stringify(row));
  await releasePaintings(db, ['test-status-p-published']);
  row = await painting('test-status-p-published');
  check('painting: failed checkout + restore => status back to published', row.status === 'published' && row.sold_via === null && row.is_available === true, JSON.stringify(row));

  await makePainting('test-status-p-double');
  await reservePainting(db, 'test-status-p-double');
  check('painting: second reserve of the same original loses', (await reservePainting(db, 'test-status-p-double')) === false);

  await makePainting('test-status-p-draft');
  await db`UPDATE paintings SET status = 'draft' WHERE id = 'test-status-p-draft'`;
  check('painting: draft cannot be reserved', (await reservePainting(db, 'test-status-p-draft')) === false);
  check('painting: draft stays available=true, status draft after failed reserve', JSON.stringify(await painting('test-status-p-draft')) === JSON.stringify({ status: 'draft', sold_via: null, is_available: true }));

  await makePainting('test-status-p-archived');
  await db`UPDATE paintings SET status = 'archived' WHERE id = 'test-status-p-archived'`;
  check('painting: archived cannot be reserved', (await reservePainting(db, 'test-status-p-archived')) === false);

  await makePainting('test-status-p-manual');
  await db`UPDATE paintings SET status = 'sold' WHERE id = 'test-status-p-manual'`;
  row = await painting('test-status-p-manual');
  check('painting: manual Sold sets is_available=false, sold_via=manual', row.is_available === false && row.sold_via === 'manual', JSON.stringify(row));
  check('painting: manually Sold cannot be reserved', (await reservePainting(db, 'test-status-p-manual')) === false);
  await releasePaintings(db, ['test-status-p-manual']);
  row = await painting('test-status-p-manual');
  check('painting: a restore does not un-sell a manual Sold', row.status === 'sold' && row.is_available === false, JSON.stringify(row));

  await makePouch('test-status-q-published', 1);
  const took = await reservePouchStock(db, [{ pouchId: 'test-status-q-published', quantity: 1 }], true);
  let prow = await pouch('test-status-q-published');
  check('pouch: last piece reserved => quantity 0, status sold (checkout)', took.ok && prow.quantity === 0 && prow.status === 'sold' && prow.sold_via === 'checkout', JSON.stringify(prow));
  if (took.ok) await restorePouchStock(db, took.reserved);
  prow = await pouch('test-status-q-published');
  check('pouch: failed checkout + restore => quantity 1, status back to published', prow.quantity === 1 && prow.status === 'published' && prow.sold_via === null, JSON.stringify(prow));

  for (const state of ['draft', 'archived', 'sold'] as const) {
    const id = `test-status-q-${state}`;
    await makePouch(id, 2);
    await db`UPDATE pouches SET status = ${state} WHERE id = ${id}`;
    const r = await reservePouchStock(db, [{ pouchId: id, quantity: 1 }], true);
    check(`pouch: ${state === 'sold' ? 'manually Sold (stock left)' : state} cannot be reserved`, r.ok === false);
    check(`pouch: ${state} stock untouched after refused reserve`, (await pouch(id)).quantity === 2);
  }
  await db`UPDATE pouches SET quantity = quantity + 1 WHERE id = 'test-status-q-sold'`;
  check('pouch: restocking a manual Sold does not re-publish it', (await pouch('test-status-q-sold')).status === 'sold');

  // ───────── Section B: database republish rules (needs 004c) ─────────
  console.log('— B. republish rules in the database (004c)');
  const src = (await db`SELECT prosrc FROM pg_proc WHERE proname = 'paintings_sync_status'`)[0]?.prosrc as string | undefined;
  check('004c applied: republish rule is an allowlist', !!src && src.includes("NOT IN ('failed', 'cancelled', 'test_paid')"), 'apply db/migrations/004c_republish_allowlist.sql to this branch');

  const blocked = async (label: string, orderStatus: string, editionType = 'original') => {
    const id = `test-status-b-${label}`;
    await makePainting(id);
    await db`UPDATE paintings SET status = 'sold' WHERE id = ${id}`;
    await makeOrder(id, orderStatus, editionType);
    return { id, refused: await raises(() => db`UPDATE paintings SET status = 'published' WHERE id = ${id}`) };
  };
  for (const s of ['pending', 'paid', 'pending_payment', 'processing', 'shipped', 'delivered', 'some_future_status']) {
    const r = await blocked(s, s);
    check(`sold -> published is blocked by a '${s}' order`, r.refused && (await painting(r.id)).status === 'sold');
  }
  for (const s of ['failed', 'cancelled', 'test_paid']) {
    const r = await blocked(s, s);
    const row = await painting(r.id);
    check(`sold -> published is allowed with only a '${s}' order (is_available true)`, !r.refused && row.status === 'published' && row.is_available === true, JSON.stringify(row));
  }
  const printOnly = await blocked('print', 'paid', 'print');
  check('a paid PRINT order does not block republishing the original', !printOnly.refused);

  await makePainting('test-status-b-arch');
  await reservePainting(db, 'test-status-b-arch');
  await db`UPDATE paintings SET status = 'archived' WHERE id = 'test-status-b-arch'`;
  check('setup: sold then archived keeps is_available=false', (await painting('test-status-b-arch')).is_available === false);
  await db`UPDATE paintings SET status = 'published' WHERE id = 'test-status-b-arch'`;
  row = await painting('test-status-b-arch');
  check('archived -> published sets is_available=true', row.status === 'published' && row.is_available === true, JSON.stringify(row));
  check('and it can then be reserved by checkout', (await reservePainting(db, 'test-status-b-arch')) === true);

  await makePainting('test-status-b-arch-paid');
  await db`UPDATE paintings SET status = 'sold' WHERE id = 'test-status-b-arch-paid'`;
  await makeOrder('test-status-b-arch-paid', 'paid');
  await db`UPDATE paintings SET status = 'archived' WHERE id = 'test-status-b-arch-paid'`;
  check('sold -> archived -> published with a paid order is still blocked', await raises(() => db`UPDATE paintings SET status = 'published' WHERE id = 'test-status-b-arch-paid'`));

  await makePouch('test-status-b-pouch', 1);
  await db`UPDATE pouches SET quantity = 0 WHERE id = 'test-status-b-pouch'`;
  check('pouch: quantity 0 flips published -> sold (checkout)', (await pouch('test-status-b-pouch')).status === 'sold');
  check('pouch: publishing with quantity 0 is refused', await raises(() => db`UPDATE pouches SET status = 'published' WHERE id = 'test-status-b-pouch'`));
  await db`UPDATE pouches SET quantity = 2 WHERE id = 'test-status-b-pouch'`;
  check('pouch: restock after a checkout sell-out republishes it', (await pouch('test-status-b-pouch')).status === 'published');
} finally {
  await db`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE razorpay_order_id LIKE 'test-status-%')`;
  await db`DELETE FROM orders WHERE razorpay_order_id LIKE 'test-status-%'`;
  for (const id of paintingIds) await db`DELETE FROM paintings WHERE id = ${id}`;
  for (const id of pouchIds) await db`DELETE FROM pouches WHERE id = ${id}`;
}

console.log(failures === 0 ? '\nAll status tests passed.' : `\n${failures} status test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
