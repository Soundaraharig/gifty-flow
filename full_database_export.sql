-- ============================================
-- ZERO GIFT - Full Database Export
-- Generated: 2026-03-20
-- ============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'subscriber');

-- 2. TABLES

CREATE TABLE public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.editing_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.frame_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  hex text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.frame_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  image_url text,
  stock integer NOT NULL DEFAULT 10
);

CREATE TABLE public.sizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  dimensions text,
  price integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  subscriber_phone text
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.resin_product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  image_url text,
  price integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.style_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  editing_style_id uuid NOT NULL REFERENCES public.editing_styles(id),
  image_url text NOT NULL,
  title text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  address text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  editing_style_id uuid REFERENCES public.editing_styles(id),
  size_id uuid REFERENCES public.sizes(id),
  frame_material_id uuid REFERENCES public.frame_materials(id),
  frame_color_id uuid REFERENCES public.frame_colors(id),
  addon_ids uuid[] DEFAULT '{}'::uuid[],
  total_price integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'cod',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  screenshot_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. FUNCTIONS

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_role_any(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 4. TRIGGERS (attach to auth.users after setup)
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- CREATE TRIGGER on_auth_user_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- 5. SEED DATA

-- Addons
INSERT INTO public.addons (id, slug, name, price, emoji, sort_order, is_active) VALUES
('f270a103-98e3-42e9-ab38-c399de104ecb','gift-wrap','Gift Wrap',30,'🎁',1,true),
('a26fc81a-7976-4008-82e6-c6ff9f353be6','express-delivery','Express Delivery',60,'🚀',2,true);

-- Editing Styles
INSERT INTO public.editing_styles (id, slug, name, description, price, image_url, sort_order, is_active) VALUES
('5eb1aa50-91d2-422a-8a57-add6923c2e5c','pop-out','3D Pop-Out Collage','Can''t decide which photo is your favorite? You don''t have to. Our 3D Pop-Out Collage blends your most cherished memories into a single, high-depth piece of art.',80,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772966861491.jpg',0,true),
('fcfdb199-2866-4e5c-8fb2-0b117cd35bff','solo','Solo','EDITS FOR ONE PERSON PHOTOS',80,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772989677149.jpg',1,true),
('fcb12251-fbd6-478e-b4a0-bf6d59fde58e','mosaic-collage','Mosaic Collage','Beautiful mosaic pattern',100,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772989720406.jpg',2,true),
('a94875f2-8cfe-449f-94cd-2aad37207b91','heart-collage','Heart collage','It''s not just a frame; it''s a timeline of your love and milestones.',80,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772966871770.jpg',3,true),
('1bfd8dcc-1c8d-4ddc-852c-cf4a043a3b4f','ink-mash','INK Mash','dynamic INK spread with colour',80,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772990110083.jpg',4,true),
('8fde3a0e-1fca-4c77-8455-ef6a65eee52a','collage','Collage','mash up of all photo into collage',80,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772990235606.jpg',5,true),
('4bd49818-c97b-46c2-92aa-8835ea08137d','trend-collage','Trend collage','treanding collage mash up with dark theme to save love memories',100,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772990613480.jpg',6,true),
('462733ec-b6a1-4c16-a167-49a5066fe298','farewell-collage','Farewell collage','College life and friendships are temporary, but memories shouldn''t be. Our Farewell Special Edit is designed to turn years of laughter, late-night canteens, and classroom memories into a premium physical keepsake.',150,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772990335925.jpg',7,true),
('652f8999-503b-46b2-80e0-e4cb7533da24','num-collage','Number Collage','collage with number like Age ,DATE,..',80,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1772991369210.jpg',8,true),
('354181f4-7f97-4e48-b66b-ce6caa33c2be','spotify-edit','Spotify Edits','Image edit with you fav songs',80,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/styles/1773070631921.jpg',0,true);

-- Frame Colors
INSERT INTO public.frame_colors (id, slug, name, hex, sort_order, is_active) VALUES
('8e6c8e04-1856-4196-bd79-00221eb6629b','black','Black','#1a1a1a',1,true),
('512eb9c3-00f6-420c-ae00-8274252fc0f8','white','White','#f5f5f5',2,true),
('794e7923-ef32-4e19-a387-a79e393ceffb','gold','Gold','#c5a44e',3,true);

-- Frame Materials
INSERT INTO public.frame_materials (id, slug, name, price, sort_order, is_active, image_url, stock) VALUES
('27c6e5f6-0741-4e25-96eb-e821ab30aa49','brown1','Brown',0,1,true,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/materials/1772980388183.jpg',10),
('7ee974bd-d5f8-4c22-9b01-dd909907b322','black','black',0,2,true,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/materials/1772980409081.jpg',10),
('9d31d71b-1e1d-4af6-a8c3-fb3801057b57','brxgd','brownxgold',0,3,true,'https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/materials/1772980437526.jpg',10);

-- Sizes
INSERT INTO public.sizes (id, slug, name, dimensions, price, sort_order, is_active) VALUES
('7681d26f-cc91-4545-8d63-1b1e2bc2eb0b','a6','A6','4 x 6 inch',140,0,true),
('6bd1173b-d6ce-4203-afbf-eef582b1b4a1','a5','A5','6 x 8 inch',200,1,true),
('9058dff7-900b-490c-9414-1f23d85bf051','a4','A4','8 x 12 inch',350,2,true),
('e40bbed2-167f-4f65-9a8b-c757757b2ee8','a3','A3','12 x 18 inch',720,3,true),
('65c7cbaf-ecd8-46c5-8044-4c707b64f6ee','a2','A2','16 x 24 inch',999,4,true);

-- Site Settings
INSERT INTO public.site_settings (key, value) VALUES
('store_name','Zero GIFT'),
('admin_whatsapp','917603814898'),
('currency_symbol','₹'),
('min_order_amount','0'),
('upi_id','soundarahari@fam'),
('upi_qr_image','https://ysrtgucmohaoyyvvjwxb.supabase.co/storage/v1/object/public/product-images/settings/1773069144963.png');

-- Resin Product Types
INSERT INTO public.resin_product_types (id, name, slug, description, price, sort_order, is_active) VALUES
('5ad6b6be-2a0e-454a-8c16-0ab288c09868','Resin Coasters','resin-coasters','Beautiful handcrafted resin coasters with custom designs',499,0,true),
('6e101afb-a104-44ab-8c55-c712d583a5a2','Resin Keychains','resin-keychains','Personalized resin keychains with embedded art',299,1,true),
('ac1a0dfe-dac5-4560-a815-876d2067507e','Resin Trays','resin-trays','Elegant serving trays with stunning resin art finish',1299,2,true),
('df35a868-1f2f-41f7-8c09-2572c91ac520','Resin Bookmarks','resin-bookmarks','Unique resin bookmarks with floral and glitter designs',199,3,true),
('ca1c595a-9261-4506-91a2-51df20d0ee08','Resin Phone Grips','resin-phone-grips','Custom resin phone grips with your favorite colors',349,4,true),
('84a474b2-605c-4e55-9b6b-46bf5fc80e72','Resin Wall Clocks','resin-wall-clocks','Statement wall clocks with mesmerizing resin art',1999,5,true);

-- 6. RLS POLICIES (enable RLS on all tables first)
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editing_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resin_product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_requests ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Everyone can view active addons" ON public.addons FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Everyone can view active styles" ON public.editing_styles FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Everyone can view active colors" ON public.frame_colors FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Everyone can view active materials" ON public.frame_materials FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Everyone can view active sizes" ON public.sizes FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Everyone can view settings" ON public.site_settings FOR SELECT TO public USING (true);
CREATE POLICY "Everyone can view active resin types" ON public.resin_product_types FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Everyone can view active gallery images" ON public.style_gallery_images FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT TO public USING (true);

-- Admin policies
CREATE POLICY "Admins can manage addons" ON public.addons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all styles" ON public.editing_styles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert styles" ON public.editing_styles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update styles" ON public.editing_styles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete styles" ON public.editing_styles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage colors" ON public.frame_colors FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage materials" ON public.frame_materials FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage sizes" ON public.sizes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage settings" ON public.site_settings FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage resin types" ON public.resin_product_types FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage gallery images" ON public.style_gallery_images FOR ALL TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO public USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all subscription requests" ON public.subscription_requests FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subscription requests" ON public.subscription_requests FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subscription requests" ON public.subscription_requests FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Subscriber policies
CREATE POLICY "Subscribers can manage addons" ON public.addons FOR ALL TO authenticated USING (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can insert styles" ON public.editing_styles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can update styles" ON public.editing_styles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can manage colors" ON public.frame_colors FOR ALL TO authenticated USING (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can manage materials" ON public.frame_materials FOR ALL TO authenticated USING (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can manage sizes" ON public.sizes FOR ALL TO authenticated USING (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can manage resin types" ON public.resin_product_types FOR ALL TO authenticated USING (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can manage gallery images" ON public.style_gallery_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'subscriber'));
CREATE POLICY "Subscribers can view all orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'subscriber'));

-- User self-access policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own addresses" ON public.customer_addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.customer_addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.customer_addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.customer_addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create own subscription requests" ON public.subscription_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own subscription requests" ON public.subscription_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 7. STORAGE BUCKET
-- Create a public bucket called "product-images" in your new Supabase dashboard

-- ============================================
-- NOTE: Image URLs reference the OLD Supabase project.
-- You will need to re-upload images to your new project's storage
-- and update the URLs in the database.
-- ============================================
