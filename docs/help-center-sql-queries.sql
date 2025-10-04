-- Quick Reference: Help Center Content Management SQL

-- ============================================
-- VIEW HELP CENTER ITEMS
-- ============================================

-- View all Help Center articles
SELECT 
  id, 
  title, 
  help_center_order, 
  help_center_category,
  created_on
FROM blog_post
WHERE is_help_center = true
ORDER BY help_center_order ASC, created_on DESC;

-- View all Help Center FAQs
SELECT 
  id, 
  question, 
  help_center_order, 
  help_center_category,
  "order"
FROM faq
WHERE is_help_center = true
ORDER BY help_center_order ASC, "order" ASC;

-- ============================================
-- ADD ITEMS TO HELP CENTER
-- ============================================

-- Add a single article to Help Center
UPDATE blog_post 
SET 
  is_help_center = true,
  help_center_order = 10,  -- Change this number
  help_center_category = 'Getting Started'  -- Change category
WHERE id = YOUR_ARTICLE_ID;

-- Add a single FAQ to Help Center
UPDATE faq 
SET 
  is_help_center = true,
  help_center_order = 10,  -- Change this number
  help_center_category = 'Common Questions'  -- Change category
WHERE id = YOUR_FAQ_ID;

-- Add multiple articles by slug
UPDATE blog_post 
SET 
  is_help_center = true,
  help_center_order = 10,
  help_center_category = 'Getting Started'
WHERE slug IN ('getting-started', 'account-setup', 'first-steps');

-- Add top 5 newest articles
UPDATE blog_post 
SET 
  is_help_center = true,
  help_center_order = 20,
  help_center_category = 'Latest Updates'
WHERE id IN (
  SELECT id 
  FROM blog_post 
  WHERE display_this_post = true 
    AND organization_id = 'YOUR_ORG_ID'
  ORDER BY created_on DESC 
  LIMIT 5
);

-- Add top 8 FAQs
UPDATE faq 
SET 
  is_help_center = true,
  help_center_order = 10,
  help_center_category = 'Common Questions'
WHERE id IN (
  SELECT id 
  FROM faq 
  WHERE organization_id = 'YOUR_ORG_ID'
  ORDER BY "order" ASC 
  LIMIT 8
);

-- ============================================
-- REMOVE ITEMS FROM HELP CENTER
-- ============================================

-- Remove a specific article
UPDATE blog_post 
SET 
  is_help_center = false,
  help_center_order = 0,
  help_center_category = NULL
WHERE id = YOUR_ARTICLE_ID;

-- Remove a specific FAQ
UPDATE faq 
SET 
  is_help_center = false,
  help_center_order = 0,
  help_center_category = NULL
WHERE id = YOUR_FAQ_ID;

-- Remove all articles from Help Center
UPDATE blog_post 
SET 
  is_help_center = false,
  help_center_order = 0,
  help_center_category = NULL
WHERE is_help_center = true;

-- Remove all FAQs from Help Center
UPDATE faq 
SET 
  is_help_center = false,
  help_center_order = 0,
  help_center_category = NULL
WHERE is_help_center = true;

-- ============================================
-- UPDATE DISPLAY ORDER
-- ============================================

-- Reorder an article (move to first position)
UPDATE blog_post 
SET help_center_order = 1
WHERE id = YOUR_ARTICLE_ID;

-- Reorder multiple articles at once
UPDATE blog_post 
SET help_center_order = CASE id
  WHEN 123 THEN 10
  WHEN 456 THEN 20
  WHEN 789 THEN 30
END
WHERE id IN (123, 456, 789);

-- Increment all orders by 10 (make room for new items)
UPDATE blog_post 
SET help_center_order = help_center_order + 10
WHERE is_help_center = true;

-- ============================================
-- UPDATE CATEGORIES
-- ============================================

-- Change category for an article
UPDATE blog_post 
SET help_center_category = 'Account Management'
WHERE id = YOUR_ARTICLE_ID;

-- Bulk update category for multiple items
UPDATE blog_post 
SET help_center_category = 'Getting Started'
WHERE slug IN ('intro', 'first-steps', 'basics');

-- Rename a category
UPDATE blog_post 
SET help_center_category = 'Account Setup'
WHERE help_center_category = 'Account Management';

UPDATE faq 
SET help_center_category = 'Account Setup'
WHERE help_center_category = 'Account Management';

-- ============================================
-- ANALYTICS & REPORTS
-- ============================================

-- Count Help Center items
SELECT 
  'Articles' as type, 
  COUNT(*) as count 
FROM blog_post 
WHERE is_help_center = true
UNION ALL
SELECT 
  'FAQs' as type, 
  COUNT(*) as count 
FROM faq 
WHERE is_help_center = true;

-- Count by category
SELECT 
  help_center_category, 
  COUNT(*) as count
FROM blog_post
WHERE is_help_center = true
GROUP BY help_center_category
ORDER BY count DESC;

-- Find items without categories
SELECT 
  id, 
  title 
FROM blog_post
WHERE is_help_center = true 
  AND (help_center_category IS NULL OR help_center_category = '');

-- Find duplicate order numbers
SELECT 
  help_center_order, 
  COUNT(*) as count,
  STRING_AGG(title, ', ') as articles
FROM blog_post
WHERE is_help_center = true
GROUP BY help_center_order
HAVING COUNT(*) > 1;

-- ============================================
-- MAINTENANCE
-- ============================================

-- Reset all Help Center settings
UPDATE blog_post 
SET 
  is_help_center = false,
  help_center_order = 0,
  help_center_category = NULL;

UPDATE faq 
SET 
  is_help_center = false,
  help_center_order = 0,
  help_center_category = NULL;

-- Find orphaned items (marked but not published)
SELECT 
  id, 
  title 
FROM blog_post
WHERE is_help_center = true 
  AND display_this_post = false;

-- Clean up orphaned items
UPDATE blog_post 
SET is_help_center = false
WHERE is_help_center = true 
  AND display_this_post = false;
