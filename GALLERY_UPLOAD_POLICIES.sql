-- Storage policies for gallery bucket uploads

-- 1. Allow INSERT (upload) for authenticated users
CREATE POLICY "Authenticated users can upload to gallery"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'gallery');

-- 2. Allow UPDATE for authenticated users (if needed for replacing files)
CREATE POLICY "Authenticated users can update gallery files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'gallery');

-- 3. Allow DELETE for authenticated users (for future delete functionality)
CREATE POLICY "Authenticated users can delete from gallery"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'gallery');

-- Note: The SELECT policy should already exist from previous setup:
-- CREATE POLICY "Public read access to gallery bucket"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'gallery');
