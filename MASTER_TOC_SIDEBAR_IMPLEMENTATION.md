# Master TOC Sidebar Implementation

## ✅ Implementation Complete

### What Was Built

Replaced the standard left sidebar TOC with a **Master TOC** for articles that belong to document sets. The Master TOC displays:

1. **Document Set Title** with article count
2. **All Articles** in the set (numbered, ordered)
3. **Each Article's Sub-TOC** (nested, collapsible)
4. **Current Article Highlighting** with badge
5. **Navigation** to articles and specific headings

### Component Created

**`MasterTOC.tsx`** - New sidebar component
- Location: `/src/components/PostPage/MasterTOC.tsx`
- Replaces standard TOC when post belongs to document set
- Features:
  - Collapsible/expandable articles
  - Numbered article badges
  - Current article highlighting
  - Nested sub-TOC with indentation
  - Click article → navigate to article
  - Click heading (current article) → scroll to heading
  - Click heading (other article) → navigate to article with hash
  - Primary color theming
  - Loading skeleton
  - Mobile responsive

### Integration Points

**PostPageClient.tsx** - Updated to conditionally render:
```typescript
{post.doc_set && post.organization_id ? (
  <MasterTOC
    currentSlug={post.slug}
    docSet={post.doc_set}
    organizationId={post.organization_id}
    handleScrollTo={handleScrollTo}
  />
) : (
  <TOC toc={toc} handleScrollTo={handleScrollTo} />
)}
```

- **Desktop (Left Sidebar)**: Shows Master TOC for doc sets, regular TOC otherwise
- **Mobile (Below Content)**: Shows Master TOC for doc sets, regular TOC otherwise
- **Bottom Navigation**: DocumentSetNavigation (Previous/Next) always shows for doc sets

### Visual Structure

```
Left Sidebar (for document set articles):
┌─────────────────────────────────┐
│ 📚 GETTING STARTED GUIDE        │
│ 3 articles                      │
├─────────────────────────────────┤
│ ▶ ① Introduction to MovePlan   │
│                                 │
│ ▼ ② Setting Up Your Account    │ ← Current (highlighted)
│     └─ Creating an Account      │ ← Click to scroll
│     └─ Profile Configuration    │
│     └─ Initial Settings         │
│                                 │
│ ▶ ③ Your First Project         │
└─────────────────────────────────┘
```

### Navigation Behavior

#### Current Article
- **Article title**: Bold, highlighted background, "Current" badge
- **Sub-headings**: Click to scroll within the current article
- **Auto-expanded**: Current article is expanded by default

#### Other Articles
- **Article title**: Click to navigate to that article
- **Sub-headings**: Click to navigate to article with hash (`/article-slug#heading-id`)
- **Collapsible**: Click chevron to expand/collapse sub-TOC

### Styling Features

- ✅ Primary color theming throughout
- ✅ Numbered badges (colored for current article)
- ✅ Hover effects on all interactive elements
- ✅ Smooth expand/collapse animations
- ✅ Indentation for nested headings (h2, h3, h4)
- ✅ Loading skeleton during data fetch
- ✅ Border accent using primary color
- ✅ Current article badge in primary color

### Technical Features

- ✅ Fetches document set data from API
- ✅ Handles loading and error states
- ✅ Manages expanded/collapsed state
- ✅ Differentiates current vs. other articles
- ✅ Supports both internal scrolling and navigation
- ✅ TypeScript type safety
- ✅ Responsive design

### Behavior Summary

| Element | Current Article | Other Articles |
|---------|----------------|----------------|
| Article Title | Navigate to article | Navigate to article |
| Sub-heading | Scroll to heading | Navigate with hash |
| Expand/Collapse | Click chevron | Click chevron |
| Initial State | Auto-expanded | Collapsed |
| Highlighting | Yes (background + badge) | No |

### User Experience Flow

1. **User opens an article** in a document set
2. **Left sidebar shows Master TOC** with all articles
3. **Current article is highlighted** and expanded
4. **User can**:
   - Click other article titles to navigate
   - Click sub-headings to scroll (current) or navigate (others)
   - Expand/collapse articles to see their structure
   - See their position in the series
5. **Mobile users** see the same Master TOC below content
6. **Bottom navigation** provides Previous/Next buttons

### Files Modified

1. **Created**: `/src/components/PostPage/MasterTOC.tsx` (225 lines)
2. **Modified**: `/src/app/[locale]/[slug]/PostPageClient.tsx`
   - Added MasterTOC import
   - Updated desktop sidebar to conditionally render
   - Updated mobile TOC to conditionally render

### Testing Checklist

- [ ] Create a document set with 3+ articles
- [ ] Each article should have multiple h2/h3 headings
- [ ] Visit first article in set
  - [ ] Master TOC appears in left sidebar
  - [ ] Current article is expanded and highlighted
  - [ ] Other articles are collapsed
  - [ ] Click to expand another article
  - [ ] Click sub-heading in current article → scrolls
  - [ ] Click sub-heading in other article → navigates with hash
  - [ ] Click other article title → navigates
- [ ] Visit middle article in set
  - [ ] Master TOC shows all articles
  - [ ] Current article is highlighted
  - [ ] Previous/Next navigation at bottom
- [ ] Visit article NOT in document set
  - [ ] Standard TOC appears (not Master TOC)
- [ ] Test on mobile
  - [ ] Master TOC appears below article content
  - [ ] All functionality works same as desktop

### Benefits

1. **Better Context**: Users see the full documentation structure
2. **Easier Navigation**: Jump between articles and headings
3. **Clear Position**: Visual indicator of current location
4. **Flexible**: Expand only the articles you need
5. **Consistent**: Same experience desktop and mobile
6. **Smart**: Auto-expands current article
7. **Progressive**: Standard TOC still works for non-set articles

### Next Steps (Optional Enhancements)

- [ ] Add "Collapse All / Expand All" toggle
- [ ] Remember expanded state in localStorage
- [ ] Add search/filter for large document sets
- [ ] Add progress indicator (% read)
- [ ] Add estimated reading time per article
- [ ] Add keyboard navigation shortcuts

---

**Status**: ✅ Complete and ready for testing  
**Server**: Running on http://localhost:3001  
**Test**: Create a document set and visit any article to see the Master TOC in action!
