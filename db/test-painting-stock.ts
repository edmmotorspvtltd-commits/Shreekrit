// Before/after check for the paintingStock.ts refactor, run against a real Neon BRANCH.
//
//   NEON_BRANCH_CONFIRMED=yes DATABASE_URL=<NEON BRANCH url> npm run test:painting-stock
//
// WRITES to the database (creates and deletes paintings whose ids start with
// "test-pstock-"), so it refuses to run unless NEON_BRANCH_CONFIRMED=yes.
// Never point DATABASE_URL at production.
//
// It runs the same scenarios against LEGACY (the inline SQL exactly as it was
// in api/orders/create.ts before the refactor, commit fd42969~1) and CURRENT
// (api/_lib/paintingStock.ts), then requires identical observable results.
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { reservePainting, releasePaintings } from '../api/_lib/paintingStock';

type Db = NeonQueryFunction<false, false>;

const url = process.env.DATABASE_URL;
if (!url || process.env.NEON_BRANCH_CONFIRMED !== 'yes') {
  console.error('Set DATABASE_URL to a Neon BRANCH (not production) and NEON_BRANCH_CONFIRMED=yes. See the header of this file.');
  process.exit(1);
}
const db: Db = neon(url);

interface Impl {
  reserve: (db: Db, id: string) => Promise<boolean>;
  release: (db: Db, ids: string[]) => Promise<void>;
}

// Verbatim copy of the pre-refactor code in api/orders/create.ts.
const legacy: Impl = {
  reserve: async (db, id) => {
    const reserved = await db`
        UPDATE paintings SET is_available = false
        WHERE id = ${id} AND is_available = true
        RETURNING id
      `;
    return !(reserved.length === 0);
  },
  release: async (db, ids) => {
    for (const id of ids) {
      try {
        await db`UPDATE paintings SET is_available = true WHERE id = ${id}`;
      } catch (releaseErr) {
        console.error(`Failed to release reserved painting ${id}:`, releaseErr);
      }
    }
  }
};
const current: Impl = { reserve: reservePainting, release: releasePaintings };

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};

const artist = (await db`SELECT id, name FROM artists LIMIT 1`)[0];
if (!artist) throw new Error('No artists in the database; seed artists first.');

const created: string[] = [];
async function makePainting(id: string) {
  created.push(id);
  await db`
    INSERT INTO paintings (id, title, artist_id, artist_name, price_inr, is_placeholder)
    VALUES (${id}, ${'Test ' + id}, ${artist.id}, ${artist.name}, 100, true)
  `;
}
const available = async (id: string) => (await db`SELECT is_available FROM paintings WHERE id = ${id}`)[0].is_available as boolean;

// One scenario, returning a transcript of everything observable.
async function scenario(label: string, impl: Impl): Promise<unknown[]> {
  const id = `test-pstock-${label}`;
  const out: unknown[] = [];
  await makePainting(id);
  out.push(['start available', await available(id)]);
  out.push(['reserve', await impl.reserve(db, id), await available(id)]);
  out.push(['double reserve', await impl.reserve(db, id), await available(id)]);
  await impl.release(db, [id]);
  out.push(['release', await available(id)]);
  out.push(['reserve again', await impl.reserve(db, id), await available(id)]);
  await impl.release(db, [id, id]);
  out.push(['release twice in one call', await available(id)]);
  out.push(['release unknown id does not throw', await impl.release(db, ['test-pstock-nope']).then(() => true)]);
  await impl.release(db, []);
  out.push(['release empty list', await available(id)]);

  const raceId = `test-pstock-${label}-race`;
  await makePainting(raceId);
  const race = await Promise.all(Array.from({ length: 12 }, () => impl.reserve(db, raceId)));
  out.push(['12 concurrent reserves: winners', race.filter(Boolean).length, await available(raceId)]);
  return out;
}

try {
  const before = await scenario('legacy', legacy);
  const after = await scenario('current', current);
  check('before/after transcripts are identical', JSON.stringify(before) === JSON.stringify(after),
    `\n  legacy:  ${JSON.stringify(before)}\n  current: ${JSON.stringify(after)}`);
  check('reserve: first wins, second loses', JSON.stringify(after[1]) === '["reserve",true,false]' && JSON.stringify(after[2]) === '["double reserve",false,false]');
  check('release: painting is available again', JSON.stringify(after[3]) === '["release",true]');
  check('12 concurrent reserves: exactly one winner', JSON.stringify(after[after.length - 1]) === '["12 concurrent reserves: winners",1,false]');
  console.log('\ntranscript:', JSON.stringify(after));
} finally {
  for (const id of created) await db`DELETE FROM paintings WHERE id = ${id}`;
}

console.log(failures === 0 ? '\nAll painting-stock tests passed.' : `\n${failures} painting-stock test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
