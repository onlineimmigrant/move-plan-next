# Blog Post Content Field Empty Issue - Diagnosis

## Problem
The `blog_post.content` field returns empty when fetching, updating, or deleting posts through the API, even though Markdown text displays correctly on the real post page.

## Possible Causes

### 1. Supabase Row Level Security (RLS)
The `content` field might be blocked by RLS policies.

**Check:**
```sql
-- View RLS policies on blog_post table
SELECT * FROM pg_policies WHERE tablename = 'blog_post';

-- Check if content column has specific restrictions
SELECT * FROM information_schema.column_privileges 
WHERE table_name = 'blog_post' AND column_name = 'content';
```

### 2. Field Size Limit
PostgreSQL TEXT fields can be very large, but API responses might be truncated.

**Check:**
```sql
-- Check actual content length in database
SELECT slug, title, LENGTH(content) as content_bytes, 
       pg_column_size(content) as content_size,
       content_type
FROM blog_post 
WHERE slug = 'site-constructor';
```

### 3. Supabase Client SELECT Issue
The `.select('*')` might not include all columns due to configuration.

**Test:**
```javascript
// Try explicit selection
const { data } = await supabase
  .from('blog_post')
  .select('id, slug, title, description, content, content_type')
  .eq('slug', 'site-constructor')
  .single();
```

### 4. Next.js Response Size Limit
Next.js API routes have a default body size limit (4MB for API routes).

**Check:** If content is very large (>1MB), it might be truncated.

### 5. JSON Serialization Issue
Large content might cause JSON.stringify() to fail silently.

## Diagnostic Steps

### Step 1: Check Database Content
Run this SQL query directly in Supabase SQL Editor:

```sql
SELECT 
  slug,
  title,
  CASE 
    WHEN content IS NULL THEN 'NULL'
    WHEN content = '' THEN 'EMPTY'
    ELSE 'HAS DATA (' || LENGTH(content) || ' bytes)'
  END as content_status,
  content_type,
  LEFT(content, 100) as content_preview
FROM blog_post
WHERE slug = 'site-constructor';
```

### Step 2: Check API Response
With the logging added, visit the edit page and check browser console for:
```
📥 Edit page - Post received: {
  hasContent: true/false,
  contentLength: ???,
  contentType: 'markdown'/'html'
}
```

And server console for:
```
🔍 Content field check: {
  hasContent: true/false,
  contentLength: ???,
  contentType: 'markdown'/'html',
  contentPreview: '...'
}
```

### Step 3: Check RLS Policies
```sql
-- Check if SELECT policy allows content field
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
```

### Step 4: Test Direct Supabase Query
In browser console (on any page):
```javascript
// Get supabase client
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_ANON_KEY'
);

// Test query
const { data, error } = await supabase
  .from('blog_post')
  .select('slug, title, content, content_type')
  .eq('slug', 'site-constructor')
  .single();

console.log('Direct query result:', {
  hasContent: !!data?.content,
  contentLength: data?.content?.length,
  error
});
```

## Solution Based on Diagnosis

### If RLS is blocking content:
```sql
-- Add policy to allow reading content
CREATE POLICY "Allow reading content for authenticated users"
ON blog_post
FOR SELECT
TO authenticated
USING (true);
```

### If content is too large:
1. Consider storing content in Supabase Storage instead of database
2. Implement pagination/chunking for very large content
3. Increase Next.js API route limit:

```javascript
// pages/api/posts/[slug].ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '10mb',
  },
};
```

### If SELECT is not including content:
Explicitly select the content field:
```typescript
const { data: postData } = await supabase
  .from('blog_post')
  .select('*, content, content_type') // Explicitly include
  .eq('slug', slug)
  .single();
```

### If it's a serialization issue:
Check for circular references or non-serializable data:
```typescript
try {
  const flattenedPost = flattenBlogPost(postData);
  // Test serialization
  JSON.stringify(flattenedPost);
  return NextResponse.json(flattenedPost);
} catch (error) {
  console.error('Serialization error:', error);
  // Return without content field if it causes issues
  const { content, ...postWithoutContent } = flattenedPost;
  return NextResponse.json({
    ...postWithoutContent,
    contentError: 'Content too large or not serializable'
  });
}
```

## Files Modified for Debugging

1. `/Users/ois/move-plan-next/src/app/api/posts/[slug]/route.ts`
   - Added content field logging before and after flattening

2. `/Users/ois/move-plan-next/src/app/[locale]/admin/edit/[slug]/page.tsx`
   - Added logging when post is received

## Next Steps

1. Check browser console when loading edit page
2. Check server console (terminal running `npm run dev`)
3. Compare the logs to identify where content disappears
4. Run SQL queries to verify database has content
5. Apply appropriate solution based on findings
