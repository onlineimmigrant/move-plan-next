-- Update storage policies for chat-files bucket to support file sharing

-- Drop existing policies (we'll recreate them with sharing support)
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files OR files shared with them
CREATE POLICY "Users can view own and shared files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files' 
  AND (
    -- Own files
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Files shared with the user
    EXISTS (
      SELECT 1 FROM public.file_shares
      WHERE file_shares.file_path = name
      AND file_shares.shared_with_user_id = auth.uid()
      AND file_shares.is_active = TRUE
      AND (file_shares.expires_at IS NULL OR file_shares.expires_at > NOW())
    )
    OR
    -- Files in folders shared with the user
    EXISTS (
      SELECT 1 FROM public.file_shares
      WHERE file_shares.is_folder = TRUE
      AND name LIKE file_shares.file_path || '%'
      AND file_shares.shared_with_user_id = auth.uid()
      AND file_shares.is_active = TRUE
      AND (file_shares.expires_at IS NULL OR file_shares.expires_at > NOW())
    )
  )
);

-- Allow admins to view files in their organization
CREATE POLICY "Admins can view organization files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role IN ('admin', 'superadmin')
    AND (
      -- Superadmins can view all files
      admin_profile.role = 'superadmin'
      OR
      -- Admins can view files of users in their organization
      EXISTS (
        SELECT 1 FROM public.profiles AS file_owner
        WHERE file_owner.id::text = (storage.foldername(name))[1]
        AND file_owner.organization_id = admin_profile.organization_id
      )
    )
  )
);

-- Allow users to update/delete their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'chat-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users with edit permission on shared files to update them
CREATE POLICY "Users can update shared files with edit permission"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND EXISTS (
    SELECT 1 FROM public.file_shares
    WHERE file_shares.file_path = name
    AND file_shares.shared_with_user_id = auth.uid()
    AND file_shares.permission_type = 'edit'
    AND file_shares.is_active = TRUE
    AND (file_shares.expires_at IS NULL OR file_shares.expires_at > NOW())
  )
)
WITH CHECK (
  bucket_id = 'chat-files'
  AND EXISTS (
    SELECT 1 FROM public.file_shares
    WHERE file_shares.file_path = name
    AND file_shares.shared_with_user_id = auth.uid()
    AND file_shares.permission_type = 'edit'
    AND file_shares.is_active = TRUE
    AND (file_shares.expires_at IS NULL OR file_shares.expires_at > NOW())
  )
);

-- Admins can manage files in their organization
CREATE POLICY "Admins can manage organization files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role IN ('admin', 'superadmin')
    AND (
      admin_profile.role = 'superadmin'
      OR
      EXISTS (
        SELECT 1 FROM public.profiles AS file_owner
        WHERE file_owner.id::text = (storage.foldername(name))[1]
        AND file_owner.organization_id = admin_profile.organization_id
      )
    )
  )
)
WITH CHECK (
  bucket_id = 'chat-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.role IN ('admin', 'superadmin')
    AND (
      admin_profile.role = 'superadmin'
      OR
      EXISTS (
        SELECT 1 FROM public.profiles AS file_owner
        WHERE file_owner.id::text = (storage.foldername(name))[1]
        AND file_owner.organization_id = admin_profile.organization_id
      )
    )
  )
);

-- Allow service role full access (for cleanup jobs)
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'chat-files')
WITH CHECK (bucket_id = 'chat-files');
