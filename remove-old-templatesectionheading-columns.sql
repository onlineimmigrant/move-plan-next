-- ============================================================================
-- Remove Old Columns from website_templatesectionheading Table
-- ============================================================================
-- This migration removes the old individual columns that have been migrated
-- to JSONB structure (content, translations, style)
--
-- IMPORTANT: Only run this AFTER verifying that all data has been successfully
-- migrated to the JSONB columns and your application is working correctly.
--
-- Columns to be removed:
-- - name, name_part_2, name_part_3 (moved to content.title)
-- - description_text (moved to content.description)
-- - button_text, button_url, button_is_text_link (moved to content.button_*)
-- - image (moved to content.image)
-- - background_color (moved to style.background_color)
-- - title_color, title_size, title_font, title_weight (moved to style.title_*)
-- - description_color, description_size, description_font, description_weight (moved to style.description_*)
-- - button_color, button_text_color (moved to style.button_*)
-- - alignment, image_first, image_style (moved to style.*)
-- - gradient_enabled, gradient_config (moved to style.*)
-- - Translation fields (moved to translations JSONB)
-- ============================================================================

-- Step 1: Verify data migration (check that no records have NULL JSONB fields)
-- Uncomment to check before dropping columns:
-- SELECT COUNT(*) as total_records,
--        COUNT(*) FILTER (WHERE content IS NULL) as null_content,
--        COUNT(*) FILTER (WHERE translations IS NULL) as null_translations,
--        COUNT(*) FILTER (WHERE style IS NULL) as null_style
-- FROM website_templatesectionheading;

-- Step 2: Drop old content-related columns
ALTER TABLE website_templatesectionheading
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS name_part_2,
  DROP COLUMN IF EXISTS name_part_3,
  DROP COLUMN IF EXISTS description_text,
  DROP COLUMN IF EXISTS button_text,
  DROP COLUMN IF EXISTS button_url,
  DROP COLUMN IF EXISTS button_is_text_link,
  DROP COLUMN IF EXISTS image;

-- Step 3: Drop old style-related columns
ALTER TABLE website_templatesectionheading
  DROP COLUMN IF EXISTS background_color,
  DROP COLUMN IF EXISTS title_color,
  DROP COLUMN IF EXISTS title_size,
  DROP COLUMN IF EXISTS title_font,
  DROP COLUMN IF EXISTS title_weight,
  DROP COLUMN IF EXISTS description_color,
  DROP COLUMN IF EXISTS description_size,
  DROP COLUMN IF EXISTS description_font,
  DROP COLUMN IF EXISTS description_weight,
  DROP COLUMN IF EXISTS button_color,
  DROP COLUMN IF EXISTS button_text_color,
  DROP COLUMN IF EXISTS alignment,
  DROP COLUMN IF EXISTS image_first,
  DROP COLUMN IF EXISTS image_style,
  DROP COLUMN IF EXISTS gradient_enabled,
  DROP COLUMN IF EXISTS gradient_config;

-- Step 4: Drop old translation columns
ALTER TABLE website_templatesectionheading
  DROP COLUMN IF EXISTS name_translation,
  DROP COLUMN IF EXISTS name_part_2_translation,
  DROP COLUMN IF EXISTS name_part_3_translation,
  DROP COLUMN IF EXISTS description_text_translation,
  DROP COLUMN IF EXISTS button_text_translation;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this after the migration to verify the table structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'website_templatesectionheading'
-- ORDER BY ordinal_position;
--
-- Expected remaining columns:
-- - id (integer)
-- - organization_id (text)
-- - url_page (text)
-- - order (integer)
-- - content (jsonb)
-- - translations (jsonb)
-- - style (jsonb)
-- - created_at (timestamp)
-- - updated_at (timestamp)
-- ============================================================================

-- Note: VACUUM must be run separately outside of a transaction block
-- Run this command separately in your SQL editor after the ALTER TABLE statements:
-- VACUUM FULL website_templatesectionheading;

COMMENT ON TABLE website_templatesectionheading IS 'Template heading sections with JSONB structure for content, translations, and styling. Old individual columns have been removed after migration.';
