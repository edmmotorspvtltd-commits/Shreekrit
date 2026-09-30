export const config = { runtime: 'edge' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Creates the Supabase auth user server-side, already marked as confirmed, so
// signup needs no verification email/link. Uses the service_role key, which must
// only ever exist as a server environment variable (never VITE_-prefixed).
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail } from './_lib/email';

export default async function handler(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400);
  if (password.length < 6) return json({ error: 'Password must be at least 6 characters.' }, 400);

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.');
    return json({ error: 'Signup is temporarily unavailable. Please try again later.' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // We generate the signup link directly. This creates the user (unverified)
    // and returns the verification URL that we can email ourselves.
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
    });

    if (error) {
      if (error.message.includes('already registered')) {
         return json({ error: 'An account with this email already exists. Please log in.' }, 409);
      }
      console.error('Supabase generateLink error:', error);
      return json({ error: 'Could not create your account. Please try again.' }, 500);
    }

    if (!data?.properties?.action_link) {
      console.error('No action link returned from generateLink');
      return json({ error: 'Could not generate verification link.' }, 500);
    }

    // Send our beautifully branded custom email via Resend
    await sendVerificationEmail(email, data.properties.action_link);

    return json({ ok: true });
  } catch (e) {
    console.error('Signup request failed:', e);
    return json({ error: 'Could not create your account. Please try again.' }, 500);
  }
}
