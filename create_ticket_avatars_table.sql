-- Migration: Create ticket_avatars table for custom support avatars
-- This allows organizations to create custom avatars for ticket responses

-- Create ticket_avatars table
CREATE TABLE IF NOT EXISTS ticket_avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_ticket_avatars_organization_id ON ticket_avatars(organization_id);
CREATE INDEX IF NOT EXISTS idx_ticket_avatars_created_at ON ticket_avatars(created_at);

-- Enable RLS
ALTER TABLE ticket_avatars ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_avatars
-- Admins can view avatars in their organization
CREATE POLICY "Admins can view organization avatars"
  ON ticket_avatars
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can insert avatars for their organization
CREATE POLICY "Admins can create organization avatars"
  ON ticket_avatars
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can update avatars in their organization
CREATE POLICY "Admins can update organization avatars"
  ON ticket_avatars
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can delete avatars in their organization
CREATE POLICY "Admins can delete organization avatars"
  ON ticket_avatars
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_ticket_avatars_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_avatars_updated_at
  BEFORE UPDATE ON ticket_avatars
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_avatars_updated_at();

-- Enable realtime for ticket_avatars
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_avatars;

-- Add comments
COMMENT ON TABLE ticket_avatars IS 'Custom avatars for ticket responses per organization';
COMMENT ON COLUMN ticket_avatars.title IS 'Display title for the avatar (e.g., "Support Agent")';
COMMENT ON COLUMN ticket_avatars.full_name IS 'Optional full name (e.g., "John Doe")';
COMMENT ON COLUMN ticket_avatars.image IS 'URL to avatar image in storage (max 2MB)';
