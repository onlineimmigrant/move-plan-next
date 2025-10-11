-- Add animation_element column to website_hero table
-- This column stores the animation component name for hero sections

ALTER TABLE website_hero
ADD COLUMN IF NOT EXISTS animation_element TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN website_hero.animation_element IS 'Animation component name (e.g., "DotGrid", "LetterGlitch", "MagicBento") for hero section background animations';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_website_hero_animation_element ON website_hero (animation_element);

-- Verification query - check that column was added
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'website_hero' AND column_name = 'animation_element';