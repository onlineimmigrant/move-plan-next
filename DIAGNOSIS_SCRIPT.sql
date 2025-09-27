-- =====================================================
-- DIAGNOSIS SCRIPT - Run this first to see what tables exist
-- =====================================================
-- Go to: https://supabase.com/dashboard/project/rgbmdfaoowqbgshjuwwm/sql
-- Run this to see your current database structure
-- =====================================================

-- Check what tables exist
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check organizations table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there's a profiles table (Supabase default)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check auth.users structure (Supabase built-in)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;
