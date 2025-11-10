-- Remove virtual folder organization feature
-- Run this in your SQL editor

-- Drop trigger first
DROP TRIGGER IF EXISTS update_shared_file_org_updated_at_trigger ON public.shared_file_organization;

-- Drop function
DROP FUNCTION IF EXISTS public.update_shared_file_org_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "Users can view their own shared file organization" ON public.shared_file_organization;
DROP POLICY IF EXISTS "Users can manage their own shared file organization" ON public.shared_file_organization;
DROP POLICY IF EXISTS "Service role full access on shared file organization" ON public.shared_file_organization;

-- Drop table
DROP TABLE IF EXISTS public.shared_file_organization;
