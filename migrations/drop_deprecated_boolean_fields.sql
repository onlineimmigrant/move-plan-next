-- Migration: Drop deprecated boolean fields from website_templatesection
-- Date: 2025-11-15
-- Purpose: Remove deprecated boolean columns that have been replaced by section_type
-- 
-- ⚠️ WARNING: DO NOT RUN THIS UNTIL:
-- 1. The data migration script (migrate_deprecated_boolean_fields_to_section_type.sql) has been run
-- 2. All data has been verified to use section_type correctly
-- 3. The new code has been deployed and tested in production
-- 4. You have a database backup
-- 
-- NOTE: is_slider is NOT being dropped - it's a layout modifier, not a content type

-- Step 1: Verify no records are using the old boolean fields
-- Run this first to check before dropping:

SELECT 
  COUNT(*) as total_records,
  SUM(CASE WHEN is_help_center_section = true THEN 1 ELSE 0 END) as help_center_count,
  SUM(CASE WHEN is_real_estate_modal = true THEN 1 ELSE 0 END) as real_estate_count,
  SUM(CASE WHEN is_brand = true THEN 1 ELSE 0 END) as brand_count,
  SUM(CASE WHEN is_article_slider = true THEN 1 ELSE 0 END) as article_slider_count,
  SUM(CASE WHEN is_contact_section = true THEN 1 ELSE 0 END) as contact_count,
  SUM(CASE WHEN is_faq_section = true THEN 1 ELSE 0 END) as faq_count,
  SUM(CASE WHEN is_pricingplans_section = true THEN 1 ELSE 0 END) as pricing_plans_count
FROM website_templatesection;

-- Expected output: All counts should be 0 (or matching section_type counts)

-- Step 2: Show records that would be affected
SELECT 
  id,
  section_title,
  section_type,
  is_help_center_section,
  is_real_estate_modal,
  is_brand,
  is_article_slider,
  is_contact_section,
  is_faq_section,
  is_pricingplans_section
FROM website_templatesection
WHERE 
  is_help_center_section = true OR
  is_real_estate_modal = true OR
  is_brand = true OR
  is_article_slider = true OR
  is_contact_section = true OR
  is_faq_section = true OR
  is_pricingplans_section = true
LIMIT 10;

-- Step 3: Drop the deprecated columns
-- ONLY run this after verifying Steps 1 and 2 show the migration is complete

-- Uncomment these lines to execute the column drops:
/*
ALTER TABLE website_templatesection
DROP COLUMN IF EXISTS is_help_center_section,
DROP COLUMN IF EXISTS is_real_estate_modal,
DROP COLUMN IF EXISTS is_brand,
DROP COLUMN IF EXISTS is_article_slider,
DROP COLUMN IF EXISTS is_contact_section,
DROP COLUMN IF EXISTS is_faq_section,
DROP COLUMN IF EXISTS is_pricingplans_section;
*/

-- Step 4: Verify the columns have been dropped
-- Run this after uncommenting and executing Step 3:

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'website_templatesection'
  AND column_name IN (
    'is_help_center_section',
    'is_real_estate_modal',
    'is_brand',
    'is_article_slider',
    'is_contact_section',
    'is_faq_section',
    'is_pricingplans_section',
    'is_slider',  -- Should still exist
    'section_type'  -- Should still exist
  )
ORDER BY column_name;

-- Expected output after drop: Only is_slider and section_type should be returned

-- Step 5: Verify table structure is correct
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE 
  table_schema = 'public' 
  AND table_name = 'website_templatesection'
ORDER BY ordinal_position;

-- Rollback Plan (if needed):
-- If you need to rollback, you can re-add the columns:
/*
ALTER TABLE website_templatesection
ADD COLUMN IF NOT EXISTS is_help_center_section boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_real_estate_modal boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_brand boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_article_slider boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_contact_section boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_faq_section boolean NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pricingplans_section boolean NULL DEFAULT false;

-- Then restore data from backup if you created one
*/
