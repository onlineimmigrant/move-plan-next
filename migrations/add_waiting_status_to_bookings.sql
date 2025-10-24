-- Migration: Add 'waiting' status to bookings
-- Purpose: Enable waiting room functionality where customers wait for host approval
-- Created: 2025-10-22

-- Add 'waiting' to the status check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('scheduled', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show'));

-- Add waiting_since timestamp to track when customer entered waiting room
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS waiting_since TIMESTAMP WITH TIME ZONE;

-- Add approved_by to track which host approved entry
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- Add approved_at timestamp
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add rejected_by to track rejections
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id);

-- Add rejected_at timestamp
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

-- Add rejection_reason
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index for waiting status queries
CREATE INDEX IF NOT EXISTS idx_bookings_waiting_status ON bookings(status, waiting_since) 
  WHERE status = 'waiting';

-- Comment
COMMENT ON COLUMN bookings.waiting_since IS 'Timestamp when customer entered waiting room';
COMMENT ON COLUMN bookings.approved_by IS 'User ID of host who approved entry from waiting room';
COMMENT ON COLUMN bookings.approved_at IS 'Timestamp when host approved entry';
COMMENT ON COLUMN bookings.rejected_by IS 'User ID of host who rejected entry';
COMMENT ON COLUMN bookings.rejected_at IS 'Timestamp when host rejected entry';
COMMENT ON COLUMN bookings.rejection_reason IS 'Reason provided by host for rejection';
