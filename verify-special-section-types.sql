-- ============================================================
-- VERIFICATION SCRIPT: Special Section Types
-- Run this in Supabase SQL Editor to verify implementation
-- ============================================================

-- 1. Verify new columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'website_templatesection'
  AND column_name IN (
    'is_brand', 
    'is_article_slider', 
    'is_contact_section', 
    'is_faq_section',
    'is_slider',
    'is_help_center_section',
    'is_real_estate_modal'
  )
ORDER BY column_name;

-- Expected output: 7 rows (4 new + 3 existing)
-- All should be: data_type = boolean, is_nullable = YES

-- ============================================================

-- 2. Check existing data
SELECT 
  id,
  section_title,
  url_page,
  is_slider,
  is_help_center_section,
  is_real_estate_modal,
  is_brand,
  is_article_slider,
  is_contact_section,
  is_faq_section
FROM website_templatesection
ORDER BY url_page, "order";

-- Shows all sections with their special type flags

-- ============================================================

-- 3. Test: Create a test section with new field
INSERT INTO website_templatesection (
  section_title,
  url_page,
  organization_id,
  is_brand,
  "order"
) VALUES (
  'Test Brand Section',
  '/test-page',
  (SELECT id FROM organizations LIMIT 1),
  true,
  999
)
RETURNING id, section_title, is_brand;

-- Expected: Returns inserted row with is_brand = true

-- ============================================================

-- 4. Test: Update existing section
-- UPDATE website_templatesection
-- SET is_article_slider = true
-- WHERE id = [your_section_id]
-- RETURNING id, section_title, is_article_slider;

-- ============================================================

-- 5. Clean up test data
DELETE FROM website_templatesection
WHERE section_title = 'Test Brand Section';

-- ============================================================

-- 6. Count sections by special type
SELECT 
  'slider' as type,
  COUNT(*) as count
FROM website_templatesection
WHERE is_slider = true

UNION ALL

SELECT 
  'help_center' as type,
  COUNT(*) as count
FROM website_templatesection
WHERE is_help_center_section = true

UNION ALL

SELECT 
  'real_estate' as type,
  COUNT(*) as count
FROM website_templatesection
WHERE is_real_estate_modal = true

UNION ALL

SELECT 
  'brands' as type,
  COUNT(*) as count
FROM website_templatesection
WHERE is_brand = true

UNION ALL

SELECT 
  'article_slider' as type,
  COUNT(*) as count
FROM website_templatesection
WHERE is_article_slider = true

UNION ALL

SELECT 
  'contact' as type,
  COUNT(*) as count
FROM website_templatesection
WHERE is_contact_section = true

UNION ALL

SELECT 
  'faq' as type,
  COUNT(*) as count
FROM website_templatesection
WHERE is_faq_section = true

ORDER BY type;

-- Shows distribution of special section types

-- ============================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================
