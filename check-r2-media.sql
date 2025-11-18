SELECT 
  id,
  product_id,
  video_player,
  video_url,
  thumbnail_url,
  image_url,
  is_video
FROM product_media
WHERE id IN (176, 177)
ORDER BY id;
