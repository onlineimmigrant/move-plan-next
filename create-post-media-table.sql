-- Create post_media table for media carousel functionality
-- Similar to product_media but for blog posts

CREATE TABLE IF NOT EXISTS post_media (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES blog_post(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_video BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Video fields
  video_url TEXT,
  video_player TEXT CHECK (video_player IN ('youtube', 'vimeo', 'pexels', 'r2')),
  
  -- Image fields
  image_url TEXT,
  thumbnail_url TEXT,
  
  -- Attribution and metadata
  attrs JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_media_type CHECK (
    (is_video = TRUE AND video_url IS NOT NULL) OR
    (is_video = FALSE AND image_url IS NOT NULL)
  )
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_order ON post_media(post_id, "order");

-- Enable RLS
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access
CREATE POLICY "Public can view post media"
  ON post_media
  FOR SELECT
  USING (true);

-- RLS Policies - Authenticated users can manage their post media
CREATE POLICY "Authenticated users can insert post media"
  ON post_media
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update post media"
  ON post_media
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete post media"
  ON post_media
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_post_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_post_media_updated_at_trigger
  BEFORE UPDATE ON post_media
  FOR EACH ROW
  EXECUTE FUNCTION update_post_media_updated_at();

COMMENT ON TABLE post_media IS 'Media items (images and videos) for blog post carousels';
COMMENT ON COLUMN post_media.post_id IS 'Reference to the post';
COMMENT ON COLUMN post_media."order" IS 'Display order in the carousel';
COMMENT ON COLUMN post_media.is_video IS 'Whether this media item is a video';
COMMENT ON COLUMN post_media.video_player IS 'Video platform: youtube, vimeo, pexels, or r2';
COMMENT ON COLUMN post_media.attrs IS 'JSON metadata including attribution info for Unsplash, Pexels, etc.';
