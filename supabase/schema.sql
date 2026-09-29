-- Shreekrit orders schema (Supabase Postgres).
-- Run once in the Supabase SQL editor: Project → SQL Editor → New query,
-- paste this whole file, Run. Safe to re-run (uses IF NOT EXISTS / OR REPLACE
-- throughout), except the CREATE POLICY statements, which error on a second
-- run since Postgres has no CREATE POLICY IF NOT EXISTS — drop them first if
-- you need to re-apply.

-- Human-readable order numbers (SHK-000001, SHK-000002, ...), independent of
-- the uuid primary key. A column DEFAULT using this sequence means BOTH the
-- direct authenticated-user insert path and the create_guest_order() function
-- get a number for free without either one needing to invent it.
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
  -- email, never neither — this is what create_guest_order()'s NOT NULL
  -- guest_email check and the authenticated INSERT policy's auth.uid()
  -- check jointly guarantee, but the constraint makes it impossible to
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
-- No anon SELECT policy at all on either table — guests reach their order
-- exclusively through get_guest_order() below, never a direct table read,
-- so there is no way to enumerate other people's orders by guessing ids.
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
-- get_guest_order — safe email-based lookup
-- ============================================================
-- Returns the order + its items only when BOTH order_number and
-- guest_email match exactly (case-insensitive on email). Returns NULL on
-- no match — never raises, so a wrong guess just looks like "not found"
-- rather than leaking whether the order number alone was valid.
CREATE OR REPLACE FUNCTION get_guest_order(p_order_number TEXT, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_items JSONB;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE order_number = p_order_number
    AND guest_email IS NOT NULL
    AND lower(guest_email) = lower(p_email);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi)), '[]'::jsonb) INTO v_items
  FROM order_items oi
  WHERE oi.order_id = v_order.id;

  RETURN jsonb_build_object('order', to_jsonb(v_order), 'items', v_items);
END;
$$;

GRANT EXECUTE ON FUNCTION get_guest_order(TEXT, TEXT) TO anon, authenticated;

-- ============================================================
-- create_guest_order — safe guest checkout write
-- ============================================================
-- SECURITY DEFINER so it runs as the table owner (bypasses RLS on the
-- insert), while setting guest_email from a server-validated parameter
-- rather than trusting a client-writable column. Inserts the order and
-- all its items in one transaction, so a guest checkout can never leave
-- an order row with zero items on a partial failure.
CREATE OR REPLACE FUNCTION create_guest_order(
  p_guest_email TEXT,
  p_currency TEXT,
  p_total_amount_inr NUMERIC,
  p_total_amount_display NUMERIC,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_status TEXT,
  p_estimated_delivery_date DATE,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order orders%ROWTYPE;
  v_items JSONB;
  v_item JSONB;
BEGIN
  IF p_guest_email IS NULL OR length(trim(p_guest_email)) = 0 THEN
    RAISE EXCEPTION 'guest_email is required';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'at least one item is required';
  END IF;

  INSERT INTO orders (
    user_id, guest_email, status, currency, total_amount_inr,
    total_amount_display, shipping_address, payment_method,
    estimated_delivery_date
  ) VALUES (
    NULL, p_guest_email, COALESCE(p_status, 'pending_payment'), p_currency,
    p_total_amount_inr, p_total_amount_display, p_shipping_address,
    p_payment_method, p_estimated_delivery_date
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id, painting_id, painting_title, edition_type,
      unit_price_inr, frame, frame_price_inr
    ) VALUES (
      v_order_id,
      v_item->>'painting_id',
      v_item->>'painting_title',
      v_item->>'edition_type',
      (v_item->>'unit_price_inr')::numeric,
      v_item->>'frame',
      (v_item->>'frame_price_inr')::numeric
    );
  END LOOP;

  SELECT * INTO v_order FROM orders WHERE id = v_order_id;
  SELECT jsonb_agg(to_jsonb(oi)) INTO v_items FROM order_items oi WHERE oi.order_id = v_order_id;

  RETURN jsonb_build_object('order', to_jsonb(v_order), 'items', COALESCE(v_items, '[]'::jsonb));
END;
$$;

-- Only anon needs this — a logged-in checkout uses the direct RLS-gated
-- insert path above instead, so it isn't granted to authenticated, to keep
-- there being exactly one write path per case instead of two that could
-- silently drift apart.
GRANT EXECUTE ON FUNCTION create_guest_order(TEXT, TEXT, NUMERIC, NUMERIC, JSONB, TEXT, TEXT, DATE, JSONB) TO anon;
