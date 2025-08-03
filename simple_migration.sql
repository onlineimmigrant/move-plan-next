-- Simple version - Add columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
ADD COLUMN IF NOT EXISTS vercel_deployment_id TEXT,
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'not_deployed';

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vercel_project_id TEXT NOT NULL,
  vercel_deployment_id TEXT,
  project_name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  deployed_url TEXT,
  git_repository TEXT,
  git_branch TEXT DEFAULT 'main',
  status TEXT DEFAULT 'created',
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deployments_organization_id ON deployments(organization_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC);

-- Enable RLS
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Create policies (these will error if they exist, but that's ok)
CREATE POLICY "Users can view related deployments" ON deployments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT o.id FROM organizations o
      JOIN profiles p ON p.id = auth.uid()
      WHERE o.id = organization_id
      AND (
        p.organization_id = o.id 
        OR o.created_by_email = p.email
        OR p.role = 'admin'
      )
    )
  );

CREATE POLICY "Site creators can create deployments" ON deployments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_site_creator = true
    )
  );

CREATE POLICY "Users can update their deployments" ON deployments
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role = 'admin' OR p.is_site_creator = true)
      AND organization_id IN (
        SELECT o.id FROM organizations o
        WHERE o.id = deployments.organization_id
        AND (p.organization_id = o.id OR o.created_by_email = p.email)
      )
    )
  );
