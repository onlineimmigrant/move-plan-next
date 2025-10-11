-- Hero Background Fields Migration
-- Migrate old background fields to new background_style JSONB column

-- Step 1: Ensure background_style column exists (run hero_jsonb_migration.sql first if not done)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'website_hero'
        AND column_name = 'background_style'
    ) THEN
        RAISE EXCEPTION 'background_style column does not exist. Please run hero_jsonb_migration.sql first.';
    END IF;
END $$;

-- Step 2: Migrate existing background data to JSONB structure
UPDATE website_hero
SET background_style = jsonb_build_object(
    'color', COALESCE(background_color, 'white'),
    'gradient', CASE
        WHEN is_bg_gradient = true
        THEN jsonb_build_object(
            'from', COALESCE(background_color_gradient_from, 'transparent'),
            'via', COALESCE(background_color_gradient_via, 'transparent'),
            'to', COALESCE(background_color_gradient_to, 'transparent')
        )
        ELSE NULL
    END
)
WHERE background_color IS NOT NULL
   OR is_bg_gradient = true
   OR background_color_gradient_from IS NOT NULL
   OR background_color_gradient_to IS NOT NULL
   OR background_color_gradient_via IS NOT NULL;

-- Step 3: Optional - Drop old columns after verifying migration
-- WARNING: Only run this after confirming the migration worked correctly
-- Uncomment the lines below to remove old columns:

-- ALTER TABLE website_hero DROP COLUMN IF EXISTS background_color;
-- ALTER TABLE website_hero DROP COLUMN IF EXISTS background_color_gradient_from;
-- ALTER TABLE website_hero DROP COLUMN IF EXISTS background_color_gradient_to;
-- ALTER TABLE website_hero DROP COLUMN IF EXISTS background_color_gradient_via;
-- ALTER TABLE website_hero DROP COLUMN IF EXISTS is_bg_gradient;

-- Step 4: Verification query - check migration results
-- Run this query to verify the migration worked:
-- SELECT id, background_style FROM website_hero WHERE background_style IS NOT NULL LIMIT 5;

-- Step 4: Verification query - check migration results
-- Run this query to verify the migration worked:
-- SELECT id, background_style FROM website_hero WHERE background_style IS NOT NULL LIMIT 5;