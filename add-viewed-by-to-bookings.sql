-- Add viewed_by column to bookings table to track which users have viewed each meeting
-- This enables the "NEW" badge functionality on meeting cards

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS viewed_by JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN bookings.viewed_by IS 'Array of user IDs who have viewed this booking. Used for "NEW" badge functionality.';

-- Create index for performance when querying unviewed meetings
CREATE INDEX IF NOT EXISTS idx_bookings_viewed_by ON bookings USING gin (viewed_by);
