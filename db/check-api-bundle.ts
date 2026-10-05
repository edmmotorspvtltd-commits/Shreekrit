// Proves nothing the API ships to Vercel pulls in `pg` or the dev/ folder.
// Bundles every api/ entry point the way an edge build would (esbuild, no
// node platform) and inspects which files ended up inside.
//
//   npm run check:api-bundle
import { build } from 'esbuild';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const entries: string[] = [];
const walk = (dir: string) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { if (name !== '_lib') walk(full); }
    else if (name.endsWith('.ts')) entries.push(full);
  }
};
walk('api');

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  ${detail}`}`);
  if (!ok) failures++;
};

// Source-level: nothing under api/ may import pg or dev/.
const apiFiles: string[] = [];
const collect = (dir: string) => { for (const n of readdirSync(dir)) { const f = join(dir, n); if (statSync(f).isDirectory()) collect(f); else if (f.endsWith('.ts')) apiFiles.push(f); } };
collect('api');
const offenders = apiFiles.filter((f) => /from ['"](pg|pg-pool)['"]|require\(['"]pg['"]\)|from ['"][./]*\/dev\//.test(readFileSync(f, 'utf8')));
check(`no api/ source imports pg or dev/ (${apiFiles.length} files)`, offenders.length === 0, offenders.join(', '));

// Bundle-level.
const FORBIDDEN = [/\/node_modules\/pg\//, /\/node_modules\/pg-pool\//, /\/node_modules\/pgpass\//, /(^|\/)dev\/local(Sql|Guard)\.ts$/];
for (const entry of entries) {
  try {
    const result = await build({
      entryPoints: [entry], bundle: true, write: false, metafile: true, logLevel: 'silent',
      platform: 'neutral', format: 'esm', mainFields: ['module', 'main'], conditions: ['worker', 'browser']
    });
    const inputs = Object.keys(result.metafile!.inputs);
    const bad = inputs.filter((p) => FORBIDDEN.some((re) => re.test(p)));
    check(`${entry}: bundle has no pg / dev client (${inputs.length} inputs)`, bad.length === 0, bad.join(', '));
  } catch (e) {
    check(`${entry}: bundles`, false, String((e as Error).message).split('\n')[0]);
  }
}

console.log(failures === 0 ? '\nAPI bundle check passed.' : `\n${failures} API bundle check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
