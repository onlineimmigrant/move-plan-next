# Markdown Editor Issues - Debug Plan

## User Report:
1. ✅ Visual editor `<h2>Start</h2>` → Correctly converts to `## Start` in Markdown mode
2. ❌ Typing `### Metro` in Markdown mode → Doesn't work (not saved/converted)

## Root Causes Identified:

### Issue 1: Mode Switching Logic Problem
**Location**: `PostEditor.tsx` lines 2310-2370

**Current Flow Visual → Markdown:**
```typescript
if (currentMode === 'visual') {
  // Visual → Markdown: Convert HTML to Markdown
  const editorHtml = cleanHtml(editor.getHTML());
  const markdown = htmlToMarkdown(editorHtml);
  setMarkdownContent(markdown);
}
```
✅ This works - explains why `<h2>Start</h2>` becomes `## Start`

**Current Flow Markdown → Visual:**
```typescript
else if (currentMode === 'markdown') {
  // Markdown → Visual: We need to render markdown to HTML first
  // For now, just load the markdown as-is (TipTap will try to parse it)
  const htmlFromMarkdown = markdownContent;
  editor.commands.setContent(htmlFromMarkdown);
}
```
❌ **PROBLEM**: This sets markdown DIRECTLY to TipTap without converting!
- TipTap expects HTML, not Markdown
- `### Metro` is treated as plain text, not a heading
- No markdown-to-HTML conversion happening

### Issue 2: Save Flow When in Markdown Mode
**Location**: `PostEditor.tsx` lines 2400-2450 (handleSave)

**Current Save Logic:**
```typescript
if (editorMode === 'markdown') {
  contentToSave = markdownContent;
  contentType = 'markdown';
}
```
✅ This saves the markdown content correctly
✅ Content type is set correctly

**But the problem is:**
- When you switch from Markdown back to Visual
- The markdown isn't converted to HTML
- TipTap can't render markdown natively

### Issue 3: Missing Markdown-to-HTML Converter
**Location**: `converters.ts`

**Current State:**
```typescript
export function markdownToHtml(markdown: string): string {
  // This is a placeholder - actual conversion happens in the component
  return markdown; // ❌ DOES NOTHING!
}
```

**We have:**
- ✅ `htmlToMarkdown()` - Works perfectly (using Turndown)
- ❌ `markdownToHtml()` - Placeholder function, doesn't convert

**Need:**
- A proper markdown-to-HTML converter for TipTap
- Should use the same libraries as the preview (remark/rehype)

## Solutions:

### Solution 1: Add Proper Markdown-to-HTML Conversion

**Install Required:**
```bash
npm install remark remark-html remark-gfm unified
```

**Update converters.ts:**
```typescript
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);
    
  return String(result);
}
```

### Solution 2: Fix Mode Switching (Markdown → Visual)

**Update PostEditor.tsx switchEditorMode:**
```typescript
else if (currentMode === 'markdown') {
  // Markdown → Visual: Convert markdown to HTML first
  const htmlFromMarkdown = await markdownToHtml(markdownContent);
  editor.commands.setContent(htmlFromMarkdown);
}
```

### Solution 3: Fix Initial Load with Markdown Content

**Update PostEditor.tsx initialization:**
```typescript
useEffect(() => {
  if (initialContentType === 'markdown' && initialContent) {
    // Load markdown content and convert to HTML for visual editor
    const convertMarkdown = async () => {
      const html = await markdownToHtml(initialContent);
      editor.commands.setContent(html);
    };
    convertMarkdown();
  }
}, [initialContent, initialContentType]);
```

## Testing Steps:

### Test 1: Markdown Editing
1. Switch to Markdown mode
2. Type: `### Metro`
3. Click Save Draft
4. Check console logs - should show markdown being saved
5. Reload page
6. Should see "Metro" as H3

### Test 2: Mode Switching
1. In Markdown mode, type: `## Hello World`
2. Switch to Visual mode
3. Should see a rendered H2 heading
4. Switch back to Markdown
5. Should still show `## Hello World`

### Test 3: Content Persistence
1. Edit in Markdown: `### Test\n\nParagraph text`
2. Save
3. Close tab
4. Reopen editor
5. Content should display correctly in both modes

## Files to Modify:

1. **src/components/PostPage/converters.ts**
   - Add proper `markdownToHtml()` implementation
   - Test with various markdown syntax

2. **src/components/PostPage/PostEditor.tsx**
   - Fix Markdown → Visual mode switching (line ~2315)
   - Fix initial load for markdown content (line ~1860)
   - Make switchEditorMode async if needed

3. **package.json**
   - Add: `remark`, `remark-html`, `unified` dependencies

## Expected Console Output After Fix:

**Typing in Markdown:**
```
[MarkdownEditor] onChange called
[PostEditor] setMarkdownContent: "### Metro"
[PostEditor] onEditorChange called
```

**Clicking Save:**
```
💾 [SAVE START] contentType: "markdown", contentLength: 9
💾 [SAVE] Calling PATCH: /api/posts/site-constructor
🔍 PATCH - Content being saved: "### Metro"
💾 [SAVE SUCCESS]
```

**Switching to Visual:**
```
[PostEditor] Switching markdown → visual
[PostEditor] Converting markdown to HTML
[PostEditor] HTML result: "<h3>Metro</h3>"
[TipTap] setContent called with HTML
```

## Alternative: Use react-markdown for Conversion

If adding unified/remark server-side is too heavy, we can use ReactDOMServer:

```typescript
import ReactDOMServer from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function markdownToHtml(markdown: string): string {
  const html = ReactDOMServer.renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {markdown}
    </ReactMarkdown>
  );
  return html;
}
```

This reuses the exact same conversion we use for preview!
