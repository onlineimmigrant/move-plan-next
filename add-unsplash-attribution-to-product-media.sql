-- Add attrs column to product_media table
-- This stores flexible JSONB metadata including Unsplash attribution

ALTER TABLE public.product_media
ADD COLUMN IF NOT EXISTS attrs JSONB NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.product_media.attrs IS 'Flexible JSONB metadata: unsplash_attribution, tags, etc.';

-- Example data structure for attrs.unsplash_attribution:
-- {
--   "unsplash_attribution": {
--     "photographer": "John Doe",
--     "photographer_url": "https://unsplash.com/@johndoe?utm_source=codedharmony&utm_medium=referral",
--     "photo_url": "https://unsplash.com/photos/abc123?utm_source=codedharmony&utm_medium=referral",
--     "download_location": "https://api.unsplash.com/photos/abc123/download"
--   }
-- }
