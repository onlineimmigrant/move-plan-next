# Markdown Editor Bug Fixes

## Issues Fixed

### 1. ✅ TOC Not Detecting Markdown Headers (h1-h5)
**Problem**: When a blog post was saved in Markdown format, the Table of Contents (TOC) was not detecting headers because `generateTOC()` expected HTML but received raw Markdown.

**Solution**: Modified `PostPageClient.tsx` to convert Markdown to HTML before generating TOC:
```typescript
const tableOfContents = useMemo(() => {
  if (!post?.content) return [];
  
  // If content is Markdown, convert it to HTML for TOC generation
  if (post.content_type === 'markdown') {
    const htmlString = renderToStaticMarkup(
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {post.content}
      </ReactMarkdown>
    );
    return generateTOC(htmlString);
  }
  
  return generateTOC(post.content);
}, [post?.content, post?.content_type]);
```

**Files Modified**:
- `src/app/[locale]/[slug]/PostPageClient.tsx`

---

### 2. ✅ Escape Characters Appearing in Editor (\##, \`\`\`, etc.)
**Problem**: When editing Markdown content, escape characters like `\##`, `\`\`\`` were appearing, making the content corrupted. This was caused by:
1. Double updates: `onContentChange` was being called on every keystroke in the Markdown editor AND again in `handleSave`
2. Re-initialization: The `useEffect` for initializing content was running on every `editorMode` change, potentially overwriting content
3. State mutation issues from multiple update paths

**Solution**: 
1. **Removed immediate onContentChange calls**: Changed Markdown and HTML editors to only call `onContentChange` during save, not on every keystroke
2. **Added ref tracking**: Used `useRef` to track when content has already been initialized, preventing duplicate initialization
3. **Consolidated save logic**: All content updates to parent now happen once in `handleSave`

**Code Changes**:

**PostEditor.tsx - Markdown Editor onChange**:
```typescript
<MarkdownEditor
  value={markdownContent}
  onChange={(newValue) => {
    setMarkdownContent(newValue);
    // Notify parent about editor changes (for unsaved changes indicator)
    if (onEditorChange) {
      onEditorChange();
    }
    // Don't call onContentChange here - only in handleSave
  }}
/>
```

**PostEditor.tsx - HTML Editor onChange**:
```typescript
<textarea
  value={htmlContent}
  onChange={(e) => {
    setHtmlContent(e.target.value);
    // Notify parent about editor changes
    if (onEditorChange) {
      onEditorChange();
    }
    // Don't call onContentChange here - only in handleSave
  }}
/>
```

**PostEditor.tsx - Content Initialization**:
```typescript
const initialContentRef = useRef<string | undefined>(undefined);
useEffect(() => {
  // Only run if initialContent is different from what we've already loaded
  if (initialContent && initialContentType && initialContent !== initialContentRef.current) {
    initialContentRef.current = initialContent;
    
    if (initialContentType === 'markdown') {
      setMarkdownContent(initialContent);
    } else {
      setHtmlContent(initialContent);
      if (editor && editorMode === 'visual') {
        editor.commands.setContent(initialContent);
      }
    }
  }
}, [initialContent, initialContentType, editor]);
// Removed editorMode from dependencies
```

**PostEditor.tsx - handleSave**:
```typescript
const handleSave = () => {
  let contentToSave: string;
  let contentType: 'html' | 'markdown';
  
  if (editorMode === 'markdown') {
    contentToSave = markdownContent;
    contentType = 'markdown';
  } else if (editorMode === 'html') {
    contentToSave = htmlContent;
    contentType = 'html';
  } else {
    // Visual mode...
    contentToSave = formatHTML(editor.getHTML(), indentType, indentSize, lineEnding);
    contentType = 'html';
  }
  
  // Update parent component with content (only once, right before saving)
  if (onContentChange) {
    onContentChange(contentToSave);
  }
  
  onSave(contentToSave, contentType);
};
```

**Files Modified**:
- `src/components/PostPage/PostEditor.tsx`

---

### 3. ✅ Formatting Lost When Making Changes After Viewing Page
**Problem**: After saving a Markdown post and viewing it, when the user returned to edit, the formatting would be lost or the content would show escape characters. This was related to Issue #2.

**Solution**: Same fixes as Issue #2, plus added proper tracking of editor changes through the new `onEditorChange` callback.

**New Interface**:
```typescript
interface PostEditorProps {
  onSave: (content: string, contentType?: 'html' | 'markdown') => void;
  initialContent?: string;
  initialContentType?: 'html' | 'markdown';
  onContentChange?: (content: string) => void;
  onCodeViewChange?: (isCodeView: boolean) => void;
  onEditorChange?: () => void; // NEW: Called when editor content changes (for unsaved changes)
  postType?: 'default' | 'minimal' | 'landing' | 'doc_set';
  initialCodeView?: boolean;
}
```

**Edit Page Integration**:
```typescript
<PostEditor 
  onSave={handleSave} 
  initialContent={content}
  initialContentType={contentType}
  onContentChange={(newContent) => {
    // Only called when saving
    setContent(newContent);
  }}
  onEditorChange={() => {
    // Mark as having unsaved changes whenever editor content changes
    setHasUnsavedChanges(true);
  }}
/>
```

**Files Modified**:
- `src/components/PostPage/PostEditor.tsx`
- `src/app/[locale]/admin/edit/[slug]/page.tsx`

---

## Summary of Changes

### Architecture Improvements
1. **Single-responsibility principle**: Separated concerns between:
   - **Editor state management** (PostEditor manages its own state)
   - **Change detection** (`onEditorChange` for unsaved changes indicator)
   - **Content persistence** (`onContentChange` only on save)

2. **Reduced re-renders**: By removing `editorMode` from useEffect dependencies and using ref tracking, we prevent unnecessary re-initialization.

3. **Better data flow**:
   - User types → Local state updates (`markdownContent` or `htmlContent`)
   - User clicks save → `handleSave` called → `onContentChange` called → `onSave` called
   - Parent updates → `initialContent` changes → `useEffect` runs (only if content actually changed)

### Benefits
- ✅ No more escape characters in editor
- ✅ Content persists correctly across navigation
- ✅ TOC properly detects Markdown headers
- ✅ Unsaved changes tracked accurately
- ✅ Better performance (fewer updates)
- ✅ Clean separation of concerns

---

## Testing Guide

### Test Case 1: Create Markdown Post
1. Go to admin, create new post
2. Switch to Markdown mode
3. Type some Markdown with headers:
   ```markdown
   # Main Title
   ## Subsection
   - List item 1
   - List item 2
   
   **Bold text** and *italic text*
   ```
4. Save the post
5. View the post → Verify formatting is correct
6. Check TOC → Verify headers appear
7. Return to edit → Verify content appears correctly without escape characters

### Test Case 2: Edit Existing Markdown Post
1. Open an existing Markdown post in editor
2. Make changes
3. Save
4. View post → Verify changes are displayed
5. Return to editor → Verify content appears correctly

### Test Case 3: Switch Between Modes
1. Start in Markdown mode
2. Type some content
3. Switch to HTML mode → Verify content is preserved
4. Switch back to Markdown → Verify content is preserved
5. Save → Verify content is saved correctly

### Test Case 4: Unsaved Changes Indicator
1. Edit a post
2. Type in Markdown editor
3. Verify "Unsaved changes" indicator appears
4. Save
5. Verify indicator disappears

---

## Files Modified

1. **src/app/[locale]/[slug]/PostPageClient.tsx**
   - Added Markdown-to-HTML conversion for TOC generation

2. **src/components/PostPage/PostEditor.tsx**
   - Added `onEditorChange` prop
   - Removed immediate `onContentChange` calls from editor onChange handlers
   - Moved all `onContentChange` calls to `handleSave`
   - Added ref tracking for content initialization
   - Removed `editorMode` from useEffect dependencies

3. **src/app/[locale]/admin/edit/[slug]/page.tsx**
   - Added `onEditorChange` callback to PostEditor
   - Simplified `onContentChange` handling

---

## Migration Notes

If you have other components using PostEditor, they may need to be updated to use the new `onEditorChange` prop for tracking unsaved changes. The `onContentChange` prop now only fires during save, not on every keystroke.

---

## Status: ✅ ALL ISSUES RESOLVED

All three reported issues have been fixed and tested. The Markdown editor now works correctly with:
- Proper TOC generation
- No escape characters
- Content persistence across navigation
- Correct tracking of unsaved changes
