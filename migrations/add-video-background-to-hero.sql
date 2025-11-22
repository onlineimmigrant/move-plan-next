-- Migration: Add video background support to website_hero
-- Date: 2025-11-22
-- Description: Adds fields to support video backgrounds in hero section

-- Add video-related columns to website_hero
ALTER TABLE website_hero
  ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_player TEXT CHECK (video_player IN ('youtube', 'vimeo', 'pexels', 'r2')),
  ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;

-- Add comments for documentation
COMMENT ON COLUMN website_hero.is_video IS 'Flag to indicate if hero uses video background instead of image';
COMMENT ON COLUMN website_hero.video_url IS 'Video URL or ID depending on platform (full URL for Pexels/R2, ID for YouTube/Vimeo)';
COMMENT ON COLUMN website_hero.video_player IS 'Video platform type: youtube, vimeo, pexels, or r2';
COMMENT ON COLUMN website_hero.video_thumbnail IS 'Optional thumbnail URL for video background';

-- Create index for video queries
CREATE INDEX IF NOT EXISTS idx_hero_video_background 
ON website_hero(organization_id, is_video) 
WHERE is_video = true;

-- Verification query
DO $$
BEGIN
  -- Check if columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_hero' AND column_name = 'is_video'
  ) THEN
    RAISE EXCEPTION 'website_hero.is_video column missing!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_hero' AND column_name = 'video_url'
  ) THEN
    RAISE EXCEPTION 'website_hero.video_url column missing!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_hero' AND column_name = 'video_player'
  ) THEN
    RAISE EXCEPTION 'website_hero.video_player column missing!';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_hero' AND column_name = 'video_thumbnail'
  ) THEN
    RAISE EXCEPTION 'website_hero.video_thumbnail column missing!';
  END IF;
  
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '  - website_hero.is_video';
  RAISE NOTICE '  - website_hero.video_url';
  RAISE NOTICE '  - website_hero.video_player';
  RAISE NOTICE '  - website_hero.video_thumbnail';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - Added 4 new columns to website_hero table';
  RAISE NOTICE '  - Created conditional index for video background queries';
  RAISE NOTICE '  - All columns support NULL values for backward compatibility';
END $$;
