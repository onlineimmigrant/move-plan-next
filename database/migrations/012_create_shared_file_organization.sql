-- Create table for users to virtually organize shared files into their own folders
-- This allows recipients to organize shared files without moving the actual files

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

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shared_file_organization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER shared_file_organization_updated_at
BEFORE UPDATE ON public.shared_file_organization
FOR EACH ROW
EXECUTE FUNCTION update_shared_file_organization_updated_at();

-- Comment
COMMENT ON TABLE public.shared_file_organization IS 'Allows users to virtually organize shared files into folders without moving the actual files';
COMMENT ON COLUMN public.shared_file_organization.virtual_folder IS 'User-defined virtual folder path for organizing shared files in their view';
