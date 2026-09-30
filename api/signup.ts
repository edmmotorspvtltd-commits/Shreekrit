export const config = { runtime: 'edge' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Creates the Supabase auth user server-side, already marked as confirmed, so
// signup needs no verification email/link. Uses the service_role key, which must
// only ever exist as a server environment variable (never VITE_-prefixed).
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

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });

    if (res.ok) return json({ ok: true });

    const err = (await res.json().catch(() => ({}))) as { error_code?: string; msg?: string };
    if (res.status === 422 || err.error_code === 'email_exists') {
      return json({ error: 'An account with this email already exists. Please log in.' }, 409);
    }
    console.error('Supabase admin createUser failed:', res.status, err);
    return json({ error: 'Could not create your account. Please try again.' }, 500);
  } catch (e) {
    console.error('Signup request failed:', e);
    return json({ error: 'Could not create your account. Please try again.' }, 500);
  }
}
