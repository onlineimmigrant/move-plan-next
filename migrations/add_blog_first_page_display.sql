-- Migration: Add is_displayed_first_page field to blog_post table
-- Purpose: Allow marking blog posts to be featured on the home page

-- Add the column if it doesn't exist
ALTER TABLE blog_post 
ADD COLUMN IF NOT EXISTS is_displayed_first_page BOOLEAN DEFAULT false;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_post_first_page 
ON blog_post(is_displayed_first_page) 
WHERE is_displayed_first_page = true;

-- Add a comment to explain the field
COMMENT ON COLUMN blog_post.is_displayed_first_page IS 'Flag to determine if post should be displayed in the featured slider on home page';

-- Example: Update existing posts to be featured (optional - adjust as needed)
-- UPDATE blog_post 
-- SET is_displayed_first_page = true 
-- WHERE id IN (1, 2, 3); -- Replace with actual post IDs you want to feature
