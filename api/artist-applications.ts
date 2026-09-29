import { sql } from './_lib/db';
import { sendArtistApplicationConfirmation, sendArtistApplicationAlertToStore } from './_lib/email';

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

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as RequestBody;

  const { fullName, village, district, state, phone, email, yearsOfExperience, primaryStyle, bio, sampleWork } = body || {};

  if (!fullName || !village || !district || !state || !phone || !email || !bio) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!VALID_STYLES.includes(primaryStyle)) {
    return res.status(400).json({ error: 'Invalid primary style' });
  }

  const yearsNum = Number(yearsOfExperience);
  if (!Number.isFinite(yearsNum) || yearsNum < 0) {
    return res.status(400).json({ error: 'Invalid years of experience' });
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

    // Send emails (fire-and-forget)
    Promise.allSettled([
      sendArtistApplicationConfirmation({
        artistName: fullName, artistEmail: email,
        village, district, state, phone,
        primaryStyle, yearsOfExperience: yearsNum, bio
      }),
      sendArtistApplicationAlertToStore({
        artistName: fullName, artistEmail: email,
        village, district, state, phone,
        primaryStyle, yearsOfExperience: yearsNum, bio
      }),
    ]).catch(() => { /* swallow */ });

    return res.status(200).json({ id: inserted[0].id });
  } catch (err) {
    console.error('POST /api/artist-applications failed:', err);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
}
