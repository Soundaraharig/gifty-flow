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