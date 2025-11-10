-- Create table for users to virtually organize shared files into their own folders
-- This allows recipients to organize shared files without moving the actual files
-- Run this in your SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own shared file organization" ON public.shared_file_organization;
DROP POLICY IF EXISTS "Users can manage their own shared file organization" ON public.shared_file_organization;
DROP POLICY IF EXISTS "Service role full access on shared file organization" ON public.shared_file_organization;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_shared_file_org_updated_at_trigger ON public.shared_file_organization;
DROP FUNCTION IF EXISTS public.update_shared_file_org_updated_at();

-- Create table (will skip if exists)
CREATE TABLE IF NOT EXISTS public.shared_file_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_share_id UUID NOT NULL REFERENCES public.file_shares(id) ON DELETE CASCADE,
  virtual_folder TEXT, -- User's virtual folder path (null = root in shared view)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, file_share_id) -- One organization per user per shared file
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_file_org_user ON public.shared_file_organization(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_file_org_share ON public.shared_file_organization(file_share_id);
CREATE INDEX IF NOT EXISTS idx_shared_file_org_folder ON public.shared_file_organization(virtual_folder);

-- Enable RLS
ALTER TABLE public.shared_file_organization ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own organization
CREATE POLICY "Users can view their own shared file organization"
ON public.shared_file_organization FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can manage their own organization
CREATE POLICY "Users can manage their own shared file organization"
ON public.shared_file_organization FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access on shared file organization"
ON public.shared_file_organization FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_shared_file_org_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_shared_file_org_updated_at_trigger
BEFORE UPDATE ON public.shared_file_organization
FOR EACH ROW
EXECUTE FUNCTION public.update_shared_file_org_updated_at();
