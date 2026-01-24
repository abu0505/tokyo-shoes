-- Update the reviews SELECT policy to allow users to read their own reviews
-- This is needed for the edit functionality while keeping the public view for general display

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Allow users to SELECT their own reviews from the base table (for editing)
CREATE POLICY "Users can view own reviews" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() = user_id);