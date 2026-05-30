-- Migration: Secure RLS Database Policies
-- Date: 2026-05-30
-- Description: Reviews and hardens RLS policies across the database. Protects user/order ownership and restricts admin modifications to 'admin' role.

-- 1. Ensure RLS is enabled on all core tables
ALTER TABLE IF EXISTS public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gift_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.editing_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.frame_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.frame_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resin_product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.style_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.video_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2. customer_addresses RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Users can view own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON public.customer_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.customer_addresses;

CREATE POLICY "Users can view own addresses" ON public.customer_addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own addresses" ON public.customer_addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON public.customer_addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own addresses" ON public.customer_addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));


-- 3. orders RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 4. gift_categories RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active categories" ON public.gift_categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.gift_categories;
DROP POLICY IF EXISTS "Subscribers can view/manage categories" ON public.gift_categories;
DROP POLICY IF EXISTS "Subscribers and Admins can view all categories" ON public.gift_categories;

CREATE POLICY "Everyone can view active categories" ON public.gift_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all categories" ON public.gift_categories
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage categories" ON public.gift_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 5. editing_styles RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can view all styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can insert styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can update styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Admins can delete styles" ON public.editing_styles;
DROP POLICY IF EXISTS "Subscribers and Admins can view all styles" ON public.editing_styles;

CREATE POLICY "Everyone can view active styles" ON public.editing_styles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all styles" ON public.editing_styles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage styles" ON public.editing_styles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 6. video_frames RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Admins and Subscribers can insert video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Admins and Subscribers can update video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Admins and Subscribers can delete video_frames" ON public.video_frames;
DROP POLICY IF EXISTS "Admins can manage video_frames" ON public.video_frames;

CREATE POLICY "Everyone can view video_frames" ON public.video_frames
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage video_frames" ON public.video_frames
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 7. sizes RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active sizes" ON public.sizes;
DROP POLICY IF EXISTS "Admins can manage sizes" ON public.sizes;
DROP POLICY IF EXISTS "Subscribers and Admins can view all sizes" ON public.sizes;

CREATE POLICY "Everyone can view active sizes" ON public.sizes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all sizes" ON public.sizes
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage sizes" ON public.sizes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 8. frame_materials RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active materials" ON public.frame_materials;
DROP POLICY IF EXISTS "Admins can manage materials" ON public.frame_materials;
DROP POLICY IF EXISTS "Subscribers and Admins can view all materials" ON public.frame_materials;

CREATE POLICY "Everyone can view active materials" ON public.frame_materials
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all materials" ON public.frame_materials
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage materials" ON public.frame_materials
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 9. frame_colors RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active colors" ON public.frame_colors;
DROP POLICY IF EXISTS "Admins can manage colors" ON public.frame_colors;
DROP POLICY IF EXISTS "Subscribers and Admins can view all colors" ON public.frame_colors;

CREATE POLICY "Everyone can view active colors" ON public.frame_colors
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all colors" ON public.frame_colors
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage colors" ON public.frame_colors
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 10. addons RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active addons" ON public.addons;
DROP POLICY IF EXISTS "Admins can manage addons" ON public.addons;
DROP POLICY IF EXISTS "Subscribers and Admins can view all addons" ON public.addons;

CREATE POLICY "Everyone can view active addons" ON public.addons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all addons" ON public.addons
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage addons" ON public.addons
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 11. resin_product_types RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active resin types" ON public.resin_product_types;
DROP POLICY IF EXISTS "Admins can manage resin types" ON public.resin_product_types;
DROP POLICY IF EXISTS "Subscribers and Admins can view all resin types" ON public.resin_product_types;

CREATE POLICY "Everyone can view active resin types" ON public.resin_product_types
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all resin types" ON public.resin_product_types
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage resin types" ON public.resin_product_types
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 12. style_gallery_images RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view active gallery images" ON public.style_gallery_images;
DROP POLICY IF EXISTS "Admins can manage gallery images" ON public.style_gallery_images;
DROP POLICY IF EXISTS "Subscribers and Admins can view all gallery images" ON public.style_gallery_images;

CREATE POLICY "Everyone can view active gallery images" ON public.style_gallery_images
  FOR SELECT USING (is_active = true);

CREATE POLICY "Subscribers and Admins can view all gallery images" ON public.style_gallery_images
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'subscriber') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage gallery images" ON public.style_gallery_images
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));


-- 13. site_settings RLS Policies Audit & Lockdown
DROP POLICY IF EXISTS "Everyone can view settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON public.site_settings;

CREATE POLICY "Everyone can view settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
