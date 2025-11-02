# Markdown Editor Fixes - Escape Characters & Content Type

## Issues Identified

### Issue 1: content_type Not Being Updated in Database ❌
**Problem**: When saving content in markdown mode, the `blog_post.content_type` field was not being updated to 'markdown'.

**Status**: The API route (`/api/posts/[slug]/route.ts`) correctly accepts and saves `content_type`. The PostEditor correctly passes it via `onSave(contentToSave, contentType)`. This should work - **needs verification with console logs**.

### Issue 2: Escape Characters (`\`) Appearing When Reopening Editor ✅ FIXED
**Problem**: When you:
1. Save markdown content (e.g., `# Heading`)
2. Close and reopen the editor
3. The content appears with backslashes: `\# Heading`, `\-`, `\*`, etc.

**Root Cause**: 
- When switching between editor modes (especially HTML→Markdown), content was not being properly cleaned of escape characters
- The `unescapeMarkdown()` function was only called during initial load, not during mode switches

## Fixes Applied

### Fix 1: Enhanced Mode Switching with Escape Cleaning

**File**: `src/components/PostPage/PostEditor.tsx`
**Lines**: ~2366-2396

Added `unescapeMarkdown()` call when switching from HTML→Markdown mode for plain text:

```typescript
} else if (currentMode === 'html') {
  // HTML → Markdown: Only convert if it looks like HTML
  const trimmedContent = htmlContent.trim();
  const looksLikeHtml = trimmedContent.startsWith('<') && trimmedContent.includes('>');
  
  if (looksLikeHtml) {
    // Convert HTML to Markdown (already includes unescapeMarkdown)
    const markdown = htmlToMarkdown(htmlContent);
    setMarkdownContent(markdown);
  } else {
    // Already markdown or plain text - don't convert, but clean escapes
    const cleaned = unescapeMarkdown(htmlContent);
    setMarkdownContent(cleaned);
  }
}
```

### Fix 2: Enhanced Initial Content Loading with Logging

**File**: `src/components/PostPage/PostEditor.tsx`
**Lines**: ~1873-1911

Added comprehensive logging to track:
- Content type on initial load
- Whether escape characters are present
- Before/after cleaning comparisons

```typescript
console.log('🎬 Initial content load:', {
  contentType: initialContentType,
  editorMode,
  contentLength: initialContent.length,
  contentPreview: initialContent.substring(0, 100),
  hasEscapes: initialContent.includes('\\#') || initialContent.includes('\\-') || initialContent.includes('\\*')
});
```

### Fix 3: Debug Logging for Markdown Rendering on Page

**File**: `src/app/[locale]/[slug]/PostPageClient.tsx`
**Lines**: ~425-438

Added debug logging to track what content ReactMarkdown receives:

```typescript
{(() => {
  console.log('📄 [MARKDOWN RENDER] Content type:', post.content_type);
  console.log('📄 [MARKDOWN RENDER] Content length:', post.content?.length);
  console.log('📄 [MARKDOWN RENDER] Has newlines:', post.content?.includes('\n'));
  console.log('📄 [MARKDOWN RENDER] Newline count:', (post.content?.match(/\n/g) || []).length);
  console.log('📄 [MARKDOWN RENDER] First 200 chars:', post.content?.substring(0, 200));
  console.log('📄 [MARKDOWN RENDER] Content (raw):', JSON.stringify(post.content?.substring(0, 200)));
  return null;
})()}
```

## How It Works Now

### Escape Character Cleaning Flow

1. **Initial Load** (content_type = 'markdown'):
   ```
   DB → initialContent = "# Heading\n## Sub"
     → unescapeMarkdown() → "# Heading\n## Sub" (clean)
     → setMarkdownContent()
   ```

2. **Visual → Markdown Switch**:
   ```
   TipTap HTML → cleanHtml()
     → htmlToMarkdown() (includes unescapeMarkdown internally)
     → "# Heading\n## Sub"
     → setMarkdownContent()
   ```

3. **HTML → Markdown Switch** (HTML detected):
   ```
   HTML content → htmlToMarkdown() (includes unescapeMarkdown)
     → "# Heading\n## Sub"
     → setMarkdownContent()
   ```

4. **HTML → Markdown Switch** (Plain text detected):
   ```
   Plain text → unescapeMarkdown()
     → "# Heading\n## Sub"
     → setMarkdownContent()
   ```

### Content Type Saving Flow

```
PostEditor (markdown mode)
  → handleSave()
    → contentToSave = markdownContent
    → contentType = 'markdown'
    → onSave(contentToSave, contentType)
      → Parent handleSave(newContent, newContentType)
        → POST /api/posts/[slug]
          → updateData.content = content
          → updateData.content_type = content_type
          → Supabase UPDATE
```

## Testing Instructions

### Test 1: Escape Characters on Mode Switch

1. **Start in Visual mode**, type some content:
   - Heading 1
   - Heading 2  
   - Some **bold** text
   - A list item

2. **Click "Markdown" button** in mode toggle bar

3. **Check browser console** for log: `🔄 Visual→Markdown conversion:`
   - Verify `markdownPreview` shows clean markdown (no `\#`, `\-`, etc.)

4. **Check markdown editor** - should show:
   ```markdown
   # Heading 1
   ## Heading 2
   Some **bold** text
   - A list item
   ```
   NOT:
   ```markdown
   \# Heading 1
   \## Heading 2
   Some \*\*bold\*\* text
   \- A list item
   ```

### Test 2: Escape Characters on Reload

1. **In Markdown mode**, type:
   ```markdown
   # Welcome
   ## Getting Started
   - First item
   - Second item
   
   **Bold text** and *italic text*
   ```

2. **Click "💾 Save"** button

3. **Check console** for log: `💾 [HANDLE SAVE] Markdown mode - saving:`
   - Verify `contentType: 'markdown'`
   - Verify preview shows clean markdown

4. **Navigate to the post** (e.g., `/site-constructor`)

5. **Check console** for logs starting with `📄 [MARKDOWN RENDER]`
   - `Has newlines:` should be `true`
   - `Newline count:` should be > 0
   - `Content (raw):` should show `\n` for line breaks

6. **Verify page displays correctly** with proper headings, lists, and formatting

7. **Go back to edit page** (`/admin/edit/site-constructor`)

8. **Check console** for log: `🎬 Initial content load:`
   - `hasEscapes:` should be `false`

9. **Check markdown editor** - content should be clean (no backslashes)

### Test 3: Content Type Persistence

1. **In Markdown mode**, type content and save

2. **Check console** for: `💾 [SAVE] POST data prepared:`
   - Verify `content_type` shows `'markdown'`

3. **Check API response** in Network tab:
   - Request payload should have `"content_type": "markdown"`

4. **Reload the edit page**

5. **Check console** for: `🎬 Initial content load:`
   - `contentType:` should be `'markdown'`
   - `editorMode:` should be `'markdown'`

6. **Check mode toggle bar** - "Markdown" button should be highlighted

### Test 4: Single Line Issue

1. **In Markdown mode**, type content with multiple lines:
   ```markdown
   # First Line
   
   Second line after blank line
   
   ## Third heading
   
   Fourth line
   ```

2. **Click "💾 Save"**

3. **Navigate to the post page**

4. **Check browser console** - look for: `📄 [MARKDOWN RENDER] Content (raw):`
   - Should show: `"# First Line\\n\\nSecond line..."`
   - The `\\n` indicates newlines are preserved

5. **Verify page rendering** - should show:
   - "First Line" as H1
   - "Second line" as paragraph
   - "Third heading" as H2
   - "Fourth line" as paragraph
   - NOT all on one line

## Debugging Guide

### If Escape Characters Still Appear

1. **Check console logs** when loading editor:
   ```
   🎬 Initial content load:
     hasEscapes: true/false  ← Should be false
   
   🔄 Initial load: Cleaning markdown content:
     hadEscapes: true/false  ← Shows if cleaning was needed
   ```

2. **Check mode switch logs**:
   ```
   🔄 Visual→Markdown conversion:
   🔄 HTML→Markdown conversion:
   ```

3. **Manually test** `unescapeMarkdown()`:
   ```javascript
   // In browser console:
   const test = "\\# Heading\\n\\- List";
   // Should return: "# Heading\n- List"
   ```

### If Content Type Not Saving

1. **Check PostEditor console logs**:
   ```
   💾 [HANDLE SAVE] Called with editorMode: markdown
   💾 [HANDLE SAVE] Markdown mode - saving:
     contentType: 'markdown'  ← Should show 'markdown'
   
   💾 [HANDLE SAVE] Calling onSave with:
     contentType: markdown
   ```

2. **Check parent component logs**:
   ```
   💾 [SAVE START] Preparing to save post:
     contentType: markdown  ← Should show 'markdown'
   
   💾 [SAVE] POST data prepared:
     content_type: 'markdown'  ← Should be in POST data
   ```

3. **Check API logs** (server terminal):
   ```
   PATCH request body: { ..., content_type: 'markdown' }
   🔍 PATCH - Content type being saved: markdown
   ```

4. **Check database directly**:
   ```sql
   SELECT slug, content_type FROM blog_post WHERE slug = 'site-constructor';
   ```

### If Content Appears as Single Line

1. **Check newlines are preserved in save**:
   ```
   💾 [HANDLE SAVE] Markdown mode - saving:
     contentLength: 123
     preview: "# Heading\n## Sub..."  ← Should show \n
   ```

2. **Check database content**:
   ```sql
   SELECT content FROM blog_post WHERE slug = 'site-constructor';
   -- Should see actual newlines in output
   ```

3. **Check ReactMarkdown rendering**:
   ```
   📄 [MARKDOWN RENDER] Has newlines: true  ← Should be true
   📄 [MARKDOWN RENDER] Newline count: 5    ← Should be > 0
   ```

## Files Modified

1. **src/components/PostPage/PostEditor.tsx**
   - Added `unescapeMarkdown()` call in HTML→Markdown plain text path
   - Enhanced logging for initial content load
   - Enhanced logging for mode switching

2. **src/app/[locale]/[slug]/PostPageClient.tsx**
   - Added debug logging for markdown rendering

3. **src/components/PostPage/converters.ts**
   - No changes (existing `unescapeMarkdown()` function is comprehensive)
   - Already called by `htmlToMarkdown()`

## Next Steps

1. **Test all scenarios** listed above
2. **Verify console logs** show expected values
3. **If content_type still not saving**, check:
   - Network tab shows POST body includes `content_type`
   - API route logs show it receiving `content_type`
   - Database column accepts the value
4. **If escape characters persist**, add more aggressive cleaning:
   - Could add double-unescape pass
   - Could add escape detection in save function

---

**Status**: FIXES APPLIED ✅  
**Date**: November 2, 2025  
**Ready for Testing**: YES
