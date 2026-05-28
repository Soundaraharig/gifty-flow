-- Recreate the policies on storage.objects with robust LIKE patterns and UPDATE permissions
DROP POLICY IF EXISTS "Users can upload subscription screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view subscription screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own subscription screenshots" ON storage.objects;

-- 1. Allow authenticated users to INSERT screenshots into the 'subscriptions' folder
CREATE POLICY "Users can upload subscription screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND name LIKE 'subscriptions/%');

-- 2. Allow authenticated users to UPDATE screenshots in the 'subscriptions' folder (for upsert support)
CREATE POLICY "Users can update own subscription screenshots"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND name LIKE 'subscriptions/%')
WITH CHECK (bucket_id = 'product-images' AND name LIKE 'subscriptions/%');

-- 3. Allow anyone to view screenshots in the 'subscriptions' folder
CREATE POLICY "Public can view subscription screenshots"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images' AND name LIKE 'subscriptions/%');
