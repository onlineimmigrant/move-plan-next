-- Check what blog posts exist and their media_config
SELECT id, title, slug, 
       media_config,
       media_config->'unsplash_attribution' as unsplash_attr
FROM blog_post 
ORDER BY created_on DESC 
LIMIT 5;
