-- Migration: Remove unused help_center_category field
-- Purpose: Clean up unused category field from blog_post and faq tables
-- Created: 2025-10-04

-- Remove help_center_category from blog_post table
ALTER TABLE blog_post 
DROP COLUMN IF EXISTS help_center_category;

-- Remove help_center_category from faq table
ALTER TABLE faq 
DROP COLUMN IF EXISTS help_center_category;
