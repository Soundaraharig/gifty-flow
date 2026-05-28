-- Allow authenticated Admins and Subscribers to upload files in the 'video-frames' folder
DROP POLICY IF EXISTS "Admins and Subscribers can upload video frame assets" ON storage.objects;
CREATE POLICY "Admins and Subscribers can upload video frame assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND 
  name LIKE 'video-frames/%' AND 
  (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'subscriber'::public.app_role)
  )
);

-- Allow authenticated Admins and Subscribers to update files in the 'video-frames' folder (for upsert support)
DROP POLICY IF EXISTS "Admins and Subscribers can update video frame assets" ON storage.objects;
CREATE POLICY "Admins and Subscribers can update video frame assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images' AND 
  name LIKE 'video-frames/%' AND 
  (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'subscriber'::public.app_role)
  )
)
WITH CHECK (
  bucket_id = 'product-images' AND 
  name LIKE 'video-frames/%' AND 
  (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'subscriber'::public.app_role)
  )
);

-- Allow authenticated Admins and Subscribers to delete their files in the 'video-frames' folder
DROP POLICY IF EXISTS "Admins and Subscribers can delete video frame assets" ON storage.objects;
CREATE POLICY "Admins and Subscribers can delete video frame assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images' AND 
  name LIKE 'video-frames/%' AND 
  (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR 
    public.has_role(auth.uid(), 'subscriber'::public.app_role)
  )
);
