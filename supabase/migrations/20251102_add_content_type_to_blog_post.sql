-- Migration: Add content_type column to blog_post table
-- Date: 2025-11-02
-- Description: Add content_type column to support Markdown and HTML content formats

-- Add content_type column with default 'html' for backward compatibility
ALTER TABLE public.blog_post 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'html';

-- Add check constraint to ensure only valid content types
ALTER TABLE public.blog_post
ADD CONSTRAINT blog_post_content_type_check 
CHECK (content_type IN ('html', 'markdown'));

-- Add comment to document the column
COMMENT ON COLUMN public.blog_post.content_type IS 
'Content format type: html (default) or markdown. Determines how content is rendered on the frontend.';

-- Create index for content_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_blog_post_content_type 
ON public.blog_post USING btree (content_type) 
TABLESPACE pg_default;

-- Update existing rows to have 'html' content type (already set by default, but explicit for clarity)
UPDATE public.blog_post 
SET content_type = 'html' 
WHERE content_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.blog_post 
ALTER COLUMN content_type SET NOT NULL;
