-- Fix validate_shoe_sizes function to set search_path for security best practices
CREATE OR REPLACE FUNCTION public.validate_shoe_sizes(sizes integer[])
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Allow empty array (for draft shoes or sold out)
  IF array_length(sizes, 1) IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check all sizes are within reasonable range (1-50 to cover US/EU sizes)
  RETURN NOT EXISTS (
    SELECT 1 FROM unnest(sizes) AS size
    WHERE size < 1 OR size > 50
  );
END;
$$;