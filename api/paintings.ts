import { sql } from './_lib/db';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const rows = await sql()`SELECT * FROM paintings ORDER BY is_placeholder ASC, is_featured DESC, id ASC`;

    const paintings = rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      maithiliTitle: r.maithili_title,
      artistId: r.artist_id,
      artistName: r.artist_name,
      priceINR: Number(r.price_inr),
      year: r.year,
      style: r.style,
      theme: r.theme,
      medium: r.medium,
      dimensions: { cm: r.dimensions_cm, inches: r.dimensions_inches },
      weightGrams: r.weight_grams,
      isOriginal: r.is_original,
      isAvailable: r.is_available,
      isFeatured: r.is_featured,
      completionHours: r.completion_hours,
      story: r.story,
      pigmentsUsed: r.pigments_used,
      motifs: r.motifs,
      primaryImage: r.primary_image,
      detailImages: r.detail_images,
      inRoomImage: r.in_room_image,
      artistSignatureImage: r.artist_signature_image ?? undefined,
      certificateId: r.certificate_id,
      isPlaceholder: r.is_placeholder
    }));

    return new Response(JSON.stringify(paintings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (err) {
    console.error('GET /api/paintings failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to load paintings' }), { status: 500 });
  }
}
