# Document Sets Feature - Testing Guide

## Overview
The Document Sets feature allows you to organize multiple blog posts into cohesive documentation series with a master TOC, previous/next navigation, and article ordering.

## Implementation Summary

### ✅ Completed Components

1. **Database Schema** (JSONB in `blog_post.organization_config`)
   - `doc_set`: String identifier for the document set (slug format)
   - `doc_set_order`: Numeric order within the set
   - `doc_set_title`: Human-readable title for the set

2. **API Endpoints**
   - `GET /api/document-sets?organization_id={id}` - Lists all document sets
   - `GET /api/document-sets/{slug}?organization_id={id}` - Returns set with all articles and TOCs

3. **UI Components**
   - **PostEditModal**: Document set selection dropdown + custom input, order field, title field
   - **DocumentSetNavigation**: Master TOC (collapsible) + Previous/Next buttons + Progress indicator

4. **Integration**
   - PostPageClient automatically shows navigation when `post.doc_set` is present
   - Fully themed with primary colors

## Testing Instructions

### Step 1: Create a Document Set

1. **Open the admin panel** (make sure you're logged in as admin)
2. **Create or edit a blog post**
3. **Click "+ More"** to open advanced settings
4. **Scroll to "Document Set" section**
5. **Select "+ Create New Set"** from the dropdown
6. **Enter a set name**, e.g., "Getting Started Guide"
   - This auto-generates a slug like "getting-started-guide"
7. **Set Article Order** to `1`
8. **Save the post**

### Step 2: Add More Articles to the Set

1. **Create/edit another post**
2. **In Document Set section**, select your existing set from dropdown
3. **Set Article Order** to `2` (or next sequential number)
4. **Optionally update Set Display Title** if needed
5. **Save the post**

Repeat for as many articles as you want in the series (recommended: 3-5 articles for testing).

### Step 3: Test Master TOC Navigation

1. **Visit any article** in your document set
2. **Look for the navigation section** below the article content
3. **Verify the features**:
   - ✅ Document set title is displayed
   - ✅ Article count shows correctly (e.g., "5 articles in this series")
   - ✅ Click to expand the Master TOC
   - ✅ All articles are listed in order
   - ✅ Current article is highlighted with "Current" badge
   - ✅ Each article shows its sub-TOC (h2, h3 headings)
   - ✅ Previous/Next buttons appear (when applicable)
   - ✅ Progress indicator shows "Article X of Y"

### Step 4: Test Navigation

1. **Click "Next"** button
   - ✅ Should navigate to the next article in the series
   - ✅ Master TOC should update to highlight the new current article
2. **Click "Previous"** button
   - ✅ Should navigate to the previous article
3. **Click on any article** in the Master TOC
   - ✅ Should navigate directly to that article

### Step 5: Test Edge Cases

1. **First article**: Previous button should not appear
2. **Last article**: Next button should not appear
3. **Single article set**: Only Master TOC appears, no prev/next buttons
4. **Posts without doc_set**: Navigation should not appear

## Features Tested

### ✅ Master TOC
- [x] Collapsible/expandable master TOC
- [x] Shows all articles in the set with correct ordering
- [x] Highlights current article with badge
- [x] Displays sub-TOC for each article (h2, h3, etc.)
- [x] Indentation for sub-headings
- [x] Clickable links to navigate between articles

### ✅ Previous/Next Navigation
- [x] Previous button (when not first article)
- [x] Next button (when not last article)
- [x] Proper article titles displayed
- [x] Hover effects and transitions
- [x] Responsive layout (stacked on mobile, side-by-side on desktop)

### ✅ Visual Design
- [x] Uses primary color theming throughout
- [x] Gradient background for TOC section
- [x] Numbered badges for article order
- [x] Smooth animations and transitions
- [x] Mobile-responsive design

### ✅ Admin Experience
- [x] Dropdown shows existing document sets
- [x] Option to create new set with custom name
- [x] Auto-generates slug from set name
- [x] Order field for article sequencing
- [x] Title field for display name
- [x] Data persists in organization_config

## Example Document Set Structure

```
Getting Started Guide (getting-started-guide)
├── 1. Introduction to MovePlan
│   ├── What is MovePlan?
│   ├── Key Features
│   └── Who Should Use It?
├── 2. Setting Up Your Account
│   ├── Creating an Account
│   ├── Profile Configuration
│   └── Initial Settings
├── 3. Your First Project
│   ├── Creating a Project
│   ├── Adding Team Members
│   └── Setting Milestones
└── 4. Advanced Features
    ├── Custom Workflows
    ├── Integrations
    └── Automation
```

## API Testing

### Test Document Sets List
```bash
curl "http://localhost:3001/api/document-sets?organization_id=YOUR_ORG_ID"
```

Expected response:
```json
[
  {
    "slug": "getting-started-guide",
    "title": "Getting Started Guide",
    "count": 4
  }
]
```

### Test Specific Document Set
```bash
curl "http://localhost:3001/api/document-sets/getting-started-guide?organization_id=YOUR_ORG_ID"
```

Expected response:
```json
{
  "set": "getting-started-guide",
  "title": "Getting Started Guide",
  "articles": [
    {
      "id": "...",
      "title": "Introduction to MovePlan",
      "slug": "introduction-to-moveplan",
      "order": 1,
      "toc": [
        { "level": 2, "text": "What is MovePlan?", "id": "what-is-moveplan" },
        { "level": 2, "text": "Key Features", "id": "key-features" }
      ]
    },
    ...
  ]
}
```

## Known Limitations & Future Enhancements

### Current Implementation (Phase 1 - Hybrid JSONB Approach)
- ✅ Uses JSONB fields in `blog_post` table
- ✅ Articles accessible via regular URLs (`/article-slug`)
- ✅ Master TOC and navigation on individual articles
- ⚠️ No dedicated landing pages for document sets yet

### Future Implementation (Phase 2 - Dedicated Table)
- [ ] Create `document_sets` table with metadata
- [ ] Add set landing pages (`/docs/getting-started-guide`)
- [ ] Change routing to `/set-slug/article-slug`
- [ ] Add set-level metadata (icon, color, description)
- [ ] Set-level permissions and visibility controls
- [ ] Analytics per document set
- [ ] Export entire set as PDF

## Troubleshooting

### Master TOC Not Showing
- ✓ Check if `post.doc_set` field is set
- ✓ Verify `post.organization_id` is present
- ✓ Check browser console for API errors
- ✓ Verify API endpoint returns data

### Articles Not in Order
- ✓ Check `doc_set_order` values in PostEditModal
- ✓ Ensure orders are sequential (1, 2, 3...)
- ✓ Save each post after setting order

### Previous/Next Buttons Missing
- ✓ Check if you're on first/last article (intentional)
- ✓ Verify multiple articles exist in the set
- ✓ Check API response includes multiple articles

### Custom Set Not Appearing in Dropdown
- ✓ Save the first article with the new set name
- ✓ Reload the PostEditModal
- ✓ Check API endpoint returns the new set

## Success Criteria

Your implementation is working correctly when:

1. ✅ You can create a document set with 3+ articles
2. ✅ Master TOC displays all articles in correct order
3. ✅ Each article shows its sub-TOC in the master list
4. ✅ Previous/Next navigation works between articles
5. ✅ Current article is highlighted in Master TOC
6. ✅ Progress indicator shows correct position
7. ✅ All elements use primary color theming
8. ✅ Responsive design works on mobile and desktop
9. ✅ Articles without doc_set don't show navigation
10. ✅ Admin can create new sets and reorder articles

## Next Steps (Phase 2)

After validating this implementation, plan for Phase 2:

1. **Create dedicated `document_sets` table**
2. **Build set landing pages** with overview and full TOC
3. **Implement nested routing** (`/docs/set-slug/article-slug`)
4. **Add set metadata** (icon, color, description, author)
5. **Create set management UI** for admins
6. **Add analytics** per document set
7. **Export functionality** (PDF, Markdown)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API endpoints return expected data
3. Ensure all posts have `organization_id` set
4. Check TypeScript types match database schema
5. Review the conversation summary for implementation details

---

**Implementation Date**: October 31, 2025  
**Version**: Phase 1 (JSONB Hybrid Approach)  
**Status**: ✅ Complete and Ready for Testing
