-- Rollback Migration: Remove content_type column from blog_post table
-- Date: 2025-11-02
-- Description: Rollback migration to remove content_type column and related constraints

-- Drop index
DROP INDEX IF EXISTS public.idx_blog_post_content_type;

-- Drop check constraint
ALTER TABLE public.blog_post
DROP CONSTRAINT IF EXISTS blog_post_content_type_check;

-- Drop column
ALTER TABLE public.blog_post
DROP COLUMN IF EXISTS content_type;
