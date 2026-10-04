// Loads src/data/pouches.ts into Neon. Separate from db/seed.ts so the
// pouches migration can be tested on a Neon branch without re-seeding
// paintings. Run with: DATABASE_URL=<branch url> npm run db:seed:pouches
// (requires db/migrations/002_pouches.sql to have been applied, and the
// artists table to contain the pouch artists).
//
// Re-running resets quantity to the value in src/data/pouches.ts, so do not
// run it against a database holding live pouch stock.
import { neon } from '@neondatabase/serverless';
import { POUCHES } from '../src/data/pouches';

const databaseUrl = process.env.DATABASE_URL;
// Seeding resets quantities and loads demo rows, so it must be a deliberate
// act against a Neon branch, never production.
if (process.env.NEON_BRANCH_CONFIRMED !== 'yes') {
  console.error('Refusing to run: set NEON_BRANCH_CONFIRMED=yes and point DATABASE_URL at a Neon BRANCH (not production).');
  process.exit(1);
}
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Example: DATABASE_URL=postgres://... npm run db:seed:pouches');
  process.exit(1);
}

const sql = neon(databaseUrl);

for (const p of POUCHES) {
  if (!p.isPlaceholder && (p.images.length < 3 || p.images.length > 4)) {
    throw new Error(`Pouch ${p.id}: real pouches need 3-4 images (has ${p.images.length})`);
  }
  await sql`
    INSERT INTO pouches (
      id, name, artist_id, artist_name, price_inr, size_cm, material, paint_type,
      care_instructions, quantity, description, images, is_featured, is_placeholder
    ) VALUES (
      ${p.id}, ${p.name}, ${p.artistId}, ${p.artistName}, ${p.priceINR}, ${p.sizeCm},
      ${p.material}, ${p.paintType}, ${p.careInstructions}, ${p.quantity}, ${p.description},
      ${JSON.stringify(p.images)}, ${p.isFeatured}, ${p.isPlaceholder ?? false}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      artist_id = EXCLUDED.artist_id,
      artist_name = EXCLUDED.artist_name,
      price_inr = EXCLUDED.price_inr,
      size_cm = EXCLUDED.size_cm,
      material = EXCLUDED.material,
      paint_type = EXCLUDED.paint_type,
      care_instructions = EXCLUDED.care_instructions,
      quantity = EXCLUDED.quantity,
      description = EXCLUDED.description,
      images = EXCLUDED.images,
      is_featured = EXCLUDED.is_featured,
      is_placeholder = EXCLUDED.is_placeholder
  `;
  console.log('Seeded pouch:', p.name);
}

console.log(`\nSeed complete — ${POUCHES.length} pouches.`);
