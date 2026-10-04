-- 002_pouches: adds the "Pouches" product category (hand-painted fabric
-- pouches) alongside paintings.
--
-- Run by hand on a Neon BRANCH first (not production), e.g.:
--   psql "$NEON_BRANCH_DATABASE_URL" -f db/migrations/002_pouches.sql
-- or paste into the Neon SQL editor with the branch selected.
--
-- Idempotent: safe to run more than once. Existing paintings and orders are
-- not modified; existing order_items rows become product_type = 'painting'
-- with quantity = 1 via column defaults.
--
-- ROLLBACK (only safe while no pouch orders exist, i.e. no order_items row
-- has product_type = 'pouch'; otherwise delete/archive those rows first):
--   ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_ref_chk;
--   ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_quantity_chk;
--   ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_type_chk;
--   ALTER TABLE order_items DROP COLUMN IF EXISTS pouch_id;
--   ALTER TABLE order_items DROP COLUMN IF EXISTS quantity;
--   ALTER TABLE order_items DROP COLUMN IF EXISTS product_type;
--   ALTER TABLE order_items ALTER COLUMN painting_id SET NOT NULL;
--   DROP TABLE IF EXISTS pouches;

CREATE TABLE IF NOT EXISTS pouches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  artist_id TEXT NOT NULL REFERENCES artists(id),
  artist_name TEXT NOT NULL,
  price_inr NUMERIC NOT NULL CHECK (price_inr > 0),
  size_cm TEXT NOT NULL,
  material TEXT NOT NULL,
  paint_type TEXT NOT NULL,
  care_instructions TEXT NOT NULL,
  -- Pieces in stock. Decremented atomically at order creation
  -- (api/orders/create.ts); the CHECK makes overselling impossible even if
  -- application code is wrong.
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  description TEXT NOT NULL,
  -- Image paths/URLs, same convention as paintings (files under public/).
  -- 3-4 images for real stock; placeholders may have fewer.
  images JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 4),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  -- Demo rows: never shown or purchasable when VERCEL_ENV = 'production'.
  is_placeholder BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pouches_artist_id ON pouches(artist_id);

-- order_items: a line is either a painting or a pouch. For pouches,
-- painting_title holds the pouch name (column kept to avoid a rename that
-- would touch every order query).
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'painting';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pouch_id TEXT REFERENCES pouches(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;
ALTER TABLE order_items ALTER COLUMN painting_id DROP NOT NULL;

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_type_chk;
ALTER TABLE order_items ADD CONSTRAINT order_items_product_type_chk CHECK (product_type IN ('painting', 'pouch'));

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_quantity_chk;
ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_chk CHECK (quantity >= 1 AND quantity <= 10);

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_ref_chk;
ALTER TABLE order_items ADD CONSTRAINT order_items_product_ref_chk CHECK (
  (product_type = 'painting' AND painting_id IS NOT NULL AND pouch_id IS NULL)
  OR (product_type = 'pouch' AND pouch_id IS NOT NULL AND painting_id IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_order_items_pouch_id ON order_items(pouch_id);
