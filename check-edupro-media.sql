SELECT 
  id,
  product_id,
  is_video,
  video_player,
  LEFT(video_url, 80) as video_url_preview,
  LEFT(image_url, 80) as image_url_preview,
  "order"
FROM product_media
WHERE product_id = 216
ORDER BY "order";
