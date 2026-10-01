// Loads the placeholder artists/paintings that shipped with the original
// scaffold into Neon, so the site has something to render before real
// artist data arrives. Every row is marked is_placeholder = true — swap
// it for real data by re-running this against updated src/data/*.ts, or
// by editing rows directly once there's an admin UI.
// Run with: npm run db:seed (requires DATABASE_URL and a migrated schema).
import { neon } from '@neondatabase/serverless';
import { ARTISTS } from '../src/data/artists';
import { PAINTINGS } from '../src/data/paintings';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Example: DATABASE_URL=postgres://... npm run db:seed');
  process.exit(1);
}

const sql = neon(databaseUrl);

for (const artist of ARTISTS) {
  await sql`
    INSERT INTO artists (
      id, name, maithili_name, village, district, state,
      years_of_experience, generation, specialty_style, bio, avatar,
      awards, quote, is_placeholder
    ) VALUES (
      ${artist.id}, ${artist.name}, ${artist.maithiliName}, ${artist.village},
      ${artist.district}, ${artist.state}, ${artist.yearsOfExperience},
      ${artist.generation}, ${artist.specialtyStyle}, ${artist.bio}, ${artist.avatar},
      ${JSON.stringify(artist.awards)}, ${artist.quote}, ${artist.isPlaceholder ?? false}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      maithili_name = EXCLUDED.maithili_name,
      village = EXCLUDED.village,
      district = EXCLUDED.district,
      state = EXCLUDED.state,
      years_of_experience = EXCLUDED.years_of_experience,
      generation = EXCLUDED.generation,
      specialty_style = EXCLUDED.specialty_style,
      bio = EXCLUDED.bio,
      avatar = EXCLUDED.avatar,
      awards = EXCLUDED.awards,
      quote = EXCLUDED.quote,
      is_placeholder = EXCLUDED.is_placeholder
  `;
  console.log('Seeded artist:', artist.name);
}

for (const painting of PAINTINGS) {
  await sql`
    INSERT INTO paintings (
      id, title, maithili_title, artist_id, artist_name, price_inr, year,
      style, theme, medium, dimensions_cm, dimensions_inches, weight_grams,
      is_original, is_available, is_featured, completion_hours, story,
      pigments_used, motifs, primary_image, detail_images, in_room_image,
      artist_signature_image, certificate_id, is_placeholder
    ) VALUES (
      ${painting.id}, ${painting.title}, ${painting.maithiliTitle}, ${painting.artistId},
      ${painting.artistName}, ${painting.priceINR}, ${painting.year}, ${painting.style},
      ${painting.theme}, ${painting.medium}, ${painting.dimensions.cm}, ${painting.dimensions.inches},
      ${painting.weightGrams}, ${painting.isOriginal}, ${painting.isAvailable}, ${painting.isFeatured},
      ${painting.completionHours}, ${painting.story}, ${JSON.stringify(painting.pigmentsUsed)},
      ${JSON.stringify(painting.motifs)}, ${painting.primaryImage}, ${JSON.stringify(painting.detailImages)},
      ${painting.inRoomImage}, ${painting.artistSignatureImage ?? null}, ${painting.certificateId}, ${painting.isPlaceholder ?? false}
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      maithili_title = EXCLUDED.maithili_title,
      artist_id = EXCLUDED.artist_id,
      artist_name = EXCLUDED.artist_name,
      price_inr = EXCLUDED.price_inr,
      year = EXCLUDED.year,
      style = EXCLUDED.style,
      theme = EXCLUDED.theme,
      medium = EXCLUDED.medium,
      dimensions_cm = EXCLUDED.dimensions_cm,
      dimensions_inches = EXCLUDED.dimensions_inches,
      weight_grams = EXCLUDED.weight_grams,
      is_original = EXCLUDED.is_original,
      is_available = EXCLUDED.is_available,
      is_featured = EXCLUDED.is_featured,
      completion_hours = EXCLUDED.completion_hours,
      story = EXCLUDED.story,
      pigments_used = EXCLUDED.pigments_used,
      motifs = EXCLUDED.motifs,
      primary_image = EXCLUDED.primary_image,
      detail_images = EXCLUDED.detail_images,
      in_room_image = EXCLUDED.in_room_image,
      artist_signature_image = EXCLUDED.artist_signature_image,
      certificate_id = EXCLUDED.certificate_id,
      is_placeholder = EXCLUDED.is_placeholder
  `;
  console.log('Seeded painting:', painting.title);
}

console.log(`\nSeed complete — ${ARTISTS.length} artists, ${PAINTINGS.length} paintings.`);
