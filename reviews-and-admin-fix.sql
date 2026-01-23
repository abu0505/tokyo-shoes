-- =============================================
-- TOKYO Shoes Store - Database Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- PART 1: REVIEWS TABLE
-- =============================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shoe_id UUID NOT NULL REFERENCES public.shoes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(shoe_id, user_id)  -- One review per user per shoe
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_shoe_id ON public.reviews(shoe_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- =============================================
-- PART 2: FIX USER_ROLES RLS (if not already done)
-- =============================================

-- First, ensure the has_role function exists and is correct
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop existing problematic policies on user_roles if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin users can view all roles" ON public.user_roles;

-- Create new RLS policies for user_roles using has_role function
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Note: Admins need service role to manage roles, not RLS bypass

-- =============================================
-- PART 3: ADMIN ROLE ASSIGNMENT
-- =============================================

-- To assign admin role to a user, run:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR-USER-UUID-HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- To find your user ID, go to:
-- Supabase Dashboard > Authentication > Users
-- Copy the UUID from the "UID" column

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if reviews table exists:
-- SELECT * FROM public.reviews LIMIT 5;

-- Check current admin users:
-- SELECT ur.*, au.email 
-- FROM public.user_roles ur
-- JOIN auth.users au ON ur.user_id = au.id
-- WHERE ur.role = 'admin';

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'reviews';
-- SELECT * FROM pg_policies WHERE tablename = 'user_roles';
