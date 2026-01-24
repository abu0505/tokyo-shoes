-- Fix 1: Restrict profiles table - users can only see their own profile data
-- This prevents phone number harvesting while still allowing profile lookups for display names

-- Drop the overly permissive public visibility policy
DROP POLICY IF EXISTS "Public profiles visible to everyone" ON public.profiles;

-- Create a view for public profile data that excludes sensitive fields
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  username,
  avatar_url,
  created_at
FROM public.profiles;
-- Note: phone is excluded from this view

-- New policy: Users can only SELECT their own full profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Fix 2: Create a view for reviews that masks user_id for privacy
-- This allows reading reviews but prevents user tracking/profiling

CREATE OR REPLACE VIEW public.reviews_public
WITH (security_invoker = on) AS
SELECT 
  id,
  shoe_id,
  rating,
  comment,
  created_at,
  -- Instead of exposing user_id, we'll join to get username
  (SELECT username FROM public.profiles WHERE profiles.id = reviews.user_id) as reviewer_username
FROM public.reviews;

-- Fix 3: Add CHECK constraint for review comment length (server-side validation)
ALTER TABLE public.reviews 
ADD CONSTRAINT check_comment_length 
CHECK (comment IS NULL OR length(comment) <= 1000);

-- Fix 4: Add CHECK constraint for rating range
ALTER TABLE public.reviews 
ADD CONSTRAINT check_rating_range 
CHECK (rating >= 1 AND rating <= 5);