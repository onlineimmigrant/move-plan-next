-- Menu Icon Setup and Verification Script
-- Run this to check current icon assignments and set up test data

-- ============================================
-- STEP 1: Check current icon assignments
-- ============================================
SELECT 
  wm.id,
  wm.display_name,
  wm.menu_items_are_text,
  wm.react_icon_id,
  ri.icon_name,
  CASE 
    WHEN wm.menu_items_are_text = true THEN '📝 Text'
    WHEN wm.menu_items_are_text = false THEN '🎨 Icon'
    ELSE '📝 Text (default)'
  END as display_mode,
  CASE
    WHEN wm.menu_items_are_text = false AND ri.icon_name IS NULL THEN '⚠️ Missing Icon!'
    WHEN wm.menu_items_are_text = false AND ri.icon_name IS NOT NULL THEN '✅ Icon Assigned'
    ELSE '➖ N/A'
  END as status
FROM website_menuitem wm
LEFT JOIN react_icons ri ON wm.react_icon_id = ri.id
WHERE wm.is_displayed = true
ORDER BY wm.order;

-- ============================================
-- STEP 2: Check what icons exist in react_icons table
-- ============================================
SELECT id, icon_name 
FROM react_icons 
ORDER BY icon_name;

-- ============================================
-- STEP 3: Insert available icons if they don't exist
-- ============================================

-- Navigation & UI Icons
INSERT INTO react_icons (icon_name) 
VALUES 
  ('MapIcon'),
  ('HomeIcon'),
  ('Bars3Icon'),
  ('XMarkIcon'),
  ('PlusIcon'),
  ('MinusIcon')
ON CONFLICT (icon_name) DO NOTHING;

-- User & Auth Icons
INSERT INTO react_icons (icon_name) 
VALUES 
  ('UserIcon'),
  ('ArrowLeftOnRectangleIcon')
ON CONFLICT (icon_name) DO NOTHING;

-- Commerce Icons
INSERT INTO react_icons (icon_name) 
VALUES 
  ('ShoppingCartIcon'),
  ('BriefcaseIcon')
ON CONFLICT (icon_name) DO NOTHING;

-- Communication Icons
INSERT INTO react_icons (icon_name) 
VALUES 
  ('PhoneIcon'),
  ('EnvelopeIcon'),
  ('ChatBubbleLeftRightIcon')
ON CONFLICT (icon_name) DO NOTHING;

-- Content Icons
INSERT INTO react_icons (icon_name) 
VALUES 
  ('DocumentTextIcon'),
  ('NewspaperIcon'),
  ('InformationCircleIcon'),
  ('QuestionMarkCircleIcon')
ON CONFLICT (icon_name) DO NOTHING;

-- Organization Icons
INSERT INTO react_icons (icon_name) 
VALUES 
  ('BuildingOfficeIcon'),
  ('AcademicCapIcon')
ON CONFLICT (icon_name) DO NOTHING;

-- Settings & Global Icons
INSERT INTO react_icons (icon_name) 
VALUES 
  ('Cog6ToothIcon'),
  ('GlobeAltIcon')
ON CONFLICT (icon_name) DO NOTHING;

-- ============================================
-- STEP 4: Example - Assign icons to menu items
-- ============================================

-- Example 1: Set "Home" to display as icon with HomeIcon
UPDATE website_menuitem 
SET 
  menu_items_are_text = false,
  react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'HomeIcon')
WHERE display_name = 'Home';

-- Example 2: Set "About" to display as icon with UserIcon
UPDATE website_menuitem 
SET 
  menu_items_are_text = false,
  react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'UserIcon')
WHERE display_name = 'About';

-- Example 3: Set "Contact" to display as icon with PhoneIcon
UPDATE website_menuitem 
SET 
  menu_items_are_text = false,
  react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'PhoneIcon')
WHERE display_name = 'Contact';

-- Example 4: Set "Services" to display as text (no icon)
UPDATE website_menuitem 
SET 
  menu_items_are_text = true,
  react_icon_id = NULL
WHERE display_name = 'Services';

-- ============================================
-- STEP 5: Bulk Operations
-- ============================================

-- Set ALL menu items to display as text
-- UPDATE website_menuitem SET menu_items_are_text = true;

-- Set ALL menu items to display as icons (with MapIcon fallback)
-- UPDATE website_menuitem SET menu_items_are_text = false;

-- Clear all icon assignments
-- UPDATE website_menuitem SET react_icon_id = NULL;

-- ============================================
-- STEP 6: Verification Query (run after changes)
-- ============================================
SELECT 
  wm.display_name,
  wm.menu_items_are_text as show_as_text,
  ri.icon_name,
  wm.order,
  CASE 
    WHEN wm.menu_items_are_text = false AND ri.icon_name IS NOT NULL 
      THEN '✅ Will show: ' || ri.icon_name
    WHEN wm.menu_items_are_text = false AND ri.icon_name IS NULL 
      THEN '⚠️ Will show: MapIcon (fallback)'
    ELSE '📝 Will show: ' || wm.display_name || ' (text)'
  END as render_result
FROM website_menuitem wm
LEFT JOIN react_icons ri ON wm.react_icon_id = ri.id
WHERE wm.is_displayed = true
ORDER BY wm.order;

-- ============================================
-- STEP 7: Find items missing icons
-- ============================================
SELECT 
  wm.id,
  wm.display_name,
  'Missing icon assignment!' as issue,
  'UPDATE website_menuitem SET react_icon_id = (SELECT id FROM react_icons WHERE icon_name = ''YourIconName'') WHERE id = ' || wm.id || ';' as fix_sql
FROM website_menuitem wm
WHERE wm.menu_items_are_text = false 
  AND wm.react_icon_id IS NULL
  AND wm.is_displayed = true;

-- ============================================
-- COMMON ICON MAPPING SUGGESTIONS
-- ============================================

-- Home page → HomeIcon
-- About Us → UserIcon or InformationCircleIcon
-- Services → BriefcaseIcon or Cog6ToothIcon
-- Products → ShoppingCartIcon
-- Contact → PhoneIcon or EnvelopeIcon
-- Blog/News → NewspaperIcon
-- Support/Help → QuestionMarkCircleIcon
-- FAQ → QuestionMarkCircleIcon or InformationCircleIcon
-- Careers → BriefcaseIcon or BuildingOfficeIcon
-- Courses/Training → AcademicCapIcon
-- Location → MapIcon
-- Chat/Messages → ChatBubbleLeftRightIcon
-- Settings → Cog6ToothIcon
-- International → GlobeAltIcon

-- ============================================
-- QUICK TEST SETUP
-- ============================================

-- Uncomment and modify to quickly test different icons on your menu:

/*
-- Test 1: Show all as text
UPDATE website_menuitem SET menu_items_are_text = true WHERE organization_id = 'your-org-id';

-- Test 2: Show first 3 as icons, rest as text
UPDATE website_menuitem 
SET menu_items_are_text = false,
    react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'HomeIcon')
WHERE display_name = 'Home' AND organization_id = 'your-org-id';

UPDATE website_menuitem 
SET menu_items_are_text = false,
    react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'UserIcon')
WHERE display_name = 'About' AND organization_id = 'your-org-id';

UPDATE website_menuitem 
SET menu_items_are_text = false,
    react_icon_id = (SELECT id FROM react_icons WHERE icon_name = 'PhoneIcon')
WHERE display_name = 'Contact' AND organization_id = 'your-org-id';

-- Verify the test setup
SELECT display_name, menu_items_are_text, icon_name 
FROM website_menuitem wm
LEFT JOIN react_icons ri ON wm.react_icon_id = ri.id
WHERE organization_id = 'your-org-id'
ORDER BY wm.order;
*/
