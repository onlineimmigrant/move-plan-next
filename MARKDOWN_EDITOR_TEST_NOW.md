# 🧪 Markdown Editor - Testing Instructions

## ✅ Fixes Applied:

1. **Added `markdownToHtml()` converter** in `converters.ts`
   - Converts markdown syntax to HTML for TipTap
   - Supports H1-H3, bold, italic, code, links, lists, etc.

2. **Fixed mode switching** in `PostEditor.tsx`
   - Markdown → Visual now converts markdown to HTML first
   - TipTap can now properly render markdown content

3. **Fixed initial load** with markdown content
   - Posts with `content_type: 'markdown'` now load correctly
   - Visual mode converts markdown to HTML on load

## 🧪 Test NOW:

### Test 1: Type Markdown and Save

1. **Go to:** http://localhost:3000/en/admin/edit/site-constructor

2. **Switch to Markdown mode** (click "Markdown" button)

3. **Clear existing content and type:**
   ```markdown
   ### Metro
   
   This is a **bold** paragraph with *italic* text.
   
   ## Another Heading
   
   - List item 1
   - List item 2
   ```

4. **Click "Save Draft"**

5. **Check Browser Console** - Should see:
   ```
   💾 [SAVE START] contentType: "markdown", contentLength: ~100
   💾 [SAVE] Calling PATCH: /api/posts/site-constructor
   🔍 PATCH - Content being saved: { contentLength: ~100 }
   💾 [SAVE SUCCESS]
   ```

6. **Reload the page** (F5 or Cmd+R)

7. **Verify**: Content still shows in Markdown mode with exact formatting

### Test 2: Switch to Visual Mode

1. **With markdown content loaded**, click "Visual" button

2. **Check Browser Console** - Should see:
   ```
   🔄 Converting Markdown to HTML for visual editor: {
     markdownLength: ~100,
     htmlLength: ~180,
     markdownPreview: "### Metro...",
     htmlPreview: "<h3>Metro</h3>..."
   }
   ```

3. **Verify Visual Editor**:
   - "Metro" should appear as a large H3 heading (not raw text `### Metro`)
   - "Another Heading" should appear as H2
   - Bold text should be **bold**
   - Italic text should be *italic*
   - List should show bullet points

4. **You can now edit visually** - Add more content, format text, etc.

### Test 3: Switch Back to Markdown

1. **From Visual mode**, click "Markdown" button

2. **Verify**:
   - Content converts back to markdown syntax
   - `### Metro` appears (not `<h3>Metro</h3>`)
   - `**bold**` appears (not `<strong>bold</strong>`)
   - No escape characters like `\#` or `\*\*`

### Test 4: Edit in Visual, Save, Reload

1. **In Visual mode**, add a new heading and paragraph

2. **Click "Save Draft"**

3. **Check console** - Should save as HTML:
   ```
   💾 [SAVE START] contentType: "html"
   ```

4. **Reload page**

5. **Switch to Markdown mode** - Should convert HTML to markdown

### Test 5: Complex Markdown

1. **Switch to Markdown mode**

2. **Type this:**
   ```markdown
   # Main Title
   
   ## Features
   
   We offer:
   - **Professional service** with _expert guidance_
   - ~~Old pricing~~ **New pricing**: $99/month
   - `Technical support` available 24/7
   
   ```javascript
   const example = "code block";
   console.log(example);
   ```
   
   [Visit our website](https://example.com)
   
   ![Company Logo](https://example.com/logo.png)
   
   > This is a blockquote with important information.
   ```

3. **Save and reload**

4. **Switch to Visual** - All formatting should render correctly

5. **Switch back to Markdown** - Syntax should be preserved

## ✅ Expected Results:

### Console Logs You Should See:

**When switching Markdown → Visual:**
```
🔄 Converting Markdown to HTML for visual editor: {
  markdownLength: 123,
  htmlLength: 245,
  markdownPreview: "### Metro\n\nThis is a...",
  htmlPreview: "<h3>Metro</h3><p>This is a..."
}
```

**When saving in Markdown mode:**
```
💾 [SAVE START] Preparing to save post: {
  slug: "site-constructor",
  contentType: "markdown",
  contentLength: 123,
  contentPreview: "### Metro\n\nThis is..."
}
💾 [SAVE] POST data prepared: { content: "123 chars", ... }
💾 [SAVE] Calling PATCH: /api/posts/site-constructor
💾 [SAVE] Response status: 200 OK
💾 [SAVE SUCCESS] Post saved: { slug: "site-constructor", contentLength: 123 }
```

**When loading markdown content:**
```
🔄 Initial load: Converting markdown to HTML for visual editor: {
  markdownLength: 123,
  htmlLength: 245
}
```

### Visual Editor Display:

**Markdown Input:**
```markdown
### Metro
```

**Visual Editor Shows:**
```
Metro        ← Large H3 heading (not raw text)
```

**Markdown Input:**
```markdown
**bold** and *italic*
```

**Visual Editor Shows:**
```
bold and italic        ← Properly formatted
```

## ❌ What Should NOT Happen:

### Before Fix (Broken):
- ❌ Visual editor showed `### Metro` as plain text
- ❌ TipTap didn't understand markdown syntax
- ❌ Mode switching broke content

### After Fix (Working):
- ✅ Visual editor shows rendered H3 heading
- ✅ TipTap properly displays all markdown
- ✅ Mode switching preserves content

## 🐛 If Something Doesn't Work:

### Issue: Content doesn't save
**Solution:**
1. Check browser console for errors
2. Verify PATCH request in Network tab
3. Check terminal for API logs
4. Verify database connection

### Issue: Visual mode shows raw markdown
**Solution:**
1. Check console for conversion logs
2. Verify `🔄 Converting Markdown to HTML` appears
3. Check if htmlPreview shows HTML tags
4. Look for JavaScript errors in console

### Issue: Content lost when switching modes
**Solution:**
1. Check if content is in state before switching
2. Verify no errors in console during mode switch
3. Check if conversion functions are called
4. Verify state updates are happening

### Issue: Escape characters appear
**Solution:**
1. This should NOT happen anymore
2. If it does, check which mode you're switching FROM/TO
3. Verify the conversion direction is correct
4. Check console logs for the conversion process

## 📊 Success Criteria:

All these should work:
- ✅ Type `### Metro` in Markdown mode
- ✅ Click "Save Draft" → Content saves
- ✅ Reload page → Content persists
- ✅ Switch to Visual → Shows rendered H3 (not raw markdown)
- ✅ Edit in Visual → Changes are reflected
- ✅ Switch back to Markdown → Shows markdown syntax
- ✅ No escape characters anywhere
- ✅ All markdown syntax renders correctly
- ✅ Content persists across browser sessions

## 🎯 Quick Verification:

Run these commands to verify database state:

### Check current content:
```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase
  .from('blog_post')
  .select('slug, LENGTH(content) as length, content_type, LEFT(content, 100) as preview')
  .eq('slug', 'site-constructor')
  .single()
  .then(({data}) => console.log(data));
"
```

### Expected output after saving markdown:
```javascript
{
  slug: 'site-constructor',
  length: 123,  // Should be > 50 bytes
  content_type: 'markdown',
  preview: '### Metro\n\nThis is a **bold**...'
}
```

## 📝 Share Results:

After testing, please share:

1. ✅ **What worked** - Which tests passed
2. ❌ **What didn't work** - Which tests failed
3. 📋 **Console logs** - Copy/paste relevant console output
4. 🖼️ **Screenshots** - If visual rendering looks wrong
5. 💾 **Database state** - Run the verification command above

## 🚀 Ready to Test!

The markdown editor should now work perfectly. Let me know if you encounter any issues!
