-- REALTIME VERIFICATION AND SETUP
-- Run this in Supabase SQL Editor to enable and verify realtime

-- ============================================
-- 1. VERIFY REALTIME PUBLICATION EXISTS
-- ============================================
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('tickets', 'ticket_responses');

-- If you don't see these tables, run the following:

-- ============================================
-- 2. ENABLE REALTIME FOR TICKETS TABLE
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_responses;

-- ============================================
-- 3. VERIFY IT WORKED
-- ============================================
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('tickets', 'ticket_responses');

-- Should see 2 rows:
-- public | tickets
-- public | ticket_responses

-- ============================================
-- 4. CHECK REALTIME SETTINGS IN SUPABASE DASHBOARD
-- ============================================
-- Go to: Database > Replication
-- Make sure "supabase_realtime" publication is enabled
-- Tables should show: tickets, ticket_responses

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If realtime still doesn't work, check:
-- 1. Is Realtime enabled in your Supabase project? (Project Settings > API)
-- 2. Are the RLS policies allowing reads? (SELECT policies must exist)
-- 3. Check browser console for connection errors
-- 4. Try removing and re-adding tables to publication:

-- ALTER PUBLICATION supabase_realtime DROP TABLE tickets;
-- ALTER PUBLICATION supabase_realtime DROP TABLE ticket_responses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
-- ALTER PUBLICATION supabase_realtime ADD TABLE ticket_responses;
