export const config = { runtime: 'edge' };
import { waitUntil } from '@vercel/functions';
import { sql } from './_lib/db';
import { text, optionalText, email as validEmail, phone as validPhone, oneOf, badRequest, MAX } from './_lib/validate';
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

  const raw = (body && typeof body === 'object' ? body : {}) as Partial<Record<keyof RequestBody, unknown>>;
  const fullName = text(raw.fullName, { max: MAX.name });
  const village = text(raw.village, { max: MAX.place });
  const district = text(raw.district, { max: MAX.place });
  const state = text(raw.state, { max: MAX.place });
  const phone = validPhone(raw.phone);
  const email = validEmail(raw.email);
  const bio = text(raw.bio, { max: MAX.bio, multiline: true });
  const sampleWork = optionalText(raw.sampleWork, { max: MAX.sampleWork, multiline: true });
  const primaryStyle = oneOf(raw.primaryStyle, VALID_STYLES);

  if (!fullName || !village || !district || !state || !phone || !email || !bio) {
    return badRequest('Please check the required fields; each must be filled in with a valid value (valid email and phone, bio up to 2000 characters).');
  }
  if (sampleWork === null) {
    return badRequest('Sample work must be 500 characters or fewer.');
  }
  if (!primaryStyle) {
    return badRequest('Invalid primary style');
  }

  const yearsNum = Number(raw.yearsOfExperience);
  if (!Number.isFinite(yearsNum) || yearsNum < 0 || yearsNum > 100) {
    return badRequest('Invalid years of experience');
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

    // The application is already saved (awaited above). Emails run after the
    // response is sent; waitUntil keeps the function alive until they settle.
    const emailPayload = {
      artistName: fullName, artistEmail: email,
      village, district, state, phone,
      primaryStyle, yearsOfExperience: yearsNum, bio
    };
    waitUntil(
      Promise.allSettled([
        sendArtistApplicationConfirmation(emailPayload),
        sendArtistApplicationAlertToStore(emailPayload),
      ]).then((results) => {
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            console.error(`Artist application email ${i === 0 ? 'confirmation' : 'store alert'} failed:`, result.reason);
          }
        });
      })
    );

    return new Response(JSON.stringify({ id: inserted[0].id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('POST /api/artist-applications failed:', err);
    return new Response(JSON.stringify({ error: 'Failed to submit application' }), { status: 500 });
  }
}

