-- Migration: Enhance AI Chat Histories
-- Date: 2025-11-05
-- Description: Adds bookmarked flag, timestamps, and auto-cleanup for 180-day retention

-- =====================================================
-- 1. Add new columns to ai_chat_histories table
-- =====================================================

-- Add bookmarked flag
ALTER TABLE ai_chat_histories 
ADD COLUMN IF NOT EXISTS bookmarked BOOLEAN DEFAULT false;

-- Add created_at timestamp (if not exists)
ALTER TABLE ai_chat_histories 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add updated_at timestamp (if not exists)
ALTER TABLE ai_chat_histories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing records to have timestamps if they don't have them
UPDATE ai_chat_histories 
SET created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now()),
    bookmarked = COALESCE(bookmarked, false);

-- Make timestamps NOT NULL after setting defaults
ALTER TABLE ai_chat_histories 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL,
ALTER COLUMN bookmarked SET NOT NULL;

-- =====================================================
-- 2. Create trigger to auto-update updated_at
-- =====================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_ai_chat_histories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_updated_at ON ai_chat_histories;

-- Create the trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON ai_chat_histories
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_chat_histories_updated_at();

-- =====================================================
-- 3. Create function to cleanup old chats (180 days)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_chat_histories()
RETURNS void AS $$
BEGIN
  -- Delete non-bookmarked chats older than 180 days
  DELETE FROM ai_chat_histories
  WHERE bookmarked = false
    AND created_at < (now() - INTERVAL '180 days');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. Create indexes for better query performance
-- =====================================================

-- Index for sorting by updated_at (most common query)
CREATE INDEX IF NOT EXISTS idx_ai_chat_histories_updated_at 
  ON ai_chat_histories(user_id, updated_at DESC);

-- Index for bookmarked chats
CREATE INDEX IF NOT EXISTS idx_ai_chat_histories_bookmarked 
  ON ai_chat_histories(user_id, bookmarked) 
  WHERE bookmarked = true;

-- Index for created_at (for date-based queries)
CREATE INDEX IF NOT EXISTS idx_ai_chat_histories_created_at 
  ON ai_chat_histories(user_id, created_at DESC);

-- =====================================================
-- 5. Optional: Create cron job for automatic cleanup
-- =====================================================
-- Note: This requires pg_cron extension
-- Run this manually or set up pg_cron in your Supabase instance:
-- 
-- SELECT cron.schedule(
--   'cleanup-old-chats',
--   '0 2 * * *', -- Run at 2 AM daily
--   $$ SELECT cleanup_old_chat_histories(); $$
-- );

-- =====================================================
-- Verification queries (run separately to check results)
-- =====================================================
-- SELECT id, name, bookmarked, created_at, updated_at FROM ai_chat_histories ORDER BY updated_at DESC LIMIT 10;
-- SELECT COUNT(*) as total, SUM(CASE WHEN bookmarked THEN 1 ELSE 0 END) as bookmarked_count FROM ai_chat_histories;
