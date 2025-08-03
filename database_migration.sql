-- Step 1: Add Vercel deployment tracking fields to existing organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS vercel_project_id TEXT,
ADD COLUMN IF NOT EXISTS vercel_deployment_id TEXT,
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'not_deployed';

-- Add constraint to ensure valid deployment status values (drop first if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_organization_deployment_status' 
        AND table_name = 'organizations'
    ) THEN
        ALTER TABLE organizations 
        ADD CONSTRAINT check_organization_deployment_status 
        CHECK (deployment_status IN ('not_deployed', 'created', 'building', 'ready', 'error', 'canceled'));
    END IF;
END $$;

-- Step 2: Create deployments table for detailed tracking
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

-- Add constraint for deployment status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_deployment_status' 
        AND table_name = 'deployments'
    ) THEN
        ALTER TABLE deployments 
        ADD CONSTRAINT check_deployment_status 
        CHECK (status IN ('created', 'building', 'ready', 'error', 'canceled'));
    END IF;
END $$;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deployments_organization_id ON deployments(organization_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_deployment_status ON organizations(deployment_status);

-- Step 4: Enable Row Level Security (RLS) for deployments table
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for deployments table

-- Policy: Users can view deployments of their own organization or organizations they created
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

-- Policy: Only site creators can insert deployments
CREATE POLICY "Site creators can create deployments" ON deployments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_site_creator = true
    )
  );

-- Policy: Users can update deployments they created or for their organizations
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

-- Step 6: Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger to automatically update updated_at
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_deployments_updated_at'
    ) THEN
        CREATE TRIGGER update_deployments_updated_at 
          BEFORE UPDATE ON deployments 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Step 8: Add helpful comments for documentation
COMMENT ON TABLE deployments IS 'Tracks Vercel deployments for organizations';
COMMENT ON COLUMN deployments.vercel_project_id IS 'Vercel project ID';
COMMENT ON COLUMN deployments.vercel_deployment_id IS 'Vercel deployment ID';
COMMENT ON COLUMN deployments.project_name IS 'Generated project name for Vercel';
COMMENT ON COLUMN deployments.base_url IS 'Expected URL after deployment';
COMMENT ON COLUMN deployments.deployed_url IS 'Actual URL from Vercel after deployment';
COMMENT ON COLUMN deployments.status IS 'Deployment status: created, building, ready, error, canceled';

COMMENT ON COLUMN organizations.vercel_project_id IS 'Associated Vercel project ID';
COMMENT ON COLUMN organizations.vercel_deployment_id IS 'Latest Vercel deployment ID';
COMMENT ON COLUMN organizations.deployment_status IS 'Current deployment status';
