
-- Fix get_cart_with_stock missing SET search_path
CREATE OR REPLACE FUNCTION public.get_cart_with_stock(p_user_id uuid)
RETURNS TABLE(id uuid, shoe_id uuid, quantity integer, size numeric, color text, brand text, shoe_name text, shoe_price integer, shoe_image text, stock_quantity integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ci.id,
    ci.shoe_id,
    ci.quantity,
    ci.size,
    ci.color,
    ci.brand,
    s.name AS shoe_name,
    s.price AS shoe_price,
    s.image_url AS shoe_image,
    COALESCE(ss.quantity, 0)::integer AS stock_quantity
  FROM cart_items ci
  JOIN shoes s ON s.id = ci.shoe_id
  LEFT JOIN shoe_sizes ss ON ss.shoe_id = ci.shoe_id AND ss.size = ci.size
  WHERE ci.user_id = p_user_id;
$$;
