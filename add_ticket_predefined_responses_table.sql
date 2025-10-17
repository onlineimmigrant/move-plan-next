-- Migration: Add ticket_predefined_responses table for admin quick replies
-- This table stores predefined response templates that admins can use for common ticket replies

-- Create ticket_predefined_responses table
CREATE TABLE IF NOT EXISTS ticket_predefined_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique titles per organization
  CONSTRAINT unique_predefined_response_title_per_org UNIQUE (organization_id, title)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticket_predefined_responses_org_id 
  ON ticket_predefined_responses(organization_id);

-- Add RLS policies
ALTER TABLE ticket_predefined_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view predefined responses for their organization
CREATE POLICY "Admins can view predefined responses" 
  ON ticket_predefined_responses 
  FOR SELECT 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Admins can insert predefined responses for their organization
CREATE POLICY "Admins can insert predefined responses" 
  ON ticket_predefined_responses 
  FOR INSERT 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Admins can update predefined responses for their organization
CREATE POLICY "Admins can update predefined responses" 
  ON ticket_predefined_responses 
  FOR UPDATE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Admins can delete predefined responses for their organization
CREATE POLICY "Admins can delete predefined responses" 
  ON ticket_predefined_responses 
  FOR DELETE 
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add some default predefined responses (optional - remove if not needed)
-- These will be added for each organization separately

-- Example predefined responses for demonstration:
-- INSERT INTO ticket_predefined_responses (organization_id, title, message) 
-- VALUES 
--   ('your-org-id', 'Thank you', 'Thank you for contacting us. We have received your ticket and will respond shortly.'),
--   ('your-org-id', 'Under review', 'We are currently reviewing your request and will get back to you within 24 hours.'),
--   ('your-org-id', 'More info needed', 'Thank you for your inquiry. To better assist you, could you please provide more details about your issue?'),
--   ('your-org-id', 'Resolved', 'Your issue has been resolved. If you have any further questions, please don''t hesitate to reach out.');

COMMENT ON TABLE ticket_predefined_responses IS 'Stores predefined response templates for admins to use when replying to tickets';
COMMENT ON COLUMN ticket_predefined_responses.title IS 'Short title/label for the predefined response';
COMMENT ON COLUMN ticket_predefined_responses.message IS 'The full message template text';
