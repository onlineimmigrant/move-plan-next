-- Migration: Adjust menu_items_are_text and rename footer_color to footer_style
-- Date: 2025-10-12
-- Description: 
--   1. Add menu_items_are_text column to website_menuitem table
--   2. Rename footer_color to footer_style in settings table
--   3. Migrate menu_items_are_text data from settings to website_menuitem

-- Step 1: Add menu_items_are_text to website_menuitem table
ALTER TABLE website_menuitem 
ADD COLUMN IF NOT EXISTS menu_items_are_text BOOLEAN DEFAULT false;

COMMENT ON COLUMN website_menuitem.menu_items_are_text IS 'Whether menu items should display as text only (no icons) for this organization';

-- Step 2: Migrate menu_items_are_text from settings to website_menuitem
-- Update all menu items for each organization with the setting from settings table
UPDATE website_menuitem wm
SET menu_items_are_text = s.menu_items_are_text
FROM settings s
WHERE wm.organization_id = s.organization_id
  AND s.menu_items_are_text IS NOT NULL;

-- Step 3: Rename footer_color to footer_style in settings table
ALTER TABLE settings 
RENAME COLUMN footer_color TO footer_style;

COMMENT ON COLUMN settings.footer_style IS 'Footer style/color preference for the organization (e.g., gray-800, neutral-900)';

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_website_menuitem_menu_items_text 
ON website_menuitem(organization_id, menu_items_are_text) 
WHERE menu_items_are_text IS NOT NULL;

-- Verification queries (run these manually to check):
-- SELECT organization_id, COUNT(*), menu_items_are_text 
-- FROM website_menuitem 
-- GROUP BY organization_id, menu_items_are_text 
-- ORDER BY organization_id;

-- SELECT organization_id, footer_style 
-- FROM settings 
-- WHERE footer_style IS NOT NULL;
