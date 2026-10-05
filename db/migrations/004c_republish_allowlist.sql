-- 004c_republish_allowlist.sql — replaces paintings_sync_status() and pouches_sync_status().
-- NOT part of db/schema.sql or db/migrate.ts (the ';' splitter breaks $$ bodies).
-- Apply by hand, on a Neon BRANCH first. Requires 004 (columns + triggers) to be applied.
-- Not a re-run of 004: only the two function bodies change; the triggers stay attached.
--
-- Republish rule is an ALLOWLIST: a painting cannot go back to 'published' while any
-- order line for its original sits in an order whose status is NOT one of
-- failed / cancelled / test_paid. So pending, paid, and any status added later
-- (shipped, delivered, refunded...) all block by default.
BEGIN;

CREATE OR REPLACE FUNCTION paintings_sync_status() RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN                       -- admin change
    IF NEW.status = 'sold' THEN
      NEW.is_available := false; NEW.sold_via := 'manual';
    ELSIF NEW.status = 'published' THEN
      IF EXISTS (
        SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE oi.painting_id = NEW.id AND oi.edition_type = 'original'
          AND o.status NOT IN ('failed', 'cancelled', 'test_paid')
      ) THEN
        RAISE EXCEPTION 'painting % has an active order for the original', NEW.id USING ERRCODE = '23514';
      END IF;
      NEW.is_available := true; NEW.sold_via := NULL;                  -- sold/archived/draft -> published
    ELSE
      NEW.sold_via := NULL;                                            -- draft / archived keep is_available as is
    END IF;
  ELSIF NEW.is_available IS DISTINCT FROM OLD.is_available THEN        -- checkout reserve / restore
    IF NOT NEW.is_available AND NEW.status = 'published' THEN
      NEW.status := 'sold'; NEW.sold_via := 'checkout';
    ELSIF NEW.is_available AND NEW.status = 'sold' AND NEW.sold_via = 'checkout' THEN
      NEW.status := 'published'; NEW.sold_via := NULL;
    ELSIF NEW.is_available AND NEW.status = 'sold' THEN
      NEW.is_available := false;                                       -- a restore can't undo a manual Sold
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pouches_sync_status() RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'published' AND NEW.quantity = 0 THEN
      RAISE EXCEPTION 'pouch % has no stock; restock before publishing', NEW.id USING ERRCODE = '23514';
    END IF;
    NEW.sold_via := CASE WHEN NEW.status = 'sold' THEN 'manual' ELSE NULL END;
  ELSIF NEW.quantity IS DISTINCT FROM OLD.quantity THEN
    IF NEW.quantity = 0 AND NEW.status = 'published' THEN
      NEW.status := 'sold'; NEW.sold_via := 'checkout';
    ELSIF NEW.quantity > 0 AND NEW.status = 'sold' AND NEW.sold_via = 'checkout' THEN
      NEW.status := 'published'; NEW.sold_via := NULL;
    END IF;                                                            -- manual Sold stays Sold on restock
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

COMMIT;
