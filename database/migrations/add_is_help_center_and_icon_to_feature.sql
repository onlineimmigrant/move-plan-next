-- Migration: Add is_help_center and icon columns to feature table
-- This enables features to be marked for display in the help center and have custom icons

-- Add the is_help_center column if it doesn't exist
ALTER TABLE feature 
ADD COLUMN IF NOT EXISTS is_help_center BOOLEAN DEFAULT false;

-- Add the icon column if it doesn't exist (stores HeroIcon name)
ALTER TABLE feature 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_feature_is_help_center ON feature(is_help_center);

-- Add comments for documentation
COMMENT ON COLUMN feature.is_help_center IS 'Flag to indicate if this feature should be featured in the help center';
COMMENT ON COLUMN feature.icon IS 'Name of the HeroIcon to display (e.g., RocketLaunchIcon, SparklesIcon)';

-- Example: Update specific features to be featured in help center
-- Uncomment and modify as needed for your features:
/*
UPDATE feature 
SET is_help_center = true,
    icon = 'RocketLaunchIcon'
WHERE slug IN ('your-feature-slug-1', 'your-feature-slug-2');
*/

-- Verify the changes
-- SELECT 
--   id,
--   name,
--   slug,
--   icon,
--   is_help_center,
--   created_at
-- FROM feature 
-- WHERE is_help_center = true;
