-- Create helper function for subscriber check
CREATE OR REPLACE FUNCTION public.has_role_any(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- RLS for editing_styles
CREATE POLICY "Subscribers can insert styles"
ON public.editing_styles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'subscriber'::app_role));

CREATE POLICY "Subscribers can update styles"
ON public.editing_styles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- RLS for frame_materials
CREATE POLICY "Subscribers can manage materials"
ON public.frame_materials FOR ALL TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- RLS for frame_colors
CREATE POLICY "Subscribers can manage colors"
ON public.frame_colors FOR ALL TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- RLS for sizes
CREATE POLICY "Subscribers can manage sizes"
ON public.sizes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- RLS for resin_product_types
CREATE POLICY "Subscribers can manage resin types"
ON public.resin_product_types FOR ALL TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- RLS for orders - view all
CREATE POLICY "Subscribers can view all orders"
ON public.orders FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- RLS for addons
CREATE POLICY "Subscribers can manage addons"
ON public.addons FOR ALL TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- RLS for style_gallery_images
CREATE POLICY "Subscribers can manage gallery images"
ON public.style_gallery_images FOR ALL TO authenticated
USING (has_role(auth.uid(), 'subscriber'::app_role));

-- Add subscriber_phone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscriber_phone text;