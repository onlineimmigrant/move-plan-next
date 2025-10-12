-- Rollback Migration: Revert menu_items_are_text and footer_style changes
-- Date: 2025-10-12
-- Description: Rollback script for menu_items_text_footer_style migration

-- Step 1: Rename footer_style back to footer_color in settings table
ALTER TABLE settings 
RENAME COLUMN footer_style TO footer_color;

COMMENT ON COLUMN settings.footer_color IS 'Footer color preference for the organization';

-- Step 2: Remove menu_items_are_text from website_menuitem table
-- Note: This will lose the data, but we can restore from settings if needed
ALTER TABLE website_menuitem 
DROP COLUMN IF EXISTS menu_items_are_text;

-- Step 3: Drop the index
DROP INDEX IF EXISTS idx_website_menuitem_menu_items_text;

-- Verification: Check that columns are back to original state
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'settings' AND column_name LIKE '%footer%';

-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'website_menuitem' AND column_name LIKE '%menu_items%';
