
CREATE POLICY "Users can upload subscription screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'subscriptions');

CREATE POLICY "Public can view subscription screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'subscriptions');
