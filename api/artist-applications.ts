export const config = { runtime: 'edge' };
import { sql } from './_lib/db';

const VALID_STYLES = ['Kachni', 'Bharni', 'Godna', 'Tantrik', 'Kohbar'];

interface RequestBody {
  fullName: string;
  village: string;
  district: string;
  state: string;
  phone: string;
  email: string;
  yearsOfExperience: string;
  primaryStyle: string;
  bio: string;
  sampleWork?: string;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { fullName, village, district, state, phone, email, yearsOfExperience, primaryStyle, bio, sampleWork } = body || {};

  if (!fullName || !village || !district || !state || !phone || !email || !bio) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  if (!VALID_STYLES.includes(primaryStyle)) {
    return new Response(JSON.stringify({ error: 'Invalid primary style' }), { status: 400 });
  }

  const yearsNum = Number(yearsOfExperience);
  if (!Number.isFinite(yearsNum) || yearsNum < 0) {
    return new Response(JSON.stringify({ error: 'Invalid years of experience' }), { status: 400 });
  }

  try {
    const db = sql();
    const inserted = await db`
      INSERT INTO artist_applications (
        full_name, village, district, state, phone, email,
        years_of_experience, primary_style, bio, sample_work
      ) VALUES (
        ${fullName}, ${village}, ${district}, ${state}, ${phone}, ${email},
        ${yearsNum}, ${primaryStyle}, ${bio}, ${sampleWork ?? null}
      )
      RETURNING id
    `;

    return new Response(JSON.stringify({ id: inserted[0].id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('POST /api/artist-applications failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to submit application' }), { status: 500 });
  }
}
