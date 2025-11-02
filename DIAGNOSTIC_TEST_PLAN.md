## Diagnostic Test Plan

### Test 1: Check if content exists in database
Run in Supabase SQL Editor:
```sql
SELECT 
  slug,
  title,
  LENGTH(content) as content_bytes,
  pg_column_size(content) as content_total_size,
  content_type,
  LEFT(content, 100) as preview
FROM blog_post
WHERE slug = 'site-constructor';
```

**Expected Result**: Should show content_bytes > 0

---

### Test 2: Check if API receives content from database
Check terminal logs when visiting edit page. Should see:
```
🔍 Content field check: {
  hasContent: true,
  contentLength: XXXX,
  ...
}
```

**If this shows hasContent: false** → Database query issue
**If this shows hasContent: true** → API is getting content

---

### Test 3: Check if API flattening preserves content
Terminal should also show:
```
🔍 After flattening: {
  hasContent: true,
  contentLength: XXXX,
  ...
}
```

**If flattening shows hasContent: false** → Issue in flattenBlogPost()
**If flattening shows hasContent: true** → Issue is in JSON response

---

### Test 4: Check if client receives content
Browser console should show:
```
📥 Edit page - Post received: {
  hasContent: true,
  contentLength: XXXX,
  ...
}
```

**If client shows hasContent: false** → Issue is in network transfer/serialization
**If client shows hasContent: true** → Issue is in how editor initializes

---

## Possible Issues & Fixes

### Issue 1: PostgREST Response Size Limit
**Symptom**: Content exists in DB, API logs show content, but client receives truncated response

**Fix**: Use Supabase Storage for large content or chunk responses

### Issue 2: RLS Policy Blocking
**Symptom**: Database has content, but Supabase query returns empty

**Fix**: Adjust RLS policies (though your column privileges look good)

### Issue 3: JSON Serialization
**Symptom**: API logs show content, but response fails

**Fix**: Check for circular references or non-JSON data

### Issue 4: Next.js Response Size
**Symptom**: Very large content (>4MB) gets truncated

**Fix**: Add response limit config to route

---

## Immediate Actions

1. Visit: http://localhost:3000/admin/edit/site-constructor
2. Check Terminal for: `🔍 Content field check` and `🔍 After flattening`
3. Check Browser Console for: `📥 Edit page - Post received`
4. Run SQL queries in Supabase
5. Report back which logs show `hasContent: true` vs `false`

This will pinpoint exactly where content is being lost!
