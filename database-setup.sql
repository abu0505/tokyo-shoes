-- ============================================
-- TOKYO SHOES COLLECTION - DATABASE SETUP
-- ============================================
-- Run this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- ============================================

-- ============================================
-- 1. CREATE CUSTOM TYPES
-- ============================================

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

-- Create shoe_status enum for product status
CREATE TYPE public.shoe_status AS ENUM ('in_stock', 'sold_out');

-- ============================================
-- 2. CREATE TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'customer',
    UNIQUE(user_id, role)
);

-- Shoes/Products table
CREATE TABLE public.shoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    image_url TEXT,
    sizes INTEGER[] NOT NULL DEFAULT '{}',
    status public.shoe_status NOT NULL DEFAULT 'in_stock',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlists table
CREATE TABLE public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shoe_id UUID NOT NULL REFERENCES public.shoes(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, shoe_id)
);

-- Order Inquiries table
CREATE TABLE public.order_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    shoe_id UUID REFERENCES public.shoes(id) ON DELETE SET NULL,
    size INTEGER,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_shoes_brand ON public.shoes(brand);
CREATE INDEX idx_shoes_status ON public.shoes(status);
CREATE INDEX idx_shoes_created_at ON public.shoes(created_at DESC);
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_shoe_id ON public.wishlists(shoe_id);
CREATE INDEX idx_order_inquiries_created_at ON public.order_inquiries(created_at DESC);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_inquiries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- PROFILES POLICIES
-- Users can view any profile
CREATE POLICY "Public profiles visible to everyone"
ON public.profiles FOR SELECT
USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- USER ROLES POLICIES
-- Users can view their own role, admins can view all
-- IMPORTANT: Using has_role() function to avoid infinite recursion
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Only admins can manage roles (using has_role to avoid recursion)
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- SHOES POLICIES
-- Everyone can view shoes
CREATE POLICY "Shoes visible to everyone"
ON public.shoes FOR SELECT
USING (true);

-- Only admins can manage shoes
CREATE POLICY "Admins can manage shoes"
ON public.shoes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- WISHLISTS POLICIES
-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist"
ON public.wishlists FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own wishlist
CREATE POLICY "Users can manage own wishlist"
ON public.wishlists FOR ALL
USING (auth.uid() = user_id);

-- ORDER INQUIRIES POLICIES
-- Anyone can create inquiries (even without login)
CREATE POLICY "Anyone can create inquiries"
ON public.order_inquiries FOR INSERT
WITH CHECK (true);

-- Only admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.order_inquiries FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Only admins can update/delete inquiries
CREATE POLICY "Admins can manage inquiries"
ON public.order_inquiries FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can delete inquiries"
ON public.order_inquiries FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
END;
$$;

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6.1. AUTO-ADMIN ASSIGNMENT
-- ============================================
-- Automatically assigns admin role for specific email(s)
-- Change the email below to your admin email

CREATE OR REPLACE FUNCTION public.handle_admin_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    admin_emails TEXT[] := ARRAY['admin@tokyoshoes.com'];  -- Add more emails if needed
BEGIN
    -- Check if the new user's email is in the admin list
    IF NEW.email = ANY(admin_emails) THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger to auto-assign admin role
CREATE TRIGGER on_auth_user_created_admin_check
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_assignment();

-- ============================================
-- 7. CREATE STORAGE BUCKET
-- ============================================
-- Note: Run these in the SQL editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('shoe-images', 'shoe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for shoe-images bucket
CREATE POLICY "Anyone can view shoe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'shoe-images');

CREATE POLICY "Admins can upload shoe images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'shoe-images'
    AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can update shoe images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'shoe-images'
    AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Admins can delete shoe images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'shoe-images'
    AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- 8. SAMPLE DATA (OPTIONAL)
-- ============================================
-- Uncomment the following to add sample shoes

/*
INSERT INTO public.shoes (name, brand, price, sizes, status) VALUES
('Air Jordan 1 Retro High', 'Nike', 18500, ARRAY[40, 41, 42, 43, 44, 45], 'in_stock'),
('Yeezy Boost 350 V2', 'Adidas', 22000, ARRAY[40, 41, 42, 43], 'in_stock'),
('RS-X Reinvention', 'Puma', 12500, ARRAY[39, 40, 41, 42, 43, 44], 'in_stock'),
('Classic Leather', 'Reebok', 8500, ARRAY[41, 42, 43, 44, 45], 'in_stock'),
('Air Force 1 Low', 'Nike', 11000, ARRAY[40, 41, 42, 43, 44], 'sold_out'),
('Old Skool', 'Vans', 6500, ARRAY[38, 39, 40, 41, 42, 43, 44, 45], 'in_stock'),
('Chuck Taylor All Star', 'Converse', 5500, ARRAY[37, 38, 39, 40, 41, 42, 43], 'in_stock'),
('Ultraboost 22', 'Adidas', 19000, ARRAY[41, 42, 43, 44, 45, 46], 'in_stock');
*/

-- ============================================
-- 9. MAKE YOURSELF AN ADMIN
-- ============================================
-- After signing up, run this with your user ID:
-- 
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR-USER-UUID-HERE', 'admin');
--
-- To find your user ID, go to:
-- Supabase Dashboard > Authentication > Users
-- Click on your user and copy the UID

-- ============================================
-- DONE! Your database is ready.
-- ============================================
