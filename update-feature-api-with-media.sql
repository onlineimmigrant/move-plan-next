-- Example queries for fetching features with media

-- 1. Get single feature with all media (ordered)
-- Use this in your API routes
SELECT 
  f.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', fm.id,
        'media_type', fm.media_type,
        'media_url', fm.media_url,
        'thumbnail_url', fm.thumbnail_url,
        'alt_text', fm.alt_text,
        'display_order', fm.display_order,
        'is_primary', fm.is_primary,
        'storage_provider', fm.storage_provider,
        'metadata', fm.metadata
      ) ORDER BY fm.display_order
    ) FILTER (WHERE fm.id IS NOT NULL),
    '[]'::json
  ) as media
FROM feature f
LEFT JOIN feature_media fm ON f.id = fm.feature_id
WHERE f.slug = 'your-feature-slug'
  AND f.organization_id = 'your-org-id'
GROUP BY f.id;

-- 2. Get all features with their primary media only (for feature cards/lists)
SELECT 
  f.*,
  fm.media_url as primary_image_url,
  fm.media_type as primary_media_type
FROM feature f
LEFT JOIN feature_media fm ON f.id = fm.feature_id AND fm.is_primary = true
WHERE f.organization_id = 'your-org-id'
ORDER BY f.order, f.created_at DESC;

-- 3. Get feature with media count (useful for UI indicators)
SELECT 
  f.*,
  COUNT(fm.id) as media_count,
  json_agg(
    json_build_object(
      'id', fm.id,
      'media_type', fm.media_type,
      'media_url', fm.media_url,
      'thumbnail_url', fm.thumbnail_url,
      'display_order', fm.display_order,
      'is_primary', fm.is_primary
    ) ORDER BY fm.display_order
  ) FILTER (WHERE fm.id IS NOT NULL) as media
FROM feature f
LEFT JOIN feature_media fm ON f.id = fm.feature_id
WHERE f.id = 'your-feature-id'
GROUP BY f.id;
