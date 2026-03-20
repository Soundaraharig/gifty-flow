
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-assign first user as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Editing styles table
CREATE TABLE public.editing_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.editing_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active styles" ON public.editing_styles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all styles" ON public.editing_styles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert styles" ON public.editing_styles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update styles" ON public.editing_styles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete styles" ON public.editing_styles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sizes table
CREATE TABLE public.sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  dimensions TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active sizes" ON public.sizes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage sizes" ON public.sizes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Frame materials table
CREATE TABLE public.frame_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.frame_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active materials" ON public.frame_materials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage materials" ON public.frame_materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Frame colors table
CREATE TABLE public.frame_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.frame_colors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active colors" ON public.frame_colors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage colors" ON public.frame_colors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Addons table
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  emoji TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active addons" ON public.addons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage addons" ON public.addons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  editing_style_id UUID REFERENCES public.editing_styles(id),
  size_id UUID REFERENCES public.sizes(id),
  frame_material_id UUID REFERENCES public.frame_materials(id),
  frame_color_id UUID REFERENCES public.frame_colors(id),
  addon_ids UUID[] DEFAULT '{}',
  total_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_editing_styles_updated_at BEFORE UPDATE ON public.editing_styles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Fix editing_styles: drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Everyone can view active styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can view all styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can insert styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can update styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can delete styles" ON public.editing_styles;

CREATE POLICY "Everyone can view active styles" ON public.editing_styles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all styles" ON public.editing_styles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert styles" ON public.editing_styles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update styles" ON public.editing_styles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete styles" ON public.editing_styles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix sizes
DROP POLICY IF EXISTS "Everyone can view active sizes" ON public.sizes;
DROP POLICY IF EXISTS "Admins can manage sizes" ON public.sizes;

CREATE POLICY "Everyone can view active sizes" ON public.sizes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage sizes" ON public.sizes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix frame_materials
DROP POLICY IF EXISTS "Everyone can view active materials" ON public.frame_materials;
DROP POLICY IF EXISTS "Admins can manage materials" ON public.frame_materials;

CREATE POLICY "Everyone can view active materials" ON public.frame_materials FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage materials" ON public.frame_materials FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix frame_colors
DROP POLICY IF EXISTS "Everyone can view active colors" ON public.frame_colors;
DROP POLICY IF EXISTS "Admins can manage colors" ON public.frame_colors;

CREATE POLICY "Everyone can view active colors" ON public.frame_colors FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage colors" ON public.frame_colors FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix addons
DROP POLICY IF EXISTS "Everyone can view active addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON public.addons;

CREATE POLICY "Everyone can view active addons" ON public.addons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage addons" ON public.addons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
-- Create a public storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow anyone to view product images
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

-- Allow authenticated admins to upload/update/delete product images
CREATE POLICY "Admins can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update images" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
ALTER TABLE public.frame_materials
  ADD COLUMN image_url text,
  ADD COLUMN stock integer NOT NULL DEFAULT 10;

CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  address text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses"
ON public.customer_addresses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
ON public.customer_addresses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
ON public.customer_addresses FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
ON public.customer_addresses FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE public.style_gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  editing_style_id UUID NOT NULL REFERENCES public.editing_styles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.style_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active gallery images"
  ON public.style_gallery_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage gallery images"
  ON public.style_gallery_images
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_settings (key, value) VALUES ('admin_whatsapp', '919876543210');
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.resin_product_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resin_product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active resin types" ON public.resin_product_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage resin types" ON public.resin_product_types
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.resin_product_types (name, slug, description, price, sort_order) VALUES
  ('Resin Coasters', 'resin-coasters', 'Beautiful handcrafted resin coasters with custom designs', 499, 0),
  ('Resin Keychains', 'resin-keychains', 'Personalized resin keychains with embedded art', 299, 1),
  ('Resin Trays', 'resin-trays', 'Elegant serving trays with stunning resin art finish', 1299, 2),
  ('Resin Bookmarks', 'resin-bookmarks', 'Unique resin bookmarks with floral and glitter designs', 199, 3),
  ('Resin Phone Grips', 'resin-phone-grips', 'Custom resin phone grips with your favorite colors', 349, 4),
  ('Resin Wall Clocks', 'resin-wall-clocks', 'Statement wall clocks with mesmerizing resin art', 1999, 5);
-- Allow admins to insert, update, delete user roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.orders ADD COLUMN payment_method text DEFAULT 'cod';

-- Subscription requests table
CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can create own subscription requests"
ON public.subscription_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own subscription requests"
ON public.subscription_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all subscription requests"
ON public.subscription_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests
CREATE POLICY "Admins can update subscription requests"
ON public.subscription_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete requests
CREATE POLICY "Admins can delete subscription requests"
ON public.subscription_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can upload subscription screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'subscriptions');

CREATE POLICY "Public can view subscription screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'subscriptions');
