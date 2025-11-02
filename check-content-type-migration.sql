-- Check if content_type column exists in blog_post table
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'blog_post' 
    AND column_name = 'content_type';

-- Check if constraint exists
SELECT 
    constraint_name,
    check_clause
FROM 
    information_schema.check_constraints
WHERE 
    constraint_name = 'blog_post_content_type_check';

-- Check if index exists
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'blog_post' 
    AND indexname = 'idx_blog_post_content_type';

-- Show sample of existing posts
SELECT 
    id,
    title,
    content_type,
    SUBSTRING(content, 1, 50) as content_preview
FROM 
    blog_post
LIMIT 5;
