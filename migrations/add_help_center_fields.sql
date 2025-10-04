-- Migration: Add Help Center Fields to blog_post and faq tables
-- Purpose: Enable selective display of articles and FAQs in Help Center
-- Created: 2025-10-04

-- Add help center fields to blog_post table
ALTER TABLE blog_post 
ADD COLUMN IF NOT EXISTS is_help_center BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS help_center_order INTEGER DEFAULT 0;

-- Add help center fields to faq table
ALTER TABLE faq 
ADD COLUMN IF NOT EXISTS is_help_center BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS help_center_order INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_post_help_center 
ON blog_post(is_help_center, help_center_order) 
WHERE is_help_center = true;

CREATE INDEX IF NOT EXISTS idx_faq_help_center 
ON faq(is_help_center, help_center_order) 
WHERE is_help_center = true;

-- Add comments to document the new fields
COMMENT ON COLUMN blog_post.is_help_center IS 'Flag to determine if article should be displayed in Help Center';
COMMENT ON COLUMN blog_post.help_center_order IS 'Display order in Help Center (lower numbers appear first)';

COMMENT ON COLUMN faq.is_help_center IS 'Flag to determine if FAQ should be displayed in Help Center';
COMMENT ON COLUMN faq.help_center_order IS 'Display order in Help Center (lower numbers appear first)';
