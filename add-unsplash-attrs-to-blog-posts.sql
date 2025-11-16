-- Migration: Add Unsplash attribution support to blog_posts table
-- This adds unsplash_attribution to the media_config JSONB field

-- The structure will be:
-- media_config: {
--   main_photo: "url",
--   unsplash_attribution: {
--     photographer: "Name",
--     photographer_url: "https://...",
--     photo_url: "https://...",
--     download_location: "https://..."
--   }
-- }

-- No schema changes needed - JSONB is flexible
-- Just documenting the structure for reference

-- Example update query (for testing):
-- UPDATE blog_posts 
-- SET media_config = jsonb_set(
--   COALESCE(media_config, '{}'::jsonb),
--   '{unsplash_attribution}',
--   '{"photographer": "John Doe", "photographer_url": "https://unsplash.com/@johndoe", "photo_url": "https://unsplash.com/photos/xyz", "download_location": "https://api.unsplash.com/photos/xyz/download"}'::jsonb
-- )
-- WHERE id = YOUR_POST_ID;

-- To verify the structure:
-- SELECT id, title, media_config->'unsplash_attribution' as unsplash_attr
-- FROM blog_posts
-- WHERE media_config->'unsplash_attribution' IS NOT NULL;
