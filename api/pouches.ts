import { sql } from './_lib/db';
import { isProduction } from './_lib/env';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    // Demo pouches are never exposed by the production deployment.
    const rows = await sql()`
      SELECT * FROM pouches
      WHERE is_placeholder = false OR ${!isProduction()}
      ORDER BY is_placeholder ASC, is_featured DESC, id ASC
    `;

    const pouches = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      artistId: r.artist_id,
      artistName: r.artist_name,
      priceINR: Number(r.price_inr),
      sizeCm: r.size_cm,
      material: r.material,
      paintType: r.paint_type,
      careInstructions: r.care_instructions,
      quantity: r.quantity,
      description: r.description,
      images: r.images,
      isFeatured: r.is_featured,
      isPlaceholder: r.is_placeholder
    }));

    // Short cache: "only N left" should track stock closely. The order API
    // re-checks stock atomically regardless of what this returns.
    return new Response(JSON.stringify(pouches), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (err) {
    console.error('GET /api/pouches failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to load pouches' }), { status: 500 });
  }
}
