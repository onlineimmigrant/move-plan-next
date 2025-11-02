# Markdown Single Line Issue - Debugging Guide

## The Problem

When you:
1. Type markdown content with line breaks in the markdown editor
2. Save the content
3. Reopen the editor

**The content appears all on one line** (inline), removing markdown formatting.

## Diagnosis Steps

### Step 1: Verify Newlines in Editor Before Save

1. Open the markdown editor
2. Type this content:
   ```markdown
   # First Heading
   
   Some paragraph text here.
   
   ## Second Heading
   
   - List item 1
   - List item 2
   ```

3. **Open Browser Console** (F12)
4. In the console, type:
   ```javascript
   document.querySelector('textarea').value
   ```

5. **Check the output** - should show actual newlines as `\n`:
   ```
   "# First Heading\n\nSome paragraph text here.\n\n## Second Heading\n\n- List item 1\n- List item 2"
   ```

✅ **If you see `\n`**: Newlines exist in textarea before save
❌ **If you see no `\n`**: Problem is in the textarea itself

### Step 2: Verify Newlines During Save

1. With content still in editor, **click "💾 Save" button**

2. **Check Console** for log: `💾 [HANDLE SAVE] Markdown mode - saving:`
   ```
   contentLength: 123
   preview: "# First Heading\n\nSome paragraph..."
   ```

3. **Look for** `\n` characters in the preview
   - ✅ **Should see**: `"# First Heading\n\n..."`
   - ❌ **Should NOT see**: `"# First Heading Some paragraph..."` (no `\n`)

4. **Check next log**: `💾 [SAVE START] Preparing to save post:`
   ```
   contentHasNewlines: true
   contentNewlineCount: 7
   contentRawPreview: "\"# First Heading\\n\\nSome paragraph...\""
   ```

   Note: `\\n` (double backslash) in JSON.stringify is NORMAL - it's how JSON represents actual newlines

5. **Check API log** (in terminal where server is running): `🔍 PATCH - Content being saved:`
   ```
   hasNewlines: true
   newlineCount: 7
   rawPreview: "\"# First Heading\\n\\nSome paragraph...\""
   ```

✅ **If hasNewlines: true**: Content is being saved with newlines
❌ **If hasNewlines: false**: Newlines are being stripped before API

### Step 3: Verify Newlines in Database

If you have database access, run:
```sql
SELECT 
  content_type,
  LENGTH(content) as content_length,
  SUBSTRING(content, 1, 100) as content_preview,
  LENGTH(content) - LENGTH(REPLACE(content, E'\n', '')) as newline_count
FROM blog_post 
WHERE slug = 'site-constructor';
```

✅ **Expected**: 
- `content_type`: 'markdown'
- `newline_count`: > 0
- `content_preview`: Should show actual line breaks

❌ **Problem**: 
- `newline_count`: 0
- `content_preview`: All on one line

### Step 4: Verify Newlines When Loading Editor

1. **Reload the edit page** (F5)

2. **Check Console** for: `🎬 Initial content load:`
   ```
   contentType: 'markdown'
   editorMode: 'markdown'
   contentLength: 123
   hasEscapes: false
   ```

3. **Most importantly, in the console type:**
   ```javascript
   // Check the textarea value after load
   document.querySelector('textarea').value
   ```

4. **Examine the output**:
   - ✅ **Good**: `"# First Heading\n\nSome..."`  (has `\n`)
   - ❌ **Bad**: `"# First Heading Some..."`  (no `\n`)
   - 😱 **Very Bad**: `"# First Heading\\n\\nSome..."` (literal backslash-n as text!)

### Step 5: Verify Newlines on Post Page

1. **Navigate to the post page** (e.g., `/site-constructor`)

2. **Check Console** for: `📄 [MARKDOWN RENDER]` logs:
   ```
   Has newlines: true
   Newline count: 7
   Content (raw): "\"# First Heading\\n\\nSome...\""
   ```

3. **Check the page rendering**:
   - ✅ **Good**: Content displays with proper headings, paragraphs, lists
   - ❌ **Bad**: All text appears on one line

## Common Issues and Fixes

### Issue A: Newlines Lost During Save

**Symptom**: Step 2 shows `hasNewlines: false`

**Possible Causes**:
1. Content is being processed/sanitized before save
2. PostEditor is modifying content

**Fix**: Check if there's any `.trim()`, `.replace()`, or sanitization happening in PostEditor's `handleSave`

### Issue B: Newlines Stored as Literal `\n` Text

**Symptom**: Database shows `\n` as text characters, not actual newlines

**Possible Causes**:
1. Double JSON encoding
2. Escaping happening somewhere

**Fix**: Check if content is being `JSON.stringify()`'d twice

### Issue C: Newlines Lost When Loading Editor

**Symptom**: Step 4 shows textarea has no newlines after load

**Possible Causes**:
1. API is returning escaped content
2. Content is being unescaped incorrectly
3. Textarea is processing content

**Fix**: Check API response in Network tab - is content properly formatted?

### Issue D: ReactMarkdown Not Rendering Newlines

**Symptom**: Content HAS newlines but still renders as single line

**Possible Causes**:
1. CSS `white-space` property collapsing newlines
2. ReactMarkdown not configured correctly

**Fix**: 
```tsx
// Check if this CSS is being applied:
<div style={{ whiteSpace: 'pre-wrap' }}>
  <ReactMarkdown ...>
    {content}
  </ReactMarkdown>
</div>
```

## Quick Fix Test

If newlines are being lost, try this temporary fix to diagnose WHERE they're being lost:

### In PostEditor's handleSave:

```typescript
console.log('🔍 Content before save:', {
  length: contentToSave.length,
  hasNewlines: contentToSave.includes('\n'),
  newlineCount: (contentToSave.match(/\n/g) || []).length,
  charCodes: Array.from(contentToSave.substring(0, 50)).map(c => c.charCodeAt(0)),
  // Character code 10 is newline (\n)
  // If you see 92, 110 - that's backslash (92) + 'n' (110) = literal "\n"
});
```

### Expected Character Codes:
- Newline: `10`
- Carriage Return: `13`
- Backslash: `92`
- Letter 'n': `110`

If you see `[..., 92, 110, ...]` instead of `[..., 10, ...]`, it means you have literal `\n` text, not actual newlines!

## Testing Plan

1. **Fresh Start**: 
   - Delete existing content from database
   - Create new post from scratch
   - Type markdown with newlines
   - Save and verify at each step above

2. **Mode Switching Test**:
   - Start in Markdown mode
   - Type content with newlines
   - Switch to Visual mode (should render correctly)
   - Switch back to Markdown mode
   - Check if newlines preserved

3. **Save and Reload Test**:
   - Type content in Markdown mode
   - Save
   - Close browser tab
   - Reopen edit page
   - Check if content still has newlines

## Next Steps Based on Findings

### If newlines ARE in database but NOT in editor after reload:
→ Problem is in the loading/initialization code
→ Check `initialContent` processing in PostEditor

### If newlines are NOT in database:
→ Problem is in save process
→ Check `handleSave` and API route

### If newlines are everywhere but page still renders as single line:
→ Problem is CSS or ReactMarkdown configuration
→ Check prose styling and markdown rendering

---

**Run this test now and report back with the console log outputs!**
