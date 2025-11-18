-- Enable pg_net extension for HTTP requests from database
-- Run this in Supabase SQL Editor

-- Step 1: Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Verify extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- That's it! The trigger function now has the URL and secret hardcoded.
-- If you need to update them, edit the function in setup-r2-cors-auto-sync.sql
