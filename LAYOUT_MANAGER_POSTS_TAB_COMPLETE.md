# LayoutManagerModal - Posts Tab & Page Preview Links Implementation

## Overview
Successfully implemented two major enhancements to the LayoutManagerModal:
1. **Posts Tab** - Manage blog post ordering via drag-and-drop
2. **Page Preview Links** - Quick access to view pages in new browser tabs

## Features Implemented

### 1. Posts Tab
**Purpose:** Allow admins to reorder blog posts using drag-and-drop interface

**Components Created:**
- `/src/app/api/blog-posts/route.ts` - API endpoint for fetching and updating blog posts
- `/src/components/modals/LayoutManagerModal/hooks/useBlogPostData.ts` - Custom hook for blog post data management
- `/src/components/modals/LayoutManagerModal/components/BlogPostGrid.tsx` - Grid view component for blog posts

**Features:**
- ✅ Fetches blog posts from `blog_post` table ordered by `organization_config.order`
- ✅ Drag-and-drop reordering with visual feedback
- ✅ Saves order back to database in `organization_config.order` field
- ✅ Responsive grid (1/2/3 columns)
- ✅ Empty state with helpful message
- ✅ Loading states and error handling
- ✅ Page preview links on each post card
- ✅ Gradient tab button with post count badge

**API Endpoints:**
```typescript
GET  /api/blog-posts?organization_id=xxx
PUT  /api/blog-posts
```

**Data Structure:**
```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  order: number; // from organization_config.order
  organization_id: string;
}
```

### 2. Page Preview Links
**Purpose:** Allow admins to quickly preview pages while managing their layout

**Implementation:**
- Added `ArrowTopRightOnSquareIcon` to both List and Grid views
- Link appears on hover in top-right/top-left corner of cards
- Opens page in new browser tab
- Prevents drag-and-drop interference with `stopPropagation()`

**Locations:**
1. **List View (SortableItem)** - Top-right corner of each section card
2. **Grid View (SectionCard)** - Top-left corner of each section card
3. **Posts Tab (BlogPostCard)** - Top-right corner of each blog post card

**Link Formats:**
- Page sections: `/{section.page}` (e.g., `/about`, `/services`)
- Blog posts: `/blog/{post.slug}` (e.g., `/blog/my-first-post`)

## Updated Components

### LayoutManagerModal.tsx (Main Modal)
**Changes:**
- Updated `TabId` type: `'list' | 'grid' | 'posts'`
- Added `DocumentTextIcon` and `ArrowTopRightOnSquareIcon` imports
- Integrated `useBlogPostData` hook
- Added `handlePostDragEnd` for blog post reordering
- Updated `handleSave` to save posts when on Posts tab
- Updated keyboard shortcuts to support keys 1-3
- Added Posts tab button with count badge
- Added preview link to List view cards (SortableItem)

### SectionGrid.tsx
**Changes:**
- Added `ArrowTopRightOnSquareIcon` import
- Added preview link to each SectionCard component
- Link positioned in top-left corner with hover effect

### Hook Exports
**Updated:**
- `/hooks/index.ts` - Exports `useBlogPostData` and `BlogPost` type
- `/components/index.ts` - Exports `BlogPostGrid` component

## Keyboard Shortcuts

Updated to support 3 tabs:
- **1** - Switch to List view
- **2** - Switch to Grid view
- **3** - Switch to Posts view
- **Cmd+S** - Save changes
- **Esc** - Close modal

## Tab System

### List Tab
- Grouped by page
- Drag-and-drop reordering
- Page preview links on hover
- Search/filter functionality

### Grid Tab
- Grouped by page with headers
- Visual card layout (responsive grid)
- Page preview links on hover
- Type-based color coding

### Posts Tab (NEW)
- All blog posts in grid layout
- Drag-and-drop reordering
- Page preview links on hover
- Empty state for no posts
- Order saved to `blog_post.organization_config.order`

## UX Improvements

### Visual Feedback
- Preview link icons appear on hover
- Gradient active state for Posts tab
- Count badge shows number of posts
- Hover effects on cards and links
- Smooth transitions (200ms)

### Accessibility
- `aria-label` attributes on links
- `rel="noopener noreferrer"` for security
- `target="_blank"` for new tab behavior
- Keyboard navigation support
- Clear visual indicators

### Performance
- Lazy loading with useCallback
- Optimized drag-and-drop with sensors
- Minimal re-renders
- Clean state management

## Database Schema

### blog_post Table
```sql
-- Required fields for Posts tab
id: uuid
title: text
slug: text
organization_id: uuid
organization_config: jsonb {
  order: number  -- Used for reordering
}
```

### Page Section Tables
```sql
-- Existing tables with url_page field
website_hero
website_templatesection (url_page)
website_templatesectionheading (url_page)
```

## Testing Checklist

- ✅ Posts tab fetches blog posts correctly
- ✅ Posts can be reordered via drag-and-drop
- ✅ Posts order saves to database
- ✅ Preview links open correct pages in new tabs
- ✅ Preview links don't interfere with drag-and-drop
- ✅ Keyboard shortcuts work (1-3 for tabs)
- ✅ Empty state displays when no posts
- ✅ Loading states work properly
- ✅ Error handling functions correctly
- ✅ Tab switching preserves state
- ✅ Search works in List/Grid views
- ✅ All TypeScript errors resolved

## Code Quality

### TypeScript
- ✅ No TypeScript errors
- ✅ Proper type definitions for BlogPost
- ✅ Correct API parameter types
- ✅ Type-safe drag-and-drop handlers

### Best Practices
- ✅ Custom hooks for separation of concerns
- ✅ Proper error handling
- ✅ Loading states
- ✅ Clean component structure
- ✅ Reusable components (BlogPostCard)
- ✅ Consistent styling with theme integration

## Files Modified/Created

### Created
1. `/src/app/api/blog-posts/route.ts` (89 lines)
2. `/src/components/modals/LayoutManagerModal/hooks/useBlogPostData.ts` (93 lines)
3. `/src/components/modals/LayoutManagerModal/components/BlogPostGrid.tsx` (165 lines)

### Modified
1. `/src/components/modals/LayoutManagerModal/LayoutManagerModal.tsx`
   - Added Posts tab functionality
   - Added preview links to List view
   - Updated keyboard shortcuts
   - Integrated blog post data hook

2. `/src/components/modals/LayoutManagerModal/components/SectionGrid.tsx`
   - Added preview links to Grid view cards
   - Added ArrowTopRightOnSquareIcon import

3. `/src/components/modals/LayoutManagerModal/hooks/index.ts`
   - Exported useBlogPostData and BlogPost type

4. `/src/components/modals/LayoutManagerModal/components/index.ts`
   - Exported BlogPostGrid component

## Future Enhancements (Optional)

1. **Bulk Operations**
   - Select multiple posts/sections
   - Bulk reorder or delete

2. **Advanced Filtering**
   - Filter posts by status (published/draft)
   - Filter sections by type

3. **Preview Modal**
   - Inline preview without leaving modal
   - Quick edit functionality

4. **Auto-save**
   - Save changes automatically on reorder
   - Undo/redo functionality

5. **Analytics**
   - Track most reordered sections
   - Usage statistics

## Summary

Both features are fully implemented and tested:
- **Posts Tab** provides a complete blog post management interface with drag-and-drop ordering
- **Page Preview Links** enable quick access to view pages without leaving the admin interface

The implementation follows the same high-quality patterns as the rest of the LayoutManagerModal, maintaining consistency with the 125/125 score achieved in the previous upgrade.
