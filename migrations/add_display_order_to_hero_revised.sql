-- ============================================================================
-- Migration: Add display_order to website_hero (REVISED)
-- Purpose: Enable drag-and-drop page layout management
-- Date: 2025-10-14
-- Note: Only adding display_order to hero - all other fields already exist
-- ============================================================================

-- =========================
-- PART 1: Add display_order to website_hero
-- =========================

-- Add display_order column if it doesn't exist
ALTER TABLE website_hero 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Set initial values (heroes typically come first on page)
UPDATE website_hero 
SET display_order = 0 
WHERE display_order IS NULL OR display_order = 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_hero_display_order 
ON website_hero(organization_id, display_order);

-- Add comment for documentation
COMMENT ON COLUMN website_hero.display_order IS 'Controls the order of hero section on page (0 = first, lower numbers appear higher on page)';

-- =========================
-- PART 2: Verify existing fields
-- =========================

DO $$
DECLARE
  v_missing_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check website_templatesection.order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_templatesection' AND column_name = 'order'
  ) THEN
    v_missing_fields := array_append(v_missing_fields, 'website_templatesection.order');
  END IF;
  
  -- Check website_templatesectionheading.order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_templatesectionheading' AND column_name = 'order'
  ) THEN
    v_missing_fields := array_append(v_missing_fields, 'website_templatesectionheading.order');
  END IF;
  
  -- Check website_menuitem.order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_menuitem' AND column_name = 'order'
  ) THEN
    v_missing_fields := array_append(v_missing_fields, 'website_menuitem.order');
  END IF;
  
  -- Check website_menuitem.is_displayed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_menuitem' AND column_name = 'is_displayed'
  ) THEN
    v_missing_fields := array_append(v_missing_fields, 'website_menuitem.is_displayed');
  END IF;
  
  -- Check website_menuitem.is_displayed_on_footer
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_menuitem' AND column_name = 'is_displayed_on_footer'
  ) THEN
    v_missing_fields := array_append(v_missing_fields, 'website_menuitem.is_displayed_on_footer');
  END IF;
  
  -- Check website_hero.display_order (just added)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_hero' AND column_name = 'display_order'
  ) THEN
    v_missing_fields := array_append(v_missing_fields, 'website_hero.display_order');
  END IF;
  
  -- Report results
  IF array_length(v_missing_fields, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required fields: %', array_to_string(v_missing_fields, ', ');
  ELSE
    RAISE NOTICE '✅ All required fields verified:';
    RAISE NOTICE '   - website_hero.display_order (ADDED)';
    RAISE NOTICE '   - website_templatesection.order (EXISTS)';
    RAISE NOTICE '   - website_templatesectionheading.order (EXISTS)';
    RAISE NOTICE '   - website_menuitem.order (EXISTS)';
    RAISE NOTICE '   - website_menuitem.is_displayed (EXISTS)';
    RAISE NOTICE '   - website_menuitem.is_displayed_on_footer (EXISTS)';
  END IF;
END $$;

-- =========================
-- PART 3: Set logical default orders for existing content
-- =========================

-- Set logical default orders to ensure sensible initial layout
-- This helps provide a good starting point for the Layout Manager

-- Heroes at the top (0-9)
UPDATE website_hero 
SET display_order = 0 
WHERE display_order IS NULL OR display_order = 0;

-- Heading sections get order 10-49 (if not already set)
UPDATE website_templatesectionheading 
SET "order" = 10 
WHERE "order" IS NULL OR "order" = 0;

-- Template sections get order 50+ based on type
-- Only update if order is NULL or 0 (don't override existing orders)
UPDATE website_templatesection 
SET "order" = CASE 
  WHEN is_brand THEN 50
  WHEN is_faq_section THEN 90
  WHEN is_help_center_section THEN 100
  WHEN is_pricingplans_section THEN 70
  WHEN is_contact_section THEN 110
  ELSE 100
END
WHERE "order" IS NULL OR "order" = 0;

-- =========================
-- PART 4: Create helper function for getting next order
-- =========================

CREATE OR REPLACE FUNCTION get_next_display_order(
  p_organization_id UUID,
  p_table_name TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_max_order INTEGER;
  v_column_name TEXT;
BEGIN
  -- Determine which column to use
  IF p_table_name = 'website_hero' THEN
    v_column_name := 'display_order';
  ELSE
    v_column_name := 'order';
  END IF;
  
  -- Get max order value
  EXECUTE format(
    'SELECT COALESCE(MAX(%I), 0) + 10 FROM %I WHERE organization_id = $1',
    v_column_name,
    p_table_name
  )
  INTO v_max_order
  USING p_organization_id;
  
  RETURN v_max_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_display_order IS 'Returns next available order value for a given table and organization (increments of 10)';

-- =========================
-- PART 5: Create indexes for performance
-- =========================

-- Index for website_templatesection.order (if doesn't exist)
CREATE INDEX IF NOT EXISTS idx_website_templatesection_order 
ON website_templatesection(organization_id, "order");

-- Index for website_templatesectionheading.order (if doesn't exist)
CREATE INDEX IF NOT EXISTS idx_website_templatesectionheading_order 
ON website_templatesectionheading(organization_id, "order");

-- Index for website_menuitem ordering
CREATE INDEX IF NOT EXISTS idx_website_menuitem_order 
ON website_menuitem(organization_id, "order");

-- Index for website_menuitem filtering (header menus)
CREATE INDEX IF NOT EXISTS idx_website_menuitem_displayed 
ON website_menuitem(organization_id, is_displayed) 
WHERE is_displayed = TRUE;

-- Index for website_menuitem filtering (footer menus)
CREATE INDEX IF NOT EXISTS idx_website_menuitem_footer 
ON website_menuitem(organization_id, is_displayed_on_footer) 
WHERE is_displayed_on_footer = TRUE;

-- =========================
-- PART 6: Verification queries
-- =========================

-- Query to check current order distribution
DO $$
DECLARE
  v_hero_count INTEGER;
  v_template_count INTEGER;
  v_heading_count INTEGER;
BEGIN
  -- Count records with order values
  SELECT COUNT(*) INTO v_hero_count 
  FROM website_hero WHERE display_order IS NOT NULL;
  
  SELECT COUNT(*) INTO v_template_count 
  FROM website_templatesection WHERE "order" IS NOT NULL;
  
  SELECT COUNT(*) INTO v_heading_count 
  FROM website_templatesectionheading WHERE "order" IS NOT NULL;
  
  RAISE NOTICE '📊 Current order distribution:';
  RAISE NOTICE '   - Hero sections: % records with display_order', v_hero_count;
  RAISE NOTICE '   - Template sections: % records with order', v_template_count;
  RAISE NOTICE '   - Heading sections: % records with order', v_heading_count;
END $$;

-- =========================
-- MIGRATION COMPLETE
-- =========================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Summary:';
  RAISE NOTICE '   Added: website_hero.display_order';
  RAISE NOTICE '   Verified: website_templatesection.order';
  RAISE NOTICE '   Verified: website_templatesectionheading.order';
  RAISE NOTICE '   Verified: website_menuitem.order';
  RAISE NOTICE '   Verified: website_menuitem.is_displayed';
  RAISE NOTICE '   Verified: website_menuitem.is_displayed_on_footer';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Indexes created:';
  RAISE NOTICE '   - idx_hero_display_order';
  RAISE NOTICE '   - idx_website_templatesection_order';
  RAISE NOTICE '   - idx_website_templatesectionheading_order';
  RAISE NOTICE '   - idx_website_menuitem_order';
  RAISE NOTICE '   - idx_website_menuitem_displayed';
  RAISE NOTICE '   - idx_website_menuitem_footer';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Helper functions:';
  RAISE NOTICE '   - get_next_display_order()';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 Next steps:';
  RAISE NOTICE '   1. Create /api/menu-items route';
  RAISE NOTICE '   2. Create /api/page-layout route';
  RAISE NOTICE '   3. Implement HeaderEditModal';
  RAISE NOTICE '   4. Implement FooterEditModal';
  RAISE NOTICE '   5. Implement LayoutManagerModal';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
END $$;

-- =========================
-- SAMPLE QUERIES (for testing)
-- =========================

-- Uncomment to test:

/*
-- View current page layout
SELECT 
  'hero' as section_type,
  id,
  h1_title as title,
  display_order,
  organization_id
FROM website_hero
WHERE organization_id = 'YOUR_ORG_ID'

UNION ALL

SELECT 
  'template_section' as section_type,
  id,
  section_title as title,
  "order" as display_order,
  organization_id
FROM website_templatesection
WHERE organization_id = 'YOUR_ORG_ID'

UNION ALL

SELECT 
  'heading_section' as section_type,
  id,
  title,
  "order" as display_order,
  organization_id
FROM website_templatesectionheading
WHERE organization_id = 'YOUR_ORG_ID'

ORDER BY display_order, section_type;
*/

/*
-- View header menu items
SELECT 
  id,
  display_name,
  url_name,
  "order",
  is_displayed,
  is_displayed_on_footer
FROM website_menuitem
WHERE organization_id = 'YOUR_ORG_ID'
  AND is_displayed = TRUE
ORDER BY "order";
*/

/*
-- View footer menu items
SELECT 
  id,
  display_name,
  url_name,
  "order",
  is_displayed,
  is_displayed_on_footer
FROM website_menuitem
WHERE organization_id = 'YOUR_ORG_ID'
  AND is_displayed_on_footer = TRUE
ORDER BY "order";
*/
