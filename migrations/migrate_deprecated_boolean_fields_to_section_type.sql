-- Migration: Migrate deprecated boolean fields to section_type
-- Date: 2025-11-15
-- Purpose: Convert old boolean flags (is_help_center_section, is_brand, etc.) to section_type field
-- 
-- IMPORTANT: Run this BEFORE dropping the boolean columns
-- IMPORTANT: This is a data migration - review changes before running in production

-- Step 1: Backup current state (for rollback purposes)
-- You can create a backup table if needed:
-- CREATE TABLE website_templatesection_backup AS SELECT * FROM website_templatesection;

-- Step 2: Update section_type based on boolean flags
-- Only update records where section_type is NULL or 'general' and a boolean flag is TRUE

UPDATE website_templatesection
SET section_type = 
  CASE 
    WHEN is_help_center_section = true THEN 'help_center'
    WHEN is_real_estate_modal = true THEN 'real_estate'
    WHEN is_brand = true THEN 'brand'
    WHEN is_article_slider = true THEN 'article_slider'
    WHEN is_contact_section = true THEN 'contact'
    WHEN is_faq_section = true THEN 'faq'
    WHEN is_pricingplans_section = true THEN 'pricing_plans'
    ELSE COALESCE(section_type, 'general')
  END
WHERE 
  (section_type IS NULL OR section_type = 'general')
  AND (
    is_help_center_section = true OR
    is_real_estate_modal = true OR
    is_brand = true OR
    is_article_slider = true OR
    is_contact_section = true OR
    is_faq_section = true OR
    is_pricingplans_section = true
  );

-- Step 3: Set section_type to 'general' for any remaining NULL values
UPDATE website_templatesection
SET section_type = 'general'
WHERE section_type IS NULL;

-- Step 4: Verification queries
-- Run these to verify the migration was successful

-- Check the distribution of section_types
SELECT 
  section_type,
  COUNT(*) as count
FROM website_templatesection
GROUP BY section_type
ORDER BY count DESC;

-- Check for any records that still have both section_type and old boolean flags set
SELECT 
  id,
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
  is_pricingplans_section = true;

-- Check for any NULL section_type values (should be 0)
SELECT COUNT(*) as null_section_types
FROM website_templatesection
WHERE section_type IS NULL;

-- Step 5: Make section_type NOT NULL (optional - only after verifying migration)
-- Uncomment this after verifying all data is migrated correctly:
-- ALTER TABLE website_templatesection 
-- ALTER COLUMN section_type SET NOT NULL;
-- ALTER TABLE website_templatesection 
-- ALTER COLUMN section_type SET DEFAULT 'general';
