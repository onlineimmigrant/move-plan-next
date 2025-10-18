-- Check RLS policies for tickets and ticket_responses
-- Run this to verify realtime has proper permissions

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('tickets', 'ticket_responses')
ORDER BY tablename, cmd;

-- You should see SELECT policies for both tables
-- If not, realtime won't work because it needs read access

-- Example of what you need:
-- tickets: SELECT policy for authenticated users
-- ticket_responses: SELECT policy for authenticated users
