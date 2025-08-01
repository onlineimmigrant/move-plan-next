-- Add is_site_creator field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_site_creator BOOLEAN DEFAULT false;

-- Update organizations table to ensure it has the correct structure
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'general' 
CHECK (type IN ('general', 'immigration', 'solicitor', 'finance', 'education', 'job', 'beauty', 'doctor', 'services'));

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS base_url_local VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_site_creator ON profiles(is_site_creator);

-- Insert a default general organization if none exists
INSERT INTO organizations (id, name, type, base_url, base_url_local, created_at)
SELECT 
  gen_random_uuid(),
  'Main Organization',
  'general',
  null,
  'http://localhost:3000',
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE type = 'general');

-- Update existing admin users to have site creation permissions
UPDATE profiles 
SET is_site_creator = true 
WHERE role = 'admin';

-- Update profiles to reference the general organization if they don't have one
UPDATE profiles 
SET organization_id = (SELECT id FROM organizations WHERE type = 'general' LIMIT 1)
WHERE role = 'admin' AND organization_id IS NULL;
