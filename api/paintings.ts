import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rows = await sql()`SELECT * FROM paintings ORDER BY is_featured DESC, id ASC`;

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

    // Short edge cache — gallery data changes rarely, but availability
    // (is_available going false on a sold original) should show up
    // within a minute rather than being pinned for a full day.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(paintings);
  } catch (err) {
    console.error('GET /api/paintings failed:', err);
    res.status(500).json({ error: 'Failed to load paintings' });
  }
}
