import { sql } from './_lib/db';



export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
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

    return new Response(JSON.stringify(artists), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    console.error('GET /api/artists failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to load artists' }), { status: 500 });
  }
}
