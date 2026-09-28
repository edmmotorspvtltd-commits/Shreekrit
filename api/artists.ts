import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rows = await sql()`SELECT * FROM artists ORDER BY name ASC`;

    const artists = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      maithiliName: r.maithili_name,
      village: r.village,
      district: r.district,
      state: r.state,
      yearsOfExperience: r.years_of_experience,
      generation: r.generation,
      specialtyStyle: r.specialty_style,
      bio: r.bio,
      avatar: r.avatar,
      awards: r.awards,
      quote: r.quote,
      isPlaceholder: r.is_placeholder
    }));

    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    res.status(200).json(artists);
  } catch (err) {
    console.error('GET /api/artists failed:', err);
    res.status(500).json({ error: 'Failed to load artists' });
  }
}
