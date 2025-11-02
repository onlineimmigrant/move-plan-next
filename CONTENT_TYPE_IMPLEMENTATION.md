# Content Type Implementation Summary

## What Was Implemented

### 1. Editor Mode Based on Content Type
- **PostEditor** now respects `initialContentType` prop
- If `content_type` is 'markdown' → Opens in Markdown mode
- If `content_type` is 'html' or undefined → Opens in Visual/HTML mode

### 2. Automatic Content Type Detection on Save
- **Visual mode** → Saves with `content_type: 'html'`
- **HTML mode** → Saves with `content_type: 'html'`
- **Markdown mode** → Saves with `content_type: 'markdown'`

### 3. Single Update Button
- Removed separate Save buttons from each editor mode
- Only the "Update" button in page header saves changes
- Update button uses current editor mode to determine content_type

### 4. Content Loading
- Edit page waits for data to load before rendering PostEditor
- Uses `contentLoaded` flag to ensure `initialContentType` is available
- PostEditor remounts when `contentType` changes (via key prop)

## Key Files Modified

### `/src/app/[locale]/admin/edit/[slug]/page.tsx`
- Added `contentLoaded` state flag
- Conditional rendering: only shows PostEditor after data loads
- Key prop on PostEditor forces remount on contentType change
- Changed from PATCH to PUT method

### `/src/components/PostPage/PostEditor.tsx`
- Updated `onContentChange` to pass both content and contentType
- All editor operations now call `onContentChange(content, contentType)`
- Removed separate Save button from mode toggle bar
- Added `immediatelyRender: false` to fix SSR hydration issues

### `/src/app/api/posts/[slug]/route.ts`
- Added PUT handler (alias for PATCH)
- Already includes `content_type` in SELECT queries
- Already handles `content_type` in update operations

## How It Works

### Opening a Post
```
1. User navigates to /admin/edit/[slug]
2. Page fetches post data from API
3. Sets contentType from post.content_type (or 'html' default)
4. Sets contentLoaded = true
5. PostEditor renders with initialContentType
6. Editor initializes in correct mode
```

### Editing and Saving
```
1. User types in any editor mode
2. onChange → onContentChange(newContent, contentType)
3. Parent updates both content and contentType states
4. User clicks Update button
5. handleSave() uses current content and contentType states
6. PUT /api/posts/[slug] with content_type in body
7. Database updated
```

## Testing

To test if it works:

1. **Check database** - Verify a post has `content_type: 'markdown'`:
   ```sql
   SELECT slug, content_type FROM blog_post WHERE slug = 'your-post-slug';
   ```

2. **Open post** - Navigate to `/admin/edit/your-post-slug`
   - Should open in Markdown mode if content_type is 'markdown'
   - Should open in Visual mode if content_type is 'html' or null

3. **Edit and save** - Type in Markdown mode and click Update
   - Check database again - content_type should remain 'markdown'

4. **Switch modes** - Switch to Visual mode and click Update
   - Check database - content_type should change to 'html'

## Troubleshooting

If editor always opens in Visual mode:
- Check that API returns `content_type` field
- Check browser Network tab for `/api/posts/[slug]` response
- Verify `contentLoaded` is being set to true
- Check that `initialContentType` prop is not undefined

If content_type doesn't save:
- Check Network tab for PUT request body
- Verify `content_type` is in the request
- Check server logs for API route
- Verify database column exists and is updatable
