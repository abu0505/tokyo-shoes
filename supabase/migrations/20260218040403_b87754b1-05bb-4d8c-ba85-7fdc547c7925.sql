
-- Fix cancel_order function: add SET search_path = public
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_status text;
    v_user_id uuid;
    v_item record;
BEGIN
    SELECT status, user_id INTO v_order_status, v_user_id
    FROM orders
    WHERE id = p_order_id;

    IF v_order_status IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_order_status != 'pending' THEN
        RAISE EXCEPTION 'Only pending orders can be cancelled';
    END IF;

    UPDATE orders
    SET status = 'cancelled'
    WHERE id = p_order_id;

    FOR v_item IN
        SELECT shoe_id, size, quantity
        FROM order_items
        WHERE order_id = p_order_id
    LOOP
        UPDATE shoe_sizes
        SET quantity = quantity + v_item.quantity
        WHERE shoe_id = v_item.shoe_id AND size = v_item.size;
    END LOOP;
END;
$$;
