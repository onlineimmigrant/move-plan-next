-- ============================================================================
-- Migration: Add display_order and menu management columns
-- Purpose: Enable drag-and-drop page layout management
-- Date: 2025-10-14
-- ============================================================================

-- =========================
-- PART 1: Add display_order to website_hero
-- =========================

-- Add display_order column to website_hero if it doesn't exist
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
-- PART 2: Ensure display_order exists on other tables
-- =========================

-- Template sections (should already exist, but ensure it's there)
ALTER TABLE template_sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 100;

-- Update any NULL values
UPDATE template_sections 
SET display_order = 100 
WHERE display_order IS NULL;

-- Create/update index
DROP INDEX IF EXISTS idx_template_sections_order;
CREATE INDEX idx_template_sections_order 
ON template_sections(organization_id, display_order);

COMMENT ON COLUMN template_sections.display_order IS 'Controls section order on page (lower numbers appear first)';

-- Template heading sections (should already exist)
ALTER TABLE template_heading_sections 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 50;

-- Update any NULL values
UPDATE template_heading_sections 
SET display_order = 50 
WHERE display_order IS NULL;

-- Create/update index
DROP INDEX IF EXISTS idx_template_heading_sections_order;
CREATE INDEX idx_template_heading_sections_order 
ON template_heading_sections(organization_id, display_order);

COMMENT ON COLUMN template_heading_sections.display_order IS 'Controls heading section order on page (lower numbers appear first)';

-- Blog posts (may need display_order for homepage display)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 200;

-- Update any NULL values
UPDATE blog_posts 
SET display_order = 200 
WHERE display_order IS NULL;

-- Create index (only for published posts)
DROP INDEX IF EXISTS idx_blog_posts_display_order;
CREATE INDEX idx_blog_posts_display_order 
ON blog_posts(organization_id, display_order) 
WHERE is_published = TRUE;

COMMENT ON COLUMN blog_posts.display_order IS 'Controls post order when displayed on homepage (lower numbers appear first)';

-- =========================
-- PART 3: Ensure menu management columns exist
-- =========================

-- Add is_footer column to website_menuitem if missing
ALTER TABLE website_menuitem 
ADD COLUMN IF NOT EXISTS is_footer BOOLEAN DEFAULT FALSE;

-- Update existing menus (assume all current items are header menus)
UPDATE website_menuitem 
SET is_footer = FALSE 
WHERE is_footer IS NULL;

-- Create index for filtering header vs footer menus
DROP INDEX IF EXISTS idx_menuitem_footer;
CREATE INDEX idx_menuitem_footer 
ON website_menuitem(organization_id, is_footer, "order");

COMMENT ON COLUMN website_menuitem.is_footer IS 'true = footer menu item, false = header menu item';

-- Ensure menu_items_are_text column exists
ALTER TABLE website_menuitem 
ADD COLUMN IF NOT EXISTS menu_items_are_text BOOLEAN;

COMMENT ON COLUMN website_menuitem.menu_items_are_text IS 'true = display as text, false = display as icon, NULL = use global setting';

-- Ensure react_icon_id column exists
ALTER TABLE website_menuitem 
ADD COLUMN IF NOT EXISTS react_icon_id INTEGER REFERENCES react_icons(id);

COMMENT ON COLUMN website_menuitem.react_icon_id IS 'Foreign key to react_icons table for icon display';

-- Ensure order column exists (for menu item ordering)
ALTER TABLE website_menuitem 
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Update any NULL values
UPDATE website_menuitem 
SET "order" = 0 
WHERE "order" IS NULL;

-- Create index for ordering
DROP INDEX IF EXISTS idx_menuitem_order;
CREATE INDEX idx_menuitem_order 
ON website_menuitem(organization_id, "order");

COMMENT ON COLUMN website_menuitem."order" IS 'Display order of menu items (lower numbers appear first)';

-- =========================
-- PART 4: Ensure submenu management columns exist
-- =========================

-- Ensure order column exists in website_submenuitem
ALTER TABLE website_submenuitem 
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Update any NULL values
UPDATE website_submenuitem 
SET "order" = 0 
WHERE "order" IS NULL;

-- Create index for ordering submenus
DROP INDEX IF EXISTS idx_submenuitem_order;
CREATE INDEX idx_submenuitem_order 
ON website_submenuitem(menu_item_id, "order");

COMMENT ON COLUMN website_submenuitem."order" IS 'Display order of submenu items within parent menu (lower numbers appear first)';

-- =========================
-- PART 5: Default display_order values (initial setup)
-- =========================

-- Set logical default orders for existing content
-- This helps ensure a sensible initial layout

-- Heroes at the top (0-9)
UPDATE website_hero 
SET display_order = 0 
WHERE display_order IS NULL OR display_order = 0;

-- Heading sections (10-49)
UPDATE template_heading_sections 
SET display_order = COALESCE(display_order, 10) 
WHERE display_order < 10 OR display_order IS NULL;

-- Template sections (50-199)
-- Assign based on type for logical grouping
UPDATE template_sections 
SET display_order = CASE 
  WHEN type = 'brands' THEN 50
  WHEN type = 'features' THEN 60
  WHEN type = 'pricing' THEN 70
  WHEN type = 'testimonials' THEN 80
  WHEN type = 'faqs' THEN 90
  WHEN type = 'help_center' THEN 100
  ELSE COALESCE(display_order, 100)
END
WHERE display_order IS NULL OR display_order = 0;

-- Blog posts (200+)
UPDATE blog_posts 
SET display_order = 200 
WHERE display_order IS NULL OR display_order = 0;

-- =========================
-- PART 6: Create helper functions (optional)
-- =========================

-- Function to get next available display_order for a section type
CREATE OR REPLACE FUNCTION get_next_display_order(
  p_organization_id UUID,
  p_table_name TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_max_order INTEGER;
BEGIN
  EXECUTE format('SELECT COALESCE(MAX(display_order), 0) + 10 FROM %I WHERE organization_id = $1', p_table_name)
  INTO v_max_order
  USING p_organization_id;
  
  RETURN v_max_order;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_display_order IS 'Returns next available display_order value for a given table and organization (increments of 10)';

-- Function to reorder sections (update display_order sequentially)
CREATE OR REPLACE FUNCTION reorder_sections(
  p_organization_id UUID,
  p_section_ids UUID[],
  p_table_name TEXT
)
RETURNS VOID AS $$
DECLARE
  v_id UUID;
  v_order INTEGER := 0;
BEGIN
  FOREACH v_id IN ARRAY p_section_ids
  LOOP
    EXECUTE format('UPDATE %I SET display_order = $1 WHERE id = $2 AND organization_id = $3', p_table_name)
    USING v_order, v_id, p_organization_id;
    
    v_order := v_order + 10; -- Increment by 10 for flexibility
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reorder_sections IS 'Updates display_order for multiple sections in sequence (increments of 10)';

-- =========================
-- PART 7: Verification queries
-- =========================

-- Check that all tables have display_order columns
DO $$
BEGIN
  -- website_hero
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_hero' AND column_name = 'display_order'
  ) THEN
    RAISE EXCEPTION 'website_hero.display_order column missing!';
  END IF;
  
  -- template_sections
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_sections' AND column_name = 'display_order'
  ) THEN
    RAISE EXCEPTION 'template_sections.display_order column missing!';
  END IF;
  
  -- template_heading_sections
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_heading_sections' AND column_name = 'display_order'
  ) THEN
    RAISE EXCEPTION 'template_heading_sections.display_order column missing!';
  END IF;
  
  -- website_menuitem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'website_menuitem' AND column_name = 'is_footer'
  ) THEN
    RAISE EXCEPTION 'website_menuitem.is_footer column missing!';
  END IF;
  
  RAISE NOTICE 'Migration verification passed! All required columns exist.';
END $$;

-- =========================
-- PART 8: Sample data verification
-- =========================

-- Query to check current display_order distribution
-- (Uncomment to run manually)

/*
SELECT 
  'website_hero' as table_name,
  COUNT(*) as total_rows,
  MIN(display_order) as min_order,
  MAX(display_order) as max_order,
  AVG(display_order) as avg_order
FROM website_hero
WHERE display_order IS NOT NULL

UNION ALL

SELECT 
  'template_sections' as table_name,
  COUNT(*) as total_rows,
  MIN(display_order) as min_order,
  MAX(display_order) as max_order,
  AVG(display_order) as avg_order
FROM template_sections
WHERE display_order IS NOT NULL

UNION ALL

SELECT 
  'template_heading_sections' as table_name,
  COUNT(*) as total_rows,
  MIN(display_order) as min_order,
  MAX(display_order) as max_order,
  AVG(display_order) as avg_order
FROM template_heading_sections
WHERE display_order IS NOT NULL

UNION ALL

SELECT 
  'blog_posts' as table_name,
  COUNT(*) as total_rows,
  MIN(display_order) as min_order,
  MAX(display_order) as max_order,
  AVG(display_order) as avg_order
FROM blog_posts
WHERE display_order IS NOT NULL
ORDER BY table_name;
*/

-- =========================
-- MIGRATION COMPLETE
-- =========================

-- Summary
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Added/verified columns:';
  RAISE NOTICE '  - website_hero.display_order';
  RAISE NOTICE '  - template_sections.display_order';
  RAISE NOTICE '  - template_heading_sections.display_order';
  RAISE NOTICE '  - blog_posts.display_order';
  RAISE NOTICE '  - website_menuitem.is_footer';
  RAISE NOTICE '  - website_menuitem.menu_items_are_text';
  RAISE NOTICE '  - website_menuitem.react_icon_id';
  RAISE NOTICE '  - website_menuitem.order';
  RAISE NOTICE '  - website_submenuitem.order';
  RAISE NOTICE '';
  RAISE NOTICE 'Created indexes for performance optimization';
  RAISE NOTICE 'Created helper functions:';
  RAISE NOTICE '  - get_next_display_order()';
  RAISE NOTICE '  - reorder_sections()';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Implement HeaderEditModal';
  RAISE NOTICE '  2. Implement FooterEditModal';
  RAISE NOTICE '  3. Implement LayoutManagerModal';
  RAISE NOTICE '============================================';
END $$;
