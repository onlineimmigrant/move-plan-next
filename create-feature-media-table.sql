-- Migration: Add feature_media table for media carousel support
-- Similar to product_media table structure for consistency

-- Create feature_media table
CREATE TABLE IF NOT EXISTS public.feature_media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  feature_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url text NOT NULL,
  thumbnail_url text NULL, -- For video thumbnails
  alt_text text NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_primary boolean NULL DEFAULT false, -- Mark primary media for feature card
  storage_provider text NULL DEFAULT 'r2', -- 'r2', 'unsplash', 'youtube', etc.
  metadata jsonb NULL, -- For additional media metadata (dimensions, duration, etc.)
  organization_id uuid NULL,
  CONSTRAINT feature_media_pkey PRIMARY KEY (id),
  CONSTRAINT feature_media_feature_id_fkey FOREIGN KEY (feature_id) 
    REFERENCES feature (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT feature_media_organization_id_fkey FOREIGN KEY (organization_id) 
    REFERENCES organizations (id) ON UPDATE CASCADE ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feature_media_feature_id 
  ON public.feature_media USING btree (feature_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_feature_media_organization 
  ON public.feature_media USING btree (organization_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_feature_media_display_order 
  ON public.feature_media USING btree (feature_id, display_order) TABLESPACE pg_default;

-- Enable RLS (Row Level Security)
ALTER TABLE public.feature_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth setup)
CREATE POLICY "Allow public read access to feature_media"
  ON public.feature_media
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to manage feature_media for their organization"
  ON public.feature_media
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Optional: Migrate existing feature_image data to feature_media
-- This will create a media record for each feature that has a feature_image
INSERT INTO public.feature_media (feature_id, media_type, media_url, is_primary, display_order, organization_id)
SELECT 
  id,
  'image' as media_type,
  feature_image as media_url,
  true as is_primary,
  0 as display_order,
  organization_id
FROM public.feature
WHERE feature_image IS NOT NULL AND feature_image != '';

-- After migration is successful, you can optionally drop the feature_image column
-- ALTER TABLE public.feature DROP COLUMN feature_image;
-- Or keep it for backward compatibility and mark as deprecated

COMMENT ON TABLE public.feature_media IS 'Stores media (images/videos) for features, similar to product_media';
COMMENT ON COLUMN public.feature_media.metadata IS 'JSONB field for storing additional metadata like {width, height, duration, unsplash_attribution, etc.}';
