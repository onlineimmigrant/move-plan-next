-- Enable Realtime for bookings table
-- This allows the useUnreadMeetingsCount hook to subscribe to booking changes

-- Add bookings table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Note: You may also need to enable realtime in the Supabase Dashboard:
-- 1. Go to Database → Publications
-- 2. Find the 'supabase_realtime' publication
-- 3. Ensure 'bookings' table is listed
-- 
-- Or check Settings → API → Realtime and ensure the bookings table is enabled
