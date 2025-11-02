# Content Not Saving Issue - ROOT CAUSE FOUND

## The Problem

The database only has 15 bytes for content: `<div>cool</div>`

This means **content is NOT being saved** when you click "Save" in the editor.

## Root Cause Analysis

### What We Know:
1. ✅ Database column has full SELECT/INSERT/UPDATE privileges
2. ✅ API PATCH handler includes content in updateData
3. ✅ PostEditor calls onSave with content
4. ❌ **Content is not reaching the database**

### Most Likely Cause:

The `onContentChange` callback that we modified to only fire during save might not be properly updating the parent component's `content` state before the API call is made.

## The Fix

### Issue in Edit Page Flow:

```typescript
// Current flow:
1. User types in Markdown editor
   → markdownContent state updated
   → onEditorChange() marks unsaved
   → BUT content state NOT updated

2. User clicks Save
   → handleSave() in PostEditor called
   → onContentChange(markdownContent) called
   → parent's setContent() called
   → handleSave() in parent called
   
PROBLEM: There's a race condition - the content state 
might not be updated before the API call is made!
```

### Solution:

We need to ensure the content is passed directly in the save call, not relying on state updates.

## Implementation

### Fix 1: Update handleSave in edit page to accept content parameter

The `handleSave` already accepts `newContent` parameter - this is CORRECT.

### Fix 2: Ensure onSave passes content correctly

PostEditor's `handleSave` already does this correctly at line 2400-2415.

### Fix 3: Check if auto-save is interfering

The auto-save function uses the `content` state which might be stale!

```typescript
// In edit page, line 27-55
const autoSave = useCallback(async () => {
  if (!hasUnsavedChanges) return;
  
  setAutoSaving(true);
  try {
    const response = await fetch(`/api/posts/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug: slugState,
        description,
        content,  // ← THIS IS THE STALE STATE!
        content_type: contentType,
      }),
    });
```

**THIS IS THE BUG!** Auto-save is using stale `content` state because we stopped updating it on every keystroke!

## The Actual Fix

We have two options:

### Option A: Update content state on every keystroke (revert our changes)
This would cause the double-update issue again, but ensure auto-save works.

### Option B: Disable auto-save for editor content, only save manually
Better approach - auto-save for title/description, manual save for content.

### Option C: Track dirty content separately for auto-save
Use a ref to track the latest content for auto-save without triggering re-renders.

## Recommended Solution: Option B (Simplest)

Update the auto-save to NOT include content:

```typescript
const autoSave = useCallback(async () => {
  if (!hasUnsavedChanges) return;
  
  setAutoSaving(true);
  try {
    const response = await fetch(`/api/posts/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug: slugState,
        description,
        // DON'T include content in auto-save
        // content,
        // content_type: contentType,
      }),
    });
    // ...
  }
}, [title, slugState, description, hasUnsavedChanges, slug]);
// Remove content and contentType from dependencies
```

This way:
- Title, slug, description auto-save every 30 seconds
- Content only saves when user clicks "Save Draft" or "Save & View"
- No race conditions or stale state issues

## Testing After Fix

1. Edit a post in Markdown mode
2. Type some content
3. Click "Save Draft"
4. Check terminal for: `🔍 PATCH - Content being saved:`
5. Check database: `SELECT LENGTH(content) FROM blog_post WHERE slug = 'site-constructor'`
6. Should show full content length, not just 15 bytes
