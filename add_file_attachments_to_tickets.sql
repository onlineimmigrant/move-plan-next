-- Migration: Add file attachments support to ticket system
-- Creates ticket_attachments table to store file metadata and references to Supabase Storage

-- Create ticket_attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  response_id UUID REFERENCES ticket_responses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT NOT NULL, -- Size in bytes
  file_type TEXT NOT NULL, -- MIME type (image/png, application/pdf, etc.)
  uploaded_by UUID NOT NULL, -- User ID who uploaded the file
  uploaded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id 
ON ticket_attachments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_response_id 
ON ticket_attachments(response_id);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_uploaded_by 
ON ticket_attachments(uploaded_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_attachments_updated_at
  BEFORE UPDATE ON ticket_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_attachments_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view attachments for their own tickets
CREATE POLICY "Users can view their own ticket attachments"
  ON ticket_attachments
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE customer_id = auth.uid()
    )
  );

-- RLS Policy: Admins can view all attachments
CREATE POLICY "Admins can view all ticket attachments"
  ON ticket_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Users can upload attachments to their own tickets
CREATE POLICY "Users can upload attachments to their tickets"
  ON ticket_attachments
  FOR INSERT
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM tickets 
      WHERE customer_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- RLS Policy: Admins can upload attachments to any ticket
CREATE POLICY "Admins can upload attachments to any ticket"
  ON ticket_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    AND uploaded_by = auth.uid()
  );

-- RLS Policy: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON ticket_attachments
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- RLS Policy: Admins can delete any attachment
CREATE POLICY "Admins can delete any attachment"
  ON ticket_attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add comments to document the table
COMMENT ON TABLE ticket_attachments IS 
  'Stores metadata for files attached to tickets and ticket responses';

COMMENT ON COLUMN ticket_attachments.file_path IS 
  'Path in Supabase Storage bucket (format: ticket_id/response_id/filename)';

COMMENT ON COLUMN ticket_attachments.file_size IS 
  'File size in bytes (max 10MB enforced in application)';

COMMENT ON COLUMN ticket_attachments.file_type IS 
  'MIME type for file validation and display (image/*, application/pdf, etc.)';

-- Storage bucket setup instructions (run in Supabase SQL Editor or Dashboard)
COMMENT ON TABLE ticket_attachments IS 
  'STORAGE BUCKET SETUP:
   1. Create bucket named "ticket-attachments" in Supabase Storage
   2. Set public: false (private bucket)
   3. File size limit: 10485760 bytes (10MB)
   4. Allowed MIME types: image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*, text/plain
   
   Storage RLS Policies needed:
   - Users can upload to their ticket folders
   - Users can view files from their ticket folders
   - Admins can upload/view all files
   - Users can delete their own files
   - Admins can delete any files';
