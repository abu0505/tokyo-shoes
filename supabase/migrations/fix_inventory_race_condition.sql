-- Function to process an order atomically
-- This ensures inventory is deducted only if sufficient stock exists, preventing overselling.

CREATE OR REPLACE FUNCTION process_order(
  p_order_details JSON,
  p_cart_items JSON
) RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_item JSON;
  v_shoe_id UUID;
  v_size NUMERIC;
  v_quantity INT;
  v_updated_rows INT;
BEGIN
  -- 1. Insert Order
  -- We extract fields explicitly to ensure safety and handle defaults
  INSERT INTO orders (
    user_id,
    email,
    first_name,
    last_name,
    address,
    apartment,
    city,
    postal_code,
    phone,
    shipping_method,
    shipping_cost,
    subtotal,
    tax,
    total,
    discount_code,
    payment_method
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

  -- 2. Process Items
  FOR v_item IN SELECT * FROM json_array_elements(p_cart_items)
  LOOP
    v_shoe_id := (v_item->>'shoe_id')::uuid;
    v_size := (v_item->>'size')::numeric;
    v_quantity := (v_item->>'quantity')::int;

    -- Atomic Update: Deduct stock only if sufficient
    -- Matches both shoe_id and size in shoe_sizes table
    UPDATE shoe_sizes
    SET quantity = quantity - v_quantity
    WHERE shoe_id = v_shoe_id
      AND size = v_size
      AND quantity >= v_quantity;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

    -- Validation: If no rows updated, it means insufficient stock (or item not found)
    IF v_updated_rows = 0 THEN
      RAISE EXCEPTION 'Insufficient stock for shoe % (size %)', v_shoe_id, v_size;
    END IF;

    -- Insert Order Item
    INSERT INTO order_items (
      order_id,
      shoe_id,
      quantity,
      size,
      color,
      price
    ) VALUES (
      v_order_id,
      v_shoe_id,
      v_quantity,
      v_size,
      COALESCE(v_item->>'color', 'Default'),
      (v_item->>'price')::numeric
    );
  END LOOP;

  -- 3. Return the new order ID
  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;
