-- Create gift_categories table
CREATE TABLE IF NOT EXISTS public.gift_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  target_route TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gift_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.gift_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.gift_categories;
DROP POLICY IF EXISTS "Subscribers can view/manage categories" ON public.gift_categories;

-- Create access policies
CREATE POLICY "Everyone can view active categories" ON public.gift_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON public.gift_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Subscribers can view/manage categories" ON public.gift_categories
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber'::public.app_role) OR 
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Seed default categories
INSERT INTO public.gift_categories (slug, title, description, image_url, sort_order, target_route, is_active)
VALUES
  ('photo-frames', 'Photo Frames', 'Custom frames with artistic editing styles', '', 0, '/configure/photo-frames/styles', true),
  ('resin-art', 'Resin Art', 'Beautiful handcrafted resin artwork', '', 1, '/configure/resin-art', true),
  ('custom-gifts', 'Custom Gifts', 'Personalized gifts for every occasion', '', 2, '/configure/custom-gifts', false)
ON CONFLICT (slug) DO UPDATE
SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  target_route = EXCLUDED.target_route,
  is_active = EXCLUDED.is_active;
