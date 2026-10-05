// Parity + rollback test for the local pg shim (dev/localSql.ts), against the
// LOCAL test database.
//
//   DATABASE_URL=postgres://...@localhost:5433/shreekrit_test npm run test:local-driver
//
// Refuses to run unless DATABASE_URL is localhost AND the database is named
// shreekrit_test (see dev/localGuard.ts). It creates and drops one table,
// local_driver_probe. There is no override.
//
// Row-shape expectations below are what neon()'s HTTP driver returns (it uses
// the same type parsers, which the shim borrows). That match is by construction,
// not verified against Neon here.
import { assertLocalDb, TEST_DB } from '../dev/localGuard';
import { createLocalSql } from '../dev/localSql';

try {
  assertLocalDb(process.env.DATABASE_URL, { database: TEST_DB, purpose: 'run the local-driver test' });
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

const { sql, end } = createLocalSql(process.env.DATABASE_URL!);

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};
const rejects = async (p: PromiseLike<unknown>): Promise<any> => { try { await p; return null; } catch (e) { return e; } };
const count = async (ids: string[]) => Number((await sql`SELECT count(*) AS n FROM local_driver_probe WHERE id = ANY(${ids})`)[0].n);

try {
  await sql`DROP TABLE IF EXISTS local_driver_probe`;
  await sql`CREATE TABLE local_driver_probe (id TEXT PRIMARY KEY, n INT, note TEXT, doc JSONB, available BOOLEAN NOT NULL DEFAULT TRUE)`;

  // ── call styles and row shapes ──
  const t1 = await sql`SELECT ${5}::int AS n, ${'x'}::text AS s`;
  check('tagged template returns an array of row objects', Array.isArray(t1) && t1[0].n === 5 && t1[0].s === 'x', JSON.stringify(t1));
  const t2 = await sql('SELECT $1::int + $2::int AS total', [2, 3]);
  check('call style sql(text, params) works', t2[0].total === 5);
  const t3 = await sql('SELECT 1 AS one');
  check('call style without params works', t3[0].one === 1);

  const shapes = (await sql`
    SELECT 7::int AS i, 1.50::numeric AS num, 9007199254740993::bigint AS big, true AS b, NULL::text AS nul,
           '{"a":[1,2]}'::jsonb AS doc, TIMESTAMPTZ '2026-10-05 10:57:40+00' AS ts, ARRAY['a','b']::text[] AS arr`)[0];
  check('int4 -> number', shapes.i === 7 && typeof shapes.i === 'number');
  check('numeric -> string (so Number(row.price_inr) in the API still applies)', shapes.num === '1.50', String(shapes.num));
  check('bigint -> string, no precision loss', shapes.big === '9007199254740993', String(shapes.big));
  check('boolean and null', shapes.b === true && shapes.nul === null);
  check('jsonb -> parsed object', JSON.stringify(shapes.doc) === '{"a":[1,2]}');
  check('timestamptz -> Date', shapes.ts instanceof Date && (shapes.ts as Date).toISOString() === '2026-10-05T10:57:40.000Z');
  check('text[] -> array', JSON.stringify(shapes.arr) === '["a","b"]');

  // JSON.stringify'd values into a jsonb column, as db/seed.ts does.
  await sql`INSERT INTO local_driver_probe (id, n, doc) VALUES (${'row-json'}, ${1}, ${JSON.stringify({ motifs: [{ name: 'Lotus' }] })})`;
  const back = (await sql`SELECT doc FROM local_driver_probe WHERE id = 'row-json'`)[0].doc as any;
  check('JSON.stringify value stored in jsonb comes back as an object', back.motifs[0].name === 'Lotus');
  check('array parameter with ANY()', (await count(['row-json', 'nope'])) === 1);
  check('INSERT without RETURNING gives []', (await sql`INSERT INTO local_driver_probe (id) VALUES ('row-empty')`).length === 0);

  // ── errors ──
  const dup = await rejects(sql`INSERT INTO local_driver_probe (id) VALUES ('row-empty')`);
  check('unique violation rejects with SQLSTATE 23505', dup?.code === '23505', String(dup?.code));
  check('.catch() works on a query (api/sitemap.ts relies on it)', (await sql`SELECT 1/0`.catch(() => 'caught')) === 'caught');

  // ── lazy queries, like Neon's ──
  const lazy = sql`INSERT INTO local_driver_probe (id) VALUES ('row-lazy')`;
  await new Promise((r) => setTimeout(r, 50));
  check('a query does not run until awaited', (await count(['row-lazy'])) === 0);
  await lazy;
  check('...and runs when awaited', (await count(['row-lazy'])) === 1);
  await lazy;
  check('awaiting the same query twice does not run it twice', (await count(['row-lazy'])) === 1);

  // ── transactions ──
  const ok = await sql.transaction([
    sql`INSERT INTO local_driver_probe (id, n) VALUES ('tx-ok-1', 1)`,
    sql`INSERT INTO local_driver_probe (id, n) VALUES ('tx-ok-2', 2) RETURNING id`,
    sql`SELECT count(*) AS n FROM local_driver_probe WHERE id LIKE 'tx-ok-%'`
  ]);
  check('transaction batch commits all statements', (await count(['tx-ok-1', 'tx-ok-2'])) === 2);
  check('transaction returns one result array per statement; later statements see earlier ones',
    Array.isArray(ok) && ok.length === 3 && ok[1][0].id === 'tx-ok-2' && Number(ok[2][0].n) === 2, JSON.stringify(ok));

  const viaFn = await sql.transaction((txn) => [
    txn`INSERT INTO local_driver_probe (id) VALUES ('tx-fn-1')`,
    txn`INSERT INTO local_driver_probe (id) VALUES ('tx-fn-2')`
  ]);
  check('callback form commits', viaFn.length === 2 && (await count(['tx-fn-1', 'tx-fn-2'])) === 2);

  // The deliberately failing batches: nothing from them may survive.
  const divZero = await rejects(sql.transaction([
    sql`INSERT INTO local_driver_probe (id) VALUES ('tx-bad-a')`,
    sql`INSERT INTO local_driver_probe (id) VALUES ('tx-bad-b')`,
    sql`SELECT 1/0`
  ]));
  check('FAILING BATCH (division by zero) rejects with 22012', divZero?.code === '22012', String(divZero?.code));
  check('FAILING BATCH rolled back: neither earlier insert survived', (await count(['tx-bad-a', 'tx-bad-b'])) === 0);

  const dupInBatch = await rejects(sql.transaction([
    sql`INSERT INTO local_driver_probe (id) VALUES ('tx-bad-c')`,
    sql`UPDATE local_driver_probe SET n = 99 WHERE id = 'tx-ok-1'`,
    sql`INSERT INTO local_driver_probe (id) VALUES ('tx-ok-2')`
  ]));
  check('FAILING BATCH (unique violation last) rejects with 23505', dupInBatch?.code === '23505', String(dupInBatch?.code));
  check('FAILING BATCH rolled back: insert and update both undone',
    (await count(['tx-bad-c'])) === 0 && Number((await sql`SELECT n FROM local_driver_probe WHERE id = 'tx-ok-1'`)[0].n) === 1);

  const firstFails = await rejects(sql.transaction([sql`SELECT 1/0`, sql`INSERT INTO local_driver_probe (id) VALUES ('tx-bad-d')`]));
  check('FAILING BATCH (first statement fails): later statements never run', firstFails?.code === '22012' && (await count(['tx-bad-d'])) === 0);

  check('transaction() rejects a non-query argument', (await rejects(sql.transaction([{} as any]))) instanceof TypeError);

  // The pool must still be healthy after failed transactions (client released, not stuck in a transaction).
  const after = await Promise.all(Array.from({ length: 25 }, (_, i) => sql`SELECT ${i}::int AS i`));
  check('pool healthy after failed batches: 25 concurrent queries succeed', after.every((r, i) => r[0].i === i));
  check('no connection left inside an open transaction',
    Number((await sql`SELECT count(*) AS n FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction'`)[0].n) === 0);

  // ── the stock pattern: one conditional UPDATE, 12 racers, exactly one winner ──
  await sql`INSERT INTO local_driver_probe (id, available) VALUES ('race', true)`;
  const race = await Promise.all(Array.from({ length: 12 }, () =>
    sql`UPDATE local_driver_probe SET available = false WHERE id = 'race' AND available = true RETURNING id`));
  check('12 concurrent conditional UPDATEs: exactly one wins', race.filter((r) => r.length === 1).length === 1);
} finally {
  await sql`DROP TABLE IF EXISTS local_driver_probe`;
  await end();
}

console.log(failures === 0 ? '\nAll local-driver tests passed.' : `\n${failures} local-driver test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
