-- Check what media exists for products
SELECT 
  pm.id,
  pm.product_id,
  p.product_name,
  pm.is_video,
  pm.video_player,
  pm.video_url,
  pm.image_url,
  pm.thumbnail_url,
  pm."order"
FROM product_media pm
JOIN product p ON p.id = pm.product_id
WHERE pm.organization_id = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3'
  AND pm.is_video = true
ORDER BY pm.product_id, pm."order";
