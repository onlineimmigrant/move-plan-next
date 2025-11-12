-- Add viewed_by column to track which users have viewed each meeting
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS viewed_by JSONB DEFAULT '[]'::jsonb;

-- Add index for performance when querying unviewed meetings
CREATE INDEX IF NOT EXISTS idx_bookings_viewed_by 
ON bookings USING GIN (viewed_by);

-- Add comment for documentation
COMMENT ON COLUMN bookings.viewed_by IS 'Array of user IDs who have viewed this meeting';
