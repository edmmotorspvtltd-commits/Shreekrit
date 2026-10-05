// No database needed. Proves two things:
//   1. dev/localGuard.ts refuses everything that is not a local test/dev database
//      and never echoes the connection string.
//   2. api/_lib/db.ts only switches to the local client when the dev server has
//      armed it, so it cannot change behaviour on Vercel. Each case runs in a
//      fresh child process with an explicit, minimal environment.
//
//   npm run test:db-selection
import { spawnSync } from 'node:child_process';
import { assertLocalDb, NotLocalDatabaseError, TEST_DB, DEV_OR_TEST_DB } from '../dev/localGuard';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};

// ── 1. guard ──
const accepts = (url: string, db = TEST_DB) => { try { assertLocalDb(url, { database: db, purpose: 'test' }); return true; } catch { return false; } };
check('guard: localhost test db accepted', accepts('postgres://u:p@localhost:5433/shreekrit_test'));
check('guard: 127.0.0.1 and [::1] accepted', accepts('postgres://u:p@127.0.0.1/shreekrit_test') && accepts('postgres://u:p@[::1]:5433/shreekrit_test'));
check('guard: dev db accepted only by the dev/test rule', accepts('postgres://u:p@localhost/shreekrit_dev', DEV_OR_TEST_DB) && !accepts('postgres://u:p@localhost/shreekrit_dev', TEST_DB));
const rejected: [string, string][] = [
  ['neon host', 'postgres://u:secretpw@ep-fake-pooler.us-east-2.aws.neon.tech/shreekrit_test'],
  ['look-alike host', 'postgres://u:p@localhost.evil.example/shreekrit_test'],
  ['ip look-alike', 'postgres://u:p@127.0.0.1.nip.io/shreekrit_test'],
  ['wrong database name', 'postgres://u:p@localhost/neondb'],
  ['host= override in query', 'postgres://u:p@localhost/shreekrit_test?host=ep-fake.neon.tech'],
  ['unix socket form', 'postgres:///shreekrit_test?host=/tmp'],
  ['two hosts', 'postgres://u:p@localhost,ep-fake.neon.tech/shreekrit_test'],
  ['not postgres', 'https://localhost/shreekrit_test'],
  ['empty', ''],
  ['garbage', 'not a url']
];
for (const [label, url] of rejected) {
  let message = '';
  try { assertLocalDb(url, { database: TEST_DB, purpose: 'test' }); } catch (e) { message = e instanceof NotLocalDatabaseError ? e.message : `WRONG ERROR ${e}`; }
  const leaks = ['secretpw', 'neon.tech', 'evil.example', 'nip.io', 'ep-fake'].some((s) => message.includes(s));
  check(`guard: refuses ${label} and leaks nothing`, message.startsWith('Refusing to test:') && !leaks, message);
}
check('guard: undefined refused', (() => { try { assertLocalDb(undefined, { database: TEST_DB, purpose: 'test' }); return false; } catch { return true; } })());

// ── 2. db.ts selection, in child processes ──
const FAKE_REMOTE = 'postgres://user:pass@ep-fake-pooler.example.neon.tech/db';
const child = `
import { sql } from './api/_lib/db';
const HOOK = Object.assign(() => undefined, { marker: true });
const g = globalThis as any;
if (process.env.T_FLAG === '1') g.__shreekritDev = true;
if (process.env.T_HOOK === '1') g.__shreekritLocalSql = HOOK;
try { const s = sql(); console.log('RESULT ' + JSON.stringify({ ok: true, usedHook: s === (HOOK as any) })); }
catch (e) { console.log('RESULT ' + JSON.stringify({ ok: false })); }
`;
function run(env: Record<string, string>) {
  const r = spawnSync('npx', ['tsx', '-e', child], { cwd: process.cwd(), env: { PATH: process.env.PATH ?? '', HOME: process.env.HOME ?? '', ...env }, encoding: 'utf8' });
  const line = r.stdout.split('\n').find((l) => l.startsWith('RESULT '));
  return line ? JSON.parse(line.slice(7)) as { ok: boolean; usedHook?: boolean } : { ok: false, usedHook: undefined, raw: r.stderr.slice(0, 200) };
}
const vercelEnv = { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_REGION: 'iad1', DATABASE_URL: FAKE_REMOTE };
const cases: [string, Record<string, string>, { ok: boolean; usedHook?: boolean }][] = [
  ['Vercel-like env, no dev flag: uses neon(), no throw', vercelEnv, { ok: true, usedHook: false }],
  ['Vercel-like env with a stray local hook but no flag: hook ignored', { ...vercelEnv, T_HOOK: '1' }, { ok: true, usedHook: false }],
  ['plain env, remote DATABASE_URL, no flag: neon() (existing behaviour)', { DATABASE_URL: FAKE_REMOTE }, { ok: true, usedHook: false }],
  ['no DATABASE_URL and no flag: throws (existing behaviour)', {}, { ok: false }],
  ['dev flag + hook, no DATABASE_URL: uses the local client', { T_FLAG: '1', T_HOOK: '1' }, { ok: true, usedHook: true }],
  ['dev flag + hook, remote DATABASE_URL present: still the local client', { T_FLAG: '1', T_HOOK: '1', DATABASE_URL: FAKE_REMOTE }, { ok: true, usedHook: true }],
  ['dev flag without hook, remote DATABASE_URL: throws, never falls back to remote', { T_FLAG: '1', DATABASE_URL: FAKE_REMOTE }, { ok: false }]
];
for (const [name, env, want] of cases) {
  const got = run(env);
  check(`db.ts: ${name}`, got.ok === want.ok && (want.ok ? got.usedHook === want.usedHook : true), JSON.stringify(got));
}

console.log(failures === 0 ? '\nAll selection tests passed.' : `\n${failures} selection test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
