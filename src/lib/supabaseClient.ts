import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Deliberately not a thrown error: this used to crash the entire app at
  // module load (blank page, nothing renders) whenever these env vars
  // were missing in a deployment — e.g. set locally in .env.local but not
  // yet added to Vercel's Environment Variables. Accounts, checkout
  // persistence, and order tracking are one part of the site; a missing
  // credential for them should degrade those features, not take down the
  // gallery/blog/artist pages that have nothing to do with Supabase.
  console.error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set (see .env.example). ' +
    'Login, checkout, and order tracking will not work until they are configured — the rest of the site is unaffected.'
  );
}

// A syntactically valid placeholder so createClient() itself doesn't throw
// when unconfigured. Calls made against it simply fail at the network
// layer, which the existing try/catch blocks in AuthContext/CheckoutModal/
// TrackOrderModal already handle and surface as a normal error message.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
