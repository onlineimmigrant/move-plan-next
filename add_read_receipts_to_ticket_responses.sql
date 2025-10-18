-- Migration: Add read receipts to ticket_responses
-- Adds is_read and read_at columns to track when messages are read

-- Add is_read column (defaults to false for new messages)
ALTER TABLE ticket_responses 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Add read_at timestamp column
ALTER TABLE ticket_responses 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Update existing responses to mark them as read (optional - can be removed if you want to track from now on)
UPDATE ticket_responses 
SET is_read = true, read_at = created_at 
WHERE is_read IS NULL;

-- Add index for better query performance when checking unread messages
CREATE INDEX IF NOT EXISTS idx_ticket_responses_is_read 
ON ticket_responses(ticket_id, is_read) 
WHERE is_read = false;

-- Add comment to document the feature
COMMENT ON COLUMN ticket_responses.is_read IS 
  'Indicates whether the message has been read by the recipient (customer or admin)';

COMMENT ON COLUMN ticket_responses.read_at IS 
  'Timestamp when the message was marked as read by the recipient';
