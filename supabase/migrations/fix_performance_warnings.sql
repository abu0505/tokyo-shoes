-- Fix RLS Performance Warnings and Consolidate Policies

-- 1. Fix orders Table
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;

-- Create Unified Select: "Users and Admins can view orders"
CREATE POLICY "Users and Admins can view orders" ON orders
FOR SELECT USING (
  ((select auth.uid()) = user_id) 
  OR 
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (select auth.uid()) AND role = 'admin'))
);

-- Create Unified Update: "Admins and Users update orders"
CREATE POLICY "Admins and Users update orders" ON orders
FOR UPDATE USING (
  ((select auth.uid()) = user_id) 
  OR 
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (select auth.uid()) AND role = 'admin'))
);

-- Create Insert: "Users can insert own orders"
CREATE POLICY "Users can insert own orders" ON orders
FOR INSERT WITH CHECK (
  (select auth.uid()) = user_id
);


-- 2. Fix order_items Table
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

-- Create Unified Select: "Users and Admins can view order items"
CREATE POLICY "Users and Admins can view order items" ON order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = (select auth.uid())
  )
  OR 
  (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (select auth.uid()) AND role = 'admin'))
);

-- Create Insert: "Users can insert order items"
-- Checking ownership of parent order implicitly via the check or just assuming authenticated user inserting for their order.
-- Given the requirement: "Users can insert order items" (Check ownership of order_id).
CREATE POLICY "Users can insert order_items" ON order_items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = (select auth.uid())
  )
);


-- 3. Fix reviews Table
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Everyone can read reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can only review products they have purchased and received" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

-- Create Select: "Public can view reviews"
CREATE POLICY "Public can view reviews" ON reviews
FOR SELECT USING (true);

-- Create Insert: "Verified Users can create reviews"
CREATE POLICY "Verified Users can create reviews" ON reviews
FOR INSERT WITH CHECK (
  (select auth.uid()) = user_id
  AND
  EXISTS ( 
    SELECT 1 FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = (select auth.uid()) 
    AND oi.shoe_id = reviews.shoe_id 
    AND o.status = 'Delivered'
  )
);

-- Create Update/Delete: "Users can manage own reviews"
CREATE POLICY "Users can manage own reviews" ON reviews
FOR ALL USING (
  (select auth.uid()) = user_id
); 
-- Note: FOR ALL covers SELECT, INSERT, UPDATE, DELETE. But we defined specific SELECT and INSERT above.
-- To avoid conflict or redundancy, and since "Public can view" is broader for SELECT, we should probably restrict this to UPDATE/DELETE?
-- "Users can manage own reviews" usually implies UPDATE and DELETE if SELECT is covered by Public.
-- And INSERT is covered by "Verified Users...".
-- So I will make this explicitly FOR UPDATE and DELETE.
-- Wait, the prompt said: "Create Update/Delete: 'Users can manage own reviews' -> (select auth.uid()) = user_id."
-- So I will split it or use one policy for both.
DROP POLICY IF EXISTS "Users can manage own reviews" ON reviews; -- Just in case I made one by mistake above locally (not needed logically but good practice)
CREATE POLICY "Users can update own reviews" ON reviews
FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own reviews" ON reviews
FOR DELETE USING ((select auth.uid()) = user_id);


-- 4. Fix wishlists Table
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;

-- Create Standard Policies
CREATE POLICY "Users can view own wishlist" ON wishlists
FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own wishlist" ON wishlists
FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own wishlist" ON wishlists
FOR DELETE USING ((select auth.uid()) = user_id);


-- 5. Fix profiles Table
DROP POLICY IF EXISTS "Everyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view profile usernames" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create Select: "Public can view profiles"
CREATE POLICY "Public can view profiles" ON profiles
FOR SELECT USING (true);

-- Assuming we need specific policies for users to update/insert their own profiles as well, 
-- though the prompt only explicitly asked for "Create Select...". 
-- However, "Drop duplicate SELECT INSERT UPDATE..." implied we are cleaning up.
-- If I drop "Users can insert own profile" and "Users can update own profile", I MUST recreate them or users can't edit profiles.
-- The prompt for profiles says: "Create Select: 'Public can view profiles' -> USING (true)."
-- It does NOT explicitly ask for Update/Insert for profiles, but removing them would break the app.
-- I should recreate standard "Users can manage own profile" policies.
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING ((select auth.uid()) = id);
