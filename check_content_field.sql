-- Check if content field has data
SELECT slug, title, 
       CASE 
         WHEN content IS NULL THEN 'NULL'
         WHEN content = '' THEN 'EMPTY STRING'
         ELSE 'HAS CONTENT (' || LENGTH(content) || ' chars)'
       END as content_status,
       content_type
FROM blog_post
WHERE slug = 'site-constructor';

-- Also check column exists
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'blog_post' AND column_name IN ('content', 'content_type');
