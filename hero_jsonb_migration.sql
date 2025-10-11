-- Hero Table JSONB Migration
-- Add JSONB columns for consolidated hero styling

-- Add JSONB columns to website_hero table
ALTER TABLE website_hero
ADD COLUMN IF NOT EXISTS title_style JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS description_style JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS image_style JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS background_style JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS button_style JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN website_hero.title_style IS 'JSONB object containing title styling properties (color, alignment, blockWidth, blockColumns, etc.)';
COMMENT ON COLUMN website_hero.description_style IS 'JSONB object containing description styling properties (color, size, weight, etc.)';
COMMENT ON COLUMN website_hero.image_style IS 'JSONB object containing image styling properties (position, size, etc.)';
COMMENT ON COLUMN website_hero.background_style IS 'JSONB object containing background styling properties (color, video, animation, etc.)';
COMMENT ON COLUMN website_hero.button_style IS 'JSONB object containing button styling properties (url, aboveDescription, isVideo, etc.)';

-- Create indexes for JSONB columns for better query performance
CREATE INDEX IF NOT EXISTS idx_website_hero_title_style ON website_hero USING gin (title_style);
CREATE INDEX IF NOT EXISTS idx_website_hero_description_style ON website_hero USING gin (description_style);
CREATE INDEX IF NOT EXISTS idx_website_hero_image_style ON website_hero USING gin (image_style);
CREATE INDEX IF NOT EXISTS idx_website_hero_background_style ON website_hero USING gin (background_style);
CREATE INDEX IF NOT EXISTS idx_website_hero_button_style ON website_hero USING gin (button_style);