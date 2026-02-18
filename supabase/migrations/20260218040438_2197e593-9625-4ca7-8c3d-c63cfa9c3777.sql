
-- Fix remaining functions missing SET search_path

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 2. generate_order_code
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := 'TK-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.order_code := new_code;
  RETURN NEW;
END;
$$;

-- 3. process_order (json version)
CREATE OR REPLACE FUNCTION public.process_order(p_order_details json, p_cart_items json)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSON;
  v_shoe_id UUID;
  v_size NUMERIC;
  v_quantity INT;
  v_updated_rows INT;
BEGIN
  INSERT INTO orders (
    user_id, email, first_name, last_name, address, apartment, city,
    postal_code, phone, shipping_method, shipping_cost, subtotal, tax,
    total, discount_code, payment_method
  )
  SELECT
    (p_order_details->>'user_id')::uuid,
    p_order_details->>'email',
    p_order_details->>'first_name',
    p_order_details->>'last_name',
    p_order_details->>'address',
    p_order_details->>'apartment',
    p_order_details->>'city',
    p_order_details->>'postal_code',
    p_order_details->>'phone',
    COALESCE(p_order_details->>'shipping_method', 'standard'),
    COALESCE((p_order_details->>'shipping_cost')::numeric, 0),
    (p_order_details->>'subtotal')::numeric,
    COALESCE((p_order_details->>'tax')::numeric, 0),
    (p_order_details->>'total')::numeric,
    p_order_details->>'discount_code',
    COALESCE(p_order_details->>'payment_method', 'card')
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM json_array_elements(p_cart_items)
  LOOP
    v_shoe_id := (v_item->>'shoe_id')::uuid;
    v_size := (v_item->>'size')::numeric;
    v_quantity := (v_item->>'quantity')::int;

    UPDATE shoe_sizes
    SET quantity = quantity - v_quantity
    WHERE shoe_id = v_shoe_id AND size = v_size AND quantity >= v_quantity;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    IF v_updated_rows = 0 THEN
      RAISE EXCEPTION 'Insufficient stock for shoe % (size %)', v_shoe_id, v_size;
    END IF;

    INSERT INTO order_items (order_id, shoe_id, quantity, size, color, price)
    VALUES (v_order_id, v_shoe_id, v_quantity, v_size,
            COALESCE(v_item->>'color', 'Default'), (v_item->>'price')::numeric);
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- 4. process_order (SECURITY DEFINER version)
CREATE OR REPLACE FUNCTION public.process_order(
  p_user_id uuid, p_payment_method text, p_shipping_address jsonb,
  p_items jsonb, p_subtotal numeric, p_shipping_cost numeric,
  p_total numeric, p_discount_code text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_shoe_size_id uuid;
  v_current_stock int;
  v_coupon_record record;
begin
  if p_discount_code is not null then
    select * into v_coupon_record from coupons where code = p_discount_code;
    if not found then raise exception 'Invalid Coupon Code'; end if;
    if v_coupon_record.is_active = false then raise exception 'Coupon is not active'; end if;
    if v_coupon_record.expires_at is not null and v_coupon_record.expires_at < now() then raise exception 'Coupon has expired'; end if;
    if v_coupon_record.usage_limit_total is not null and v_coupon_record.times_used >= v_coupon_record.usage_limit_total then raise exception 'Coupon usage limit reached'; end if;
    update coupons set times_used = coalesce(times_used, 0) + 1 where id = v_coupon_record.id;
  end if;

  insert into orders (
    user_id, email, first_name, last_name, address, apartment, city,
    postal_code, phone, shipping_method, shipping_cost, subtotal, tax,
    total, discount_code, email_newsletter, payment_method, status
  ) values (
    p_user_id, p_shipping_address->>'email', p_shipping_address->>'firstName',
    p_shipping_address->>'lastName', p_shipping_address->>'address',
    p_shipping_address->>'apartment', p_shipping_address->>'city',
    p_shipping_address->>'postalCode', p_shipping_address->>'phone',
    p_shipping_address->>'shippingMethod', p_shipping_cost, p_subtotal, 0,
    p_total, p_discount_code, (p_shipping_address->>'emailNewsletter')::boolean,
    p_payment_method, 'pending'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select quantity, id into v_current_stock, v_shoe_size_id
    from shoe_sizes
    where shoe_id = (v_item->>'shoeId')::uuid and size = (v_item->>'size')::numeric
    for update;

    if not found then
      raise exception 'Item size not found for shoe % size %', v_item->>'shoeId', v_item->>'size';
    end if;

    if v_current_stock < (v_item->>'quantity')::int then
      raise exception 'Insufficient stock for shoe % size %', v_item->>'shoeId', v_item->>'size';
    end if;

    update shoe_sizes set quantity = quantity - (v_item->>'quantity')::int where id = v_shoe_size_id;

    insert into order_items (order_id, shoe_id, quantity, size, color, price)
    values (v_order_id, (v_item->>'shoeId')::uuid, (v_item->>'quantity')::int,
            (v_item->>'size')::numeric, v_item->>'color', (v_item->>'price')::numeric);
  end loop;

  return v_order_id;
end;
$$;
