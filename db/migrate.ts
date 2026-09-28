// One-time schema setup against Neon. Run with: npm run db:migrate
// Requires DATABASE_URL in the environment (e.g. `DATABASE_URL=... npm run db:migrate`
// or a local .env loaded by your shell).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { neon } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Example: DATABASE_URL=postgres://... npm run db:migrate');
  process.exit(1);
}

const sql = neon(databaseUrl);
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

// Split on statement-terminating semicolons; schema.sql has no semicolons
// inside string literals or function bodies, so this simple split is safe.
const statements = schema
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  await sql(statement);
  console.log('OK:', statement.split('\n')[0].slice(0, 70));
}

console.log(`\nMigration complete — ${statements.length} statements applied.`);
