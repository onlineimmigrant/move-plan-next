-- Find all Pexels video URLs in the database
-- Run these queries to identify where Pexels videos are referenced

-- Check hero_sections table
SELECT id, video_url, video_player
FROM hero_sections
WHERE video_url LIKE '%pexels.com%';

-- Check product_media table
SELECT id, video_url, type
FROM product_media
WHERE video_url LIKE '%pexels.com%';

-- Check template_sections table for video content
SELECT id, type, content
FROM template_sections
WHERE content::text LIKE '%pexels.com%';

-- Check blog_posts for embedded videos
SELECT id, title, content
FROM blog_posts
WHERE content LIKE '%pexels.com%';

-- To remove Pexels URLs from hero_sections:
-- UPDATE hero_sections SET video_url = NULL WHERE video_url LIKE '%pexels.com%';

-- To remove Pexels URLs from product_media:
-- DELETE FROM product_media WHERE video_url LIKE '%pexels.com%' AND type = 'video';
