# 🔍 Markdown Editor Debug - IMMEDIATE TEST

## Test Steps (Do This NOW):

1. **Open the post editor:**
   ```
   http://localhost:3000/en/admin/edit/site-constructor
   ```

2. **Open browser console** (F12 or Cmd+Option+I)

3. **Switch to Markdown mode** (click "Markdown" button)

4. **Type something simple:**
   ```markdown
   ### Test Heading
   ```

5. **Watch console logs** - You should see:
   ```
   📝 [MARKDOWN EDITOR] onChange called: { newLength: 16, preview: "### Test Heading", editorMode: "markdown" }
   ```

6. **Click "Save Draft" button**

7. **Check console logs** - You should see:
   ```
   💾 [HANDLE SAVE] Called with editorMode: markdown
   💾 [HANDLE SAVE] Current state: { markdownContentLength: 16, ... }
   💾 [HANDLE SAVE] Markdown mode - saving: { contentLength: 16, preview: "### Test Heading" }
   💾 [HANDLE SAVE] Final content to save: { contentType: "markdown", contentLength: 16, ... }
   💾 [HANDLE SAVE] Calling onContentChange
   💾 [HANDLE SAVE] Calling onSave with: { contentLength: 16, contentType: "markdown" }
   💾 [SAVE START] Preparing to save post: { ..., contentLength: 16, contentType: "markdown" }
   💾 [SAVE] Calling PATCH: /api/posts/site-constructor
   💾 [SAVE SUCCESS] Post saved
   ```

## What to Check:

### ✅ If You See These Logs:
- `📝 [MARKDOWN EDITOR] onChange` → Editor is capturing changes ✅
- `💾 [HANDLE SAVE] Markdown mode - saving` → Save function is called ✅
- `💾 [SAVE START]` → Parent component received content ✅
- `💾 [SAVE SUCCESS]` → API saved to database ✅

### ❌ If Logs Are Missing:

**Missing `📝 [MARKDOWN EDITOR] onChange`:**
- Problem: Markdown editor not firing onChange
- Check: Are you actually in Markdown mode?

**Missing `💾 [HANDLE SAVE]` logs:**
- Problem: Save button not calling handleSave
- Check: Is the Save Draft button visible/clickable?

**Missing `💾 [SAVE START]`:**
- Problem: onSave callback not working
- Check: Parent component connection issue

**Missing `💾 [SAVE SUCCESS]`:**
- Problem: API call failing
- Check: Network tab for PATCH request errors

## Quick Database Check:

After clicking Save, run this in terminal:

```bash
cd /Users/ois/move-plan-next && node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase
  .from('blog_post')
  .select('slug, content, content_type')
  .eq('slug', 'site-constructor')
  .single()
  .then(({data, error}) => {
    if (error) console.error('Error:', error);
    else console.log('Length:', data?.content?.length, 'Type:', data?.content_type, 'Preview:', data?.content?.substring(0, 100));
  });
"
```

## Expected Result:

After typing "### Test Heading" and clicking Save:
- Console shows all the logs above
- Database query shows: `Length: 16 Type: markdown Preview: ### Test Heading`

## Copy/Paste Your Results Here:

**Console Logs:**
```
[Paste all console output here]
```

**Database Check:**
```
[Paste terminal output here]
```

**What happened?**
- [ ] I see `📝 [MARKDOWN EDITOR] onChange` when typing
- [ ] I see `💾 [HANDLE SAVE]` logs when clicking Save
- [ ] I see `💾 [SAVE SUCCESS]`
- [ ] Database shows the content

**If something is missing, tell me which logs you DON'T see!**
