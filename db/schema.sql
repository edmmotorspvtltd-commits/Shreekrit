-- Shreekrit database schema (Neon Postgres).
-- Run once via `npm run db:migrate` (requires DATABASE_URL in the env).

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  maithili_name TEXT,
  village TEXT,
  district TEXT,
  state TEXT,
  years_of_experience INT,
  generation TEXT,
  specialty_style TEXT,
  bio TEXT,
  avatar TEXT,
  awards JSONB NOT NULL DEFAULT '[]',
  quote TEXT,
  -- True for the four invented demo artists shipped with the original
  -- scaffold. Flips to false once real artist data replaces them.
  is_placeholder BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS paintings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  maithili_title TEXT,
  artist_id TEXT NOT NULL REFERENCES artists(id),
  artist_name TEXT NOT NULL,
  price_inr NUMERIC NOT NULL,
  year INT,
  style TEXT,
  theme TEXT,
  medium TEXT,
  dimensions_cm TEXT,
  dimensions_inches TEXT,
  weight_grams INT,
  is_original BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  completion_hours INT,
  story TEXT,
  pigments_used JSONB NOT NULL DEFAULT '[]',
  motifs JSONB NOT NULL DEFAULT '[]',
  primary_image TEXT,
  detail_images JSONB NOT NULL DEFAULT '[]',
  in_room_image TEXT,
  artist_signature_image TEXT,
  certificate_id TEXT,
  -- True for the demo paintings with placeholder stock photography.
  is_placeholder BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  -- Human-facing order reference, derived from id once known (see
  -- api/orders/create.ts): 'SHK-' || lpad(id, 6, '0').
  order_ref TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL,
  currency TEXT NOT NULL,
  subtotal_inr NUMERIC NOT NULL,
  shipping_inr NUMERIC NOT NULL,
  total_inr NUMERIC NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
  -- This serial id is what makes certificate numbers a real sequential
  -- registry (see api/orders/verify.ts) instead of a cosmetic string
  -- derived client-side from the order id.
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id),
  painting_id TEXT NOT NULL REFERENCES paintings(id),
  painting_title TEXT NOT NULL,
  edition_type TEXT NOT NULL, -- 'original' | 'print'
  frame TEXT NOT NULL,
  frame_price_inr NUMERIC NOT NULL,
  unit_price_inr NUMERIC NOT NULL,
  certificate_number TEXT
);

CREATE TABLE IF NOT EXISTS artist_applications (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT NOT NULL,
  state TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  years_of_experience INT NOT NULL,
  primary_style TEXT NOT NULL,
  bio TEXT NOT NULL,
  sample_work TEXT,
  -- pending | approved | rejected — reviewed manually until an admin
  -- dashboard exists to action these from a UI.
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paintings_artist_id ON paintings(artist_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_artist_applications_status ON artist_applications(status);
