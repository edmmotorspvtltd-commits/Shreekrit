-- Shreekrit orders schema (Supabase Postgres).
-- Run once in the Supabase SQL editor: Project → SQL Editor → New query,
-- paste this whole file, Run. Safe to re-run (uses IF NOT EXISTS / OR REPLACE
-- throughout), except the CREATE POLICY statements, which error on a second
-- run since Postgres has no CREATE POLICY IF NOT EXISTS — drop them first if
-- you need to re-apply.

-- Human-readable order numbers (SHK-000001, SHK-000002, ...), independent of
-- the uuid primary key. A column DEFAULT using this sequence means BOTH the
-- direct authenticated-user insert path gets a number for free without needing
-- to invent one.
CREATE SEQUENCE IF NOT EXISTS orders_order_number_seq START WITH 1;

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL
    DEFAULT ('SHK-' || lpad(nextval('orders_order_number_seq')::text, 6, '0')),
  user_id UUID REFERENCES auth.users(id),
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  currency TEXT NOT NULL,
  total_amount_inr NUMERIC NOT NULL,
  total_amount_display NUMERIC NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_method TEXT NOT NULL,
  tracking_number TEXT,
  tracking_carrier TEXT,
  estimated_delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Every order must be attributable to either a real account or a guest
  -- email, never neither — the authenticated INSERT policy's auth.uid()
  -- check enforces this for signed-in users, but the constraint makes it impossible to
  -- violate even via a direct table edit in the Studio.
  CONSTRAINT orders_owner_present CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- Snapshot fields, not a foreign key to paintings — paintings.ts is
  -- static frontend data today, not a DB table, and even if it becomes one
  -- later, an order must keep showing what the buyer actually saw/paid for
  -- at purchase time, unaffected by later title/price edits.
  painting_id TEXT NOT NULL,
  painting_title TEXT NOT NULL,
  edition_type TEXT NOT NULL,
  unit_price_inr NUMERIC NOT NULL,
  frame TEXT NOT NULL,
  frame_price_inr NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Keep updated_at current on every UPDATE (status changes made later via
-- the Table Editor included) without relying on whoever's editing to
-- remember to set it by hand.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Logged-in users can see their own orders and their own orders' items.
-- No anon SELECT policy at all on either table, so there is no way to
-- enumerate other people's orders by guessing ids (guest lookups go through
-- /api/orders/track against Neon, not this database).
DROP POLICY IF EXISTS select_own_orders ON orders;
CREATE POLICY select_own_orders ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS select_own_order_items ON order_items;
CREATE POLICY select_own_order_items ON order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

-- Authenticated users may insert only their own orders/items — auth.uid()
-- is derived server-side from the caller's JWT, so a client can't spoof a
-- different user_id here. This is why the authenticated path is a plain
-- RLS-gated insert while the guest path below needs a SECURITY DEFINER
-- function instead: an anon client insert has no equivalent server-verified
-- identity to check guest_email against, so a client-writable insert policy
-- would let anyone set ANY guest_email and later "prove" ownership of an
-- order that isn't theirs.
DROP POLICY IF EXISTS insert_own_orders ON orders;
CREATE POLICY insert_own_orders ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_own_order_items ON order_items;
CREATE POLICY insert_own_order_items ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
  ));

-- Deliberately no INSERT/SELECT policy for the anon role on either table,
-- and no UPDATE/DELETE policy for anyone — status/tracking changes are
-- made manually via the Supabase Table Editor (as the table owner, which
-- bypasses RLS), not by end users. See Phase 5 note in MyOrdersSection.tsx
-- / TrackOrderModal.tsx for the future-work admin-UI callout.

-- ============================================================
-- Guest orders are NOT in Supabase
-- ============================================================
-- Orders and order items live in Neon (see db/schema.sql). Guest order
-- tracking is served by /api/orders/track and signed-in customers' orders by
-- /api/orders/list, both of which read Neon. The get_guest_order() and
-- create_guest_order() functions that used to be defined here (SECURITY
-- DEFINER, granted to anon) were removed. Re-running this file drops any
-- copies still present in the database.
DROP FUNCTION IF EXISTS get_guest_order(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_guest_order(TEXT, TEXT, NUMERIC, NUMERIC, JSONB, TEXT, TEXT, DATE, JSONB);
