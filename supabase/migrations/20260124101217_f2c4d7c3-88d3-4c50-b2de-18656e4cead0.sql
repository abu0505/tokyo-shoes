-- Add validation constraint for shoe sizes array
-- Ensures sizes are reasonable (between 1 and 50 to accommodate US/EU sizing) 

-- First, create a function to validate shoe sizes
CREATE OR REPLACE FUNCTION public.validate_shoe_sizes(sizes integer[])
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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

-- Add CHECK constraint using the function
ALTER TABLE public.shoes
ADD CONSTRAINT valid_shoe_sizes
CHECK (validate_shoe_sizes(sizes));

-- Add constraint to ensure price is positive
ALTER TABLE public.shoes
ADD CONSTRAINT valid_shoe_price
CHECK (price > 0);

-- Add constraint to ensure name and brand are not empty
ALTER TABLE public.shoes
ADD CONSTRAINT valid_shoe_name
CHECK (length(trim(name)) > 0);

ALTER TABLE public.shoes
ADD CONSTRAINT valid_shoe_brand
CHECK (length(trim(brand)) > 0);