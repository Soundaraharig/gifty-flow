-- Drop existing credit storage policies if any
DROP POLICY IF EXISTS "Users can upload credits screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own credits screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view credits screenshots" ON storage.objects;

-- 1. Allow authenticated users to INSERT screenshots into the 'credits' folder
CREATE POLICY "Users can upload credits screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND name LIKE 'credits/%');

-- 2. Allow authenticated users to UPDATE screenshots in the 'credits' folder (for upsert support)
CREATE POLICY "Users can update own credits screenshots"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND name LIKE 'credits/%')
WITH CHECK (bucket_id = 'product-images' AND name LIKE 'credits/%');

-- 3. Allow anyone to view screenshots in the 'credits' folder
CREATE POLICY "Public can view credits screenshots"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'product-images' AND name LIKE 'credits/%');
