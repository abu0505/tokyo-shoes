
-- Fix update_shoe_status missing SET search_path
CREATE OR REPLACE FUNCTION public.update_shoe_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT COALESCE(SUM(quantity), 0) FROM shoe_sizes WHERE shoe_id = NEW.shoe_id) > 0 THEN
    UPDATE shoes SET status = 'in_stock'::shoe_status WHERE id = NEW.shoe_id;
  ELSE
    UPDATE shoes SET status = 'sold_out'::shoe_status WHERE id = NEW.shoe_id;
  END IF;
  RETURN NEW;
END;
$$;
