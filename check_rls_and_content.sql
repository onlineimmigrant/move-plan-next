-- Check RLS policies on blog_post table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'blog_post';

-- Check if content actually exists in database for specific post
SELECT 
  slug,
  title,
  CASE 
    WHEN content IS NULL THEN 'NULL'
    WHEN content = '' THEN 'EMPTY STRING'
    ELSE 'HAS CONTENT (' || LENGTH(content) || ' chars)'
  END as content_status,
  content_type,
  LEFT(content, 200) as content_preview
FROM blog_post
WHERE slug = 'site-constructor';

-- Check all recent posts
SELECT 
  slug,
  title,
  LENGTH(content) as content_length,
  content_type,
  created_on
FROM blog_post
ORDER BY created_on DESC
LIMIT 10;
