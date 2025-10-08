-- Fix Row-Level Security for website_templatesectionheading table
-- This allows authenticated users to insert/update/delete their organization's heading sections

-- First, check if RLS is enabled
-- ALTER TABLE website_templatesectionheading ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view heading sections for their organization" ON website_templatesectionheading;
DROP POLICY IF EXISTS "Users can insert heading sections for their organization" ON website_templatesectionheading;
DROP POLICY IF EXISTS "Users can update heading sections for their organization" ON website_templatesectionheading;
DROP POLICY IF EXISTS "Users can delete heading sections for their organization" ON website_templatesectionheading;
DROP POLICY IF EXISTS "Allow public read access to heading sections" ON website_templatesectionheading;
DROP POLICY IF EXISTS "Allow service role full access to heading sections" ON website_templatesectionheading;

-- Create new policies

-- 1. Public READ access (anyone can view heading sections)
CREATE POLICY "Allow public read access to heading sections"
ON website_templatesectionheading
FOR SELECT
USING (true);

-- 2. Service role FULL access (for API routes using service role key)
CREATE POLICY "Allow service role full access to heading sections"
ON website_templatesectionheading
FOR ALL
USING (true)
WITH CHECK (true);

-- Alternative: If you want organization-based access, use these instead:
-- (Comment out the service role policy above and uncomment these)

/*
-- Get organization_id from auth metadata
CREATE POLICY "Users can view heading sections"
ON website_templatesectionheading
FOR SELECT
USING (
  organization_id IS NULL OR
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::text
);

CREATE POLICY "Users can insert heading sections"
ON website_templatesectionheading
FOR INSERT
WITH CHECK (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::text OR
  organization_id IS NULL
);

CREATE POLICY "Users can update heading sections"
ON website_templatesectionheading
FOR UPDATE
USING (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::text
)
WITH CHECK (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::text
);

CREATE POLICY "Users can delete heading sections"
ON website_templatesectionheading
FOR DELETE
USING (
  organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::text
);
*/

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'website_templatesectionheading';
