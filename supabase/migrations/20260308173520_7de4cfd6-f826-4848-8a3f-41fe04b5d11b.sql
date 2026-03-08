
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
