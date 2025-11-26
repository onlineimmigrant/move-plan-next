-- Add translations JSONB field to blog_post table
-- Structure: { "locale_code": { "title": "...", "description": "...", "content": "..." } }

ALTER TABLE public.blog_post 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient translation queries
CREATE INDEX IF NOT EXISTS idx_blog_post_translations 
ON public.blog_post USING gin (translations) 
TABLESPACE pg_default;

-- Add comment for documentation
COMMENT ON COLUMN public.blog_post.translations IS 
'Translations organized by locale code. Structure: {"es": {"title": "...", "description": "...", "content": "..."}, "fr": {...}}';

-- Example usage queries:

-- Get Spanish translation of title:
-- SELECT translations->'es'->>'title' FROM blog_post WHERE id = 1;

-- Get all French translations:
-- SELECT translations->'fr' FROM blog_post WHERE id = 1;

-- Check if Spanish translation exists:
-- SELECT translations ? 'es' FROM blog_post WHERE id = 1;

-- Get all available translation locales:
-- SELECT jsonb_object_keys(translations) FROM blog_post WHERE id = 1;
