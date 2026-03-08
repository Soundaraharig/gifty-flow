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