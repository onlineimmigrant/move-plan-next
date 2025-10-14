# Layout Manager Modal - Page-Specific Sections Issue

**Date**: October 14, 2025  
**Status**: ⚠️ Architectural Limitation Identified  

---

## 🔍 ISSUE IDENTIFIED

**Problem**: Layout Manager Modal displays ALL sections from the entire site (organization-wide), not just the sections for the current page.

**Current Behavior**:
- Opens Layout Manager from any page
- Shows ALL hero sections, template sections, and heading sections for the entire organization
- Cannot filter by current page
- User sees unrelated sections from other pages

**Expected Behavior**:
- Opens Layout Manager from a specific page
- Shows ONLY sections that belong to the current page
- Can reorder sections within that page context
- Different pages can have different section orders

---

## 🏗️ CURRENT DATABASE ARCHITECTURE

### Tables Involved:

1. **`website_hero`**
   - `id` (primary key)
   - `organization_id` (foreign key)
   - `display_order` (integer)
   - ❌ **NO `page_id` field**

2. **`website_templatesection`**
   - `id` (primary key)
   - `organization_id` (foreign key)
   - `order` (integer)
   - ❌ **NO `page_id` field**

3. **`website_templatesectionheading`**
   - `id` (primary key)
   - `organization_id` (foreign key)
   - `order` (integer)
   - ❌ **NO `page_id` field**

### Current Relationship:
```
organization (1) ──→ (many) sections
```

All sections belong to an organization, NOT to specific pages.

---

## ⚠️ WHY THIS IS A PROBLEM

1. **No Page Context**: Sections are shared across the entire site
2. **Global Ordering**: All sections have a single, site-wide order
3. **Cannot Differentiate**: Can't tell which sections belong to which page
4. **Reordering Affects All Pages**: Changing order affects the entire site

### Example Scenario:

**Home Page** should have:
- Hero Section #1
- Brands Section #2
- Pricing Plans Section #3

**About Page** should have:
- Hero Section #4
- Team Section #5
- History Section #6

**Current System**: All 6 sections show in Layout Manager from any page, all mixed together.

---

## 💡 PROPOSED SOLUTIONS

### Option 1: Add `page_id` Field (Recommended)

**Database Migration**:
```sql
-- Add page_id to website_hero
ALTER TABLE website_hero
ADD COLUMN page_id UUID REFERENCES website_page(id) ON DELETE CASCADE;

-- Add page_id to website_templatesection
ALTER TABLE website_templatesection
ADD COLUMN page_id UUID REFERENCES website_page(id) ON DELETE CASCADE;

-- Add page_id to website_templatesectionheading
ALTER TABLE website_templatesectionheading
ADD COLUMN page_id UUID REFERENCES website_page(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_hero_page ON website_hero(page_id);
CREATE INDEX idx_template_page ON website_templatesection(page_id);
CREATE INDEX idx_heading_page ON website_templatesectionheading(page_id);
```

**New Relationship**:
```
organization (1) ──→ (many) pages (1) ──→ (many) sections
```

**API Changes Required**:
```typescript
// /api/page-layout?organization_id=xxx&page_id=yyy
export async function GET(request: NextRequest) {
  const organization_id = searchParams.get('organization_id');
  const page_id = searchParams.get('page_id'); // NEW

  // Fetch hero sections for THIS PAGE
  const { data: hero } = await supabase
    .from('website_hero')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('page_id', page_id) // NEW
    .maybeSingle();

  // Similar for other tables...
}
```

**Benefits**:
- ✅ Page-specific section management
- ✅ Each page can have its own layout
- ✅ Clear ownership of sections
- ✅ Better organization

**Drawbacks**:
- ❌ Requires database migration
- ❌ Existing data needs page_id assignment
- ❌ Breaking change to current architecture

---

### Option 2: Use URL Pattern Matching (Workaround)

Keep current architecture, but use section metadata to determine which page it belongs to.

**Add `page_slug` or `url_pattern` field**:
```sql
ALTER TABLE website_templatesection
ADD COLUMN page_slug TEXT;

-- Examples:
-- page_slug = 'home' → shows on homepage
-- page_slug = 'about' → shows on /about page
-- page_slug = 'pricing' → shows on /pricing page
```

**API Changes**:
```typescript
// Filter by page_slug instead of page_id
const { data: sections } = await supabase
  .from('website_templatesection')
  .select('*')
  .eq('organization_id', organization_id)
  .eq('page_slug', current_page_slug);
```

**Benefits**:
- ✅ Simpler migration
- ✅ No need for page table foreign keys
- ✅ Flexible URL matching

**Drawbacks**:
- ❌ String matching less reliable than foreign keys
- ❌ No referential integrity
- ❌ Manual slug management

---

### Option 3: Use Section Tags/Categories (Alternative)

Add a many-to-many relationship through tags.

**New Tables**:
```sql
CREATE TABLE section_page_mapping (
  section_id UUID NOT NULL,
  section_type TEXT NOT NULL, -- 'hero', 'template', 'heading'
  page_id UUID REFERENCES website_page(id),
  display_order INTEGER,
  PRIMARY KEY (section_id, section_type, page_id)
);
```

**Benefits**:
- ✅ Sections can appear on multiple pages
- ✅ Different order per page
- ✅ Most flexible

**Drawbacks**:
- ❌ Most complex to implement
- ❌ Additional join queries
- ❌ More maintenance overhead

---

## 🎯 RECOMMENDED APPROACH

### **Option 1: Add `page_id` Field**

This is the cleanest, most maintainable solution. It follows database normalization principles and provides clear ownership.

### Implementation Steps:

1. **Create `website_page` table** (if doesn't exist):
```sql
CREATE TABLE IF NOT EXISTS website_page (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES website_organizations(id),
  slug TEXT NOT NULL, -- 'home', 'about', 'pricing', etc.
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);
```

2. **Add `page_id` to section tables** (migration above)

3. **Migrate existing data**:
```sql
-- Create default "home" page for each organization
INSERT INTO website_page (organization_id, slug, title)
SELECT DISTINCT organization_id, 'home', 'Home Page'
FROM website_hero
WHERE organization_id IS NOT NULL;

-- Assign all existing sections to "home" page
UPDATE website_hero
SET page_id = (
  SELECT id FROM website_page
  WHERE website_page.organization_id = website_hero.organization_id
  AND slug = 'home'
);

-- Similar for other tables...
```

4. **Update API routes** (as shown above)

5. **Update Layout Manager Modal**:
```typescript
// Pass current page ID to modal
const currentPageId = await getCurrentPageId(pathname);
openLayoutManagerModal(orgId, currentPageId);

// Update context to fetch page-specific sections
async fetchPageLayout(organizationId: string, pageId: string) {
  const response = await fetch(
    `/api/page-layout?organization_id=${organizationId}&page_id=${pageId}`
  );
  // ...
}
```

---

## 🚧 TEMPORARY WORKAROUND

Until the database migration is complete, we can:

1. **Add page detection in Layout Manager**:
```typescript
// Get current page from URL
const pathname = usePathname();
const currentPage = pathname === '/' ? 'home' : pathname.slice(1);

// Filter sections client-side (not ideal, but works)
const filteredSections = sections.filter(section => {
  // Check if section metadata indicates it belongs to this page
  return section.data?.page_slug === currentPage;
});
```

2. **Add info message to Layout Manager**:
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
  <p className="text-sm text-amber-900">
    ⚠️ <strong>Note:</strong> Currently showing all sections for this organization.
    Page-specific filtering coming soon.
  </p>
</div>
```

---

## 📋 ACTION ITEMS

### Immediate (Quick Fix):
- [ ] Add warning message to Layout Manager
- [ ] Document current limitation
- [ ] Plan database migration

### Short Term (1-2 weeks):
- [ ] Design `website_page` table schema
- [ ] Create database migration scripts
- [ ] Test migration with sample data
- [ ] Update API routes
- [ ] Update Layout Manager Modal
- [ ] Update context providers

### Long Term (1 month):
- [ ] Implement page management UI
- [ ] Add page creation/editing
- [ ] Migrate all existing sections
- [ ] Deploy to production
- [ ] Update documentation

---

## 🔗 RELATED FILES

- `/src/components/modals/LayoutManagerModal/LayoutManagerModal.tsx`
- `/src/components/modals/LayoutManagerModal/context.tsx`
- `/src/app/api/page-layout/route.ts`
- Database migration files (to be created)

---

## 💬 DISCUSSION POINTS

1. **Do we need a `website_page` table?**
   - Currently sections are organization-wide
   - Pages might be implicit (URL-based)
   - Need to clarify the page concept

2. **Should sections be reusable across pages?**
   - Option 1: One section, one page (simpler)
   - Option 3: Many-to-many (more flexible)

3. **How to handle existing data?**
   - All current sections → "home" page?
   - Manual assignment?
   - Smart detection based on content?

---

**Status**: Awaiting decision on implementation approach  
**Next Step**: Discuss with team and choose solution (Option 1 recommended)
