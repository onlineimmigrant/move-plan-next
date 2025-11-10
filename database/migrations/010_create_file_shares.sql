-- Create file_shares table for sharing files/folders between users
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL, -- Path to the file in storage (can be file or folder)
  file_name TEXT NOT NULL, -- Original filename for display
  is_folder BOOLEAN DEFAULT FALSE, -- Whether this is a folder share
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- Organization context
  permission_type TEXT NOT NULL CHECK (permission_type IN ('view', 'edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration date
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(file_path, shared_by_user_id, shared_with_user_id) -- Prevent duplicate shares
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON public.file_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by ON public.file_shares(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_organization ON public.file_shares(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_file_path ON public.file_shares(file_path);
CREATE INDEX IF NOT EXISTS idx_file_shares_active ON public.file_shares(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares they created
CREATE POLICY "Users can view their shared files"
ON public.file_shares FOR SELECT
TO authenticated
USING (
  auth.uid() = shared_by_user_id
);

-- Policy: Users can view files shared with them
CREATE POLICY "Users can view files shared with them"
ON public.file_shares FOR SELECT
TO authenticated
USING (
  auth.uid() = shared_with_user_id
  AND is_active = TRUE
  AND (expires_at IS NULL OR expires_at > NOW())
);

-- Policy: Admins can view all shares within their organization
CREATE POLICY "Admins can view organization shares"
ON public.file_shares FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' -- Superadmins see all
      OR profiles.organization_id = file_shares.organization_id -- Admins see their org
    )
  )
);

-- Policy: Users can create shares
CREATE POLICY "Users can create shares"
ON public.file_shares FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = shared_by_user_id
);

-- Policy: Admins can create shares for users in their organization
CREATE POLICY "Admins can create shares for their organization"
ON public.file_shares FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' -- Superadmins can share with anyone
      OR profiles.organization_id = file_shares.organization_id -- Admins share within org
    )
  )
);

-- Policy: Users can delete/update their own shares
CREATE POLICY "Users can manage their shares"
ON public.file_shares FOR ALL
TO authenticated
USING (
  auth.uid() = shared_by_user_id
)
WITH CHECK (
  auth.uid() = shared_by_user_id
);

-- Policy: Admins can manage shares within their organization
CREATE POLICY "Admins can manage organization shares"
ON public.file_shares FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin' -- Superadmins manage all
      OR profiles.organization_id = file_shares.organization_id -- Admins manage their org
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
    AND (
      profiles.role = 'superadmin'
      OR profiles.organization_id = file_shares.organization_id
    )
  )
);

-- Policy: Service role has full access
CREATE POLICY "Service role full access"
ON public.file_shares FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- Create function to automatically clean up expired shares
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.file_shares
  SET is_active = FALSE
  WHERE expires_at IS NOT NULL
  AND expires_at < NOW()
  AND is_active = TRUE;
END;
$$;

-- Create a scheduled job to run cleanup (requires pg_cron extension)
-- This is optional and depends on whether pg_cron is available
-- COMMENT: To enable automatic cleanup, run:
-- SELECT cron.schedule('cleanup-expired-shares', '0 * * * *', 'SELECT public.cleanup_expired_shares()');
