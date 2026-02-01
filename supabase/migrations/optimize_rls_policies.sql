-- Optimize policies for cart_items
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
CREATE POLICY "Users can view their own cart items"
  ON public.cart_items FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
CREATE POLICY "Users can insert their own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
CREATE POLICY "Users can update their own cart items"
  ON public.cart_items FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
CREATE POLICY "Users can delete their own cart items"
  ON public.cart_items FOR DELETE
  USING (user_id = (select auth.uid()));

-- Optimize policies for saved_addresses
DROP POLICY IF EXISTS "Users can view own addresses" ON public.saved_addresses;
CREATE POLICY "Users can view own addresses"
  ON public.saved_addresses FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.saved_addresses;
CREATE POLICY "Users can insert own addresses"
  ON public.saved_addresses FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own addresses" ON public.saved_addresses;
CREATE POLICY "Users can update own addresses"
  ON public.saved_addresses FOR UPDATE
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.saved_addresses;
CREATE POLICY "Users can delete own addresses"
  ON public.saved_addresses FOR DELETE
  USING (user_id = (select auth.uid()));

-- Optimize policies for wishlists (assuming table exists and follows similar pattern)
-- First check if table exists to avoid errors in strict mode, but standard SQL just using policies on existing tables
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlist"
  ON public.wishlists
  USING (user_id = (select auth.uid()));
