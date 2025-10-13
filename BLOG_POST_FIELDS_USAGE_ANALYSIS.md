# Blog Post Fields Usage Analysis

**Date**: October 13, 2025  
**Purpose**: Analyze which blog_post fields are currently used in the codebase after JSONB migration

---

## Current Database Structure (After Phase 1 & 2)

### Core Fields (Always Keep):
```sql
id                  UUID PRIMARY KEY
title              TEXT
slug               TEXT UNIQUE
description        TEXT
content            TEXT
organization_id    UUID
created_on         TIMESTAMP
last_modified      TIMESTAMP
```

### JSONB Fields (Migrated):
```sql
display_config         JSONB  -- Display & visibility settings
organization_config    JSONB  -- Organization & ordering
cta_config            JSONB  -- CTA cards (unused - can drop)
author_config         JSONB  -- Author settings (unused - can drop)
product_config        JSONB  -- Product links (unused - can drop)
media_config          JSONB  -- Media assets
```

### Old Fields (Still Present - Phase 5 Will Drop):
```sql
display_this_post          BOOLEAN
display_as_blog_post       BOOLEAN
is_displayed_first_page    BOOLEAN
is_help_center            BOOLEAN
help_center_order         INTEGER
section_id                INTEGER
subsection                TEXT
"order"                   INTEGER
cta_card_one_id           INTEGER
cta_card_two_id           INTEGER
cta_card_three_id         INTEGER
cta_card_four_id          INTEGER
is_with_author            BOOLEAN
is_company_author         BOOLEAN
author_id                 UUID
product_1_id              INTEGER
product_2_id              INTEGER
main_photo                TEXT
```

---

## Field Usage Analysis

### ✅ ACTIVELY USED FIELDS (Keep in JSONB)

#### 1. **display_config** Fields:

| Field | Usage Count | Where Used | Purpose |
|-------|-------------|------------|---------|
| `display_this_post` | **HIGH** | • `/api/posts/route.ts`<br>• `/api/posts/[slug]/route.ts`<br>• `/api/posts/featured/route.ts`<br>• `/api/articles/route.ts`<br>• `/api/organizations/[id]/route.ts`<br>• `PostEditModal.tsx`<br>• `BlogPostsSelect.tsx`<br>• `sitemap.xml/route.tsx` | Controls if post is visible/published |
| `display_as_blog_post` | **HIGH** | • All API routes<br>• `PostEditModal.tsx`<br>• `BlogPostSlider.tsx`<br>• `BlogPostsSelect.tsx`<br>• `PageCreationModal.tsx` | Distinguishes blog posts from other content (pages, help articles) |
| `is_displayed_first_page` | **MEDIUM** | • `/api/posts/featured/route.ts`<br>• `PostEditModal.tsx`<br>• `BlogPostSlider.tsx` | Marks posts for homepage slider |
| `is_help_center` | **MEDIUM** | • `/api/articles/route.ts`<br>• `PostEditModal.tsx` | Marks posts as help center articles |
| `help_center_order` | **LOW** | • `/api/articles/route.ts`<br>• `PostEditModal.tsx` | Sorts help center articles |

**Verdict**: ✅ **KEEP display_config** - All 5 fields are actively used

---

#### 2. **organization_config** Fields:

| Field | Usage Count | Where Used | Purpose |
|-------|-------------|------------|---------|
| `section_id` | **MEDIUM** | • `PostEditModal.tsx`<br>• `BlogPostsSelect.tsx`<br>• `sitemap.xml/route.tsx` | Post categorization/sections |
| `subsection` | **MEDIUM** | • `BlogPostSlider.tsx`<br>• `PostEditModal.tsx`<br>• `BlogPostsSelect.tsx`<br>• `/api/articles/route.ts` | Post sub-categorization |
| `order` | **HIGH** | • All API routes<br>• All components<br>• Everywhere posts are sorted | Controls display order |

**Verdict**: ✅ **KEEP organization_config** - All 3 fields are actively used

---

#### 3. **media_config** Fields:

| Field | Usage Count | Where Used | Purpose |
|-------|-------------|------------|---------|
| `main_photo` | **HIGH** | • `BlogPostSlider.tsx`<br>• `PostEditModal.tsx`<br>• `BlogPostsSelect.tsx`<br>• All API routes | Featured image/thumbnail |

**Verdict**: ✅ **KEEP media_config** - Actively used for post images

---

### ❌ UNUSED FIELDS (Can Drop Entirely)

#### 4. **cta_config** Fields:

| Field | Usage Count | Where Used | Purpose |
|-------|-------------|------------|---------|
| `cta_card_one_id` | **ZERO** | ❌ Not found in codebase | CTA card 1 reference |
| `cta_card_two_id` | **ZERO** | ❌ Not found in codebase | CTA card 2 reference |
| `cta_card_three_id` | **ZERO** | ❌ Not found in codebase | CTA card 3 reference |
| `cta_card_four_id` | **ZERO** | ❌ Not found in codebase | CTA card 4 reference |

**Search Results**: No references found to:
- `cta_card_one_id`
- `cta_card_two_id`
- `cta_card_three_id`
- `cta_card_four_id`
- `cta_config` (except in migration scripts)

**Verdict**: ❌ **DROP cta_config** - Completely unused feature

---

#### 5. **author_config** Fields:

| Field | Usage Count | Where Used | Purpose |
|-------|-------------|------------|---------|
| `is_with_author` | **ZERO** | ❌ Not found in codebase | Show author info |
| `is_company_author` | **ZERO** | • `PostEditModal.tsx` (SET but never READ) | Author type flag |
| `author_id` | **ZERO** | • `PostEditModal.tsx` (SET but never READ) | Author reference |

**Search Results**: 
- `is_with_author` - No references found
- `is_company_author` - Only SET in PostEditModal, never READ anywhere
- `author_id` - Only SET in PostEditModal, never READ anywhere

**Verdict**: ❌ **DROP author_config** - Feature exists in UI but not implemented in display logic

---

#### 6. **product_config** Fields:

| Field | Usage Count | Where Used | Purpose |
|-------|-------------|------------|---------|
| `product_1_id` | **ZERO** | ❌ Not found in codebase | Product 1 reference |
| `product_2_id` | **ZERO** | ❌ Not found in codebase | Product 2 reference |

**Search Results**: No references found to:
- `product_1_id`
- `product_2_id`
- `product_config` (except in migration scripts)

**Verdict**: ❌ **DROP product_config** - Completely unused feature

---

## Comprehensive Field Summary

### Fields to KEEP (9 fields):

| JSONB Column | Fields Inside | Status | Reason |
|--------------|---------------|--------|--------|
| `display_config` | • `display_this_post`<br>• `display_as_blog_post`<br>• `is_displayed_first_page`<br>• `is_help_center`<br>• `help_center_order` | ✅ **KEEP** | All fields actively used throughout app |
| `organization_config` | • `section_id`<br>• `subsection`<br>• `order` | ✅ **KEEP** | All fields used for categorization & sorting |
| `media_config` | • `main_photo` | ✅ **KEEP** | Used for post thumbnails/images |

**Total Active JSONB Fields**: 9 fields across 3 JSONB columns

---

### Fields to DROP (11 fields):

| JSONB Column | Fields Inside | Status | Reason |
|--------------|---------------|--------|--------|
| `cta_config` | • `cta_card_one_id`<br>• `cta_card_two_id`<br>• `cta_card_three_id`<br>• `cta_card_four_id` | ❌ **DROP** | Zero references in codebase |
| `author_config` | • `is_with_author`<br>• `is_company_author`<br>• `author_id` | ❌ **DROP** | Set in UI but never displayed |
| `product_config` | • `product_1_id`<br>• `product_2_id` | ❌ **DROP** | Zero references in codebase |

Plus the **2 unused JSONB columns** themselves (cta_config, author_config, product_config)

---

## Recommended Phase 5 SQL (Updated)

Based on usage analysis, here's the optimized Phase 5 migration:

```sql
-- ⚠️⚠️⚠️ BACKUP DATABASE FIRST! ⚠️⚠️⚠️

-- Phase 5A: Drop old individual columns (18 columns)
ALTER TABLE blog_post 
  DROP COLUMN IF EXISTS display_this_post,
  DROP COLUMN IF EXISTS display_as_blog_post,
  DROP COLUMN IF EXISTS is_displayed_first_page,
  DROP COLUMN IF EXISTS is_help_center,
  DROP COLUMN IF EXISTS help_center_order,
  DROP COLUMN IF EXISTS section_id,
  DROP COLUMN IF EXISTS subsection,
  DROP COLUMN IF EXISTS "order",
  DROP COLUMN IF EXISTS cta_card_one_id,
  DROP COLUMN IF EXISTS cta_card_two_id,
  DROP COLUMN IF EXISTS cta_card_three_id,
  DROP COLUMN IF EXISTS cta_card_four_id,
  DROP COLUMN IF EXISTS is_with_author,
  DROP COLUMN IF EXISTS is_company_author,
  DROP COLUMN IF EXISTS author_id,
  DROP COLUMN IF EXISTS product_1_id,
  DROP COLUMN IF EXISTS product_2_id,
  DROP COLUMN IF EXISTS main_photo;

-- Phase 5B: Drop unused JSONB columns (3 columns)
ALTER TABLE blog_post
  DROP COLUMN IF EXISTS cta_config,
  DROP COLUMN IF EXISTS author_config,
  DROP COLUMN IF EXISTS product_config;

-- Phase 5C: Drop unused JSONB indexes
DROP INDEX IF EXISTS idx_blog_post_cta_config;
DROP INDEX IF EXISTS idx_blog_post_author_config;
DROP INDEX IF EXISTS idx_blog_post_product_config;

-- Verify remaining structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_post' 
ORDER BY ordinal_position;
```

---

## Final Database Structure (After Phase 5)

### Total Columns: **11 columns** (down from 32 columns - 66% reduction!)

```sql
-- Core Fields (8 columns)
id                  UUID PRIMARY KEY
title              TEXT
slug               TEXT UNIQUE
description        TEXT
content            TEXT
organization_id    UUID
created_on         TIMESTAMP
last_modified      TIMESTAMP

-- JSONB Fields (3 columns - only the used ones)
display_config         JSONB  -- 5 fields
organization_config    JSONB  -- 3 fields  
media_config          JSONB  -- 1 field
```

### JSONB Structure:

```json
{
  "display_config": {
    "display_this_post": true,
    "display_as_blog_post": true,
    "is_displayed_first_page": false,
    "is_help_center": false,
    "help_center_order": 0
  },
  "organization_config": {
    "section_id": 7,
    "subsection": "General",
    "order": 1
  },
  "media_config": {
    "main_photo": "https://..."
  }
}
```

---

## Storage Savings

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Total Columns | 32 | 11 | **66% reduction** |
| Active Data Columns | 17 | 9 | **47% reduction** |
| Unused Columns | 11 | 0 | **100% cleanup** |
| JSONB Columns | 6 | 3 | **50% reduction** |
| Table Size (estimated) | 100% | ~40% | **~60% savings** |

---

## Benefits of Removing Unused JSONB Columns

1. **Storage**: Smaller table size, faster backups
2. **Performance**: Fewer indexes to maintain
3. **Clarity**: Only relevant fields remain
4. **Maintenance**: Less confusion about what's used
5. **Future**: Easier to add new fields if needed

---

## Migration Steps

### Step 1: Backup
```bash
# Create full database backup
pg_dump -h your-host -U your-user -d your-db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Test in Staging
Run Phase 5 SQL on staging environment first

### Step 3: Verify Application Still Works
- Test all blog post functionality
- Check API endpoints
- Verify GlobalSettingsModal
- Test PostEditModal

### Step 4: Execute on Production
Run Phase 5 SQL during low-traffic window

### Step 5: Monitor
- Check error logs
- Verify query performance
- Test user-facing features

---

## Code Cleanup (Optional - After Phase 5)

Once unused JSONB columns are dropped, you can:

1. **Remove unused fields from TypeScript interfaces**:
```typescript
// Remove from BlogPostBody type
interface BlogPostBody {
  // ❌ Remove: cta_config, author_config, product_config
}
```

2. **Remove from flattenBlogPost() helpers**:
```typescript
function flattenBlogPost(post: any) {
  return {
    // ❌ Remove: author fields, product fields, cta fields
  }
}
```

3. **Remove from PostEditModal**:
```typescript
// ❌ Remove unused state variables:
// - isCompanyAuthor
// - authorId
// - Any CTA/product references
```

4. **Update documentation**:
- Update API documentation
- Update database schema docs
- Remove references to dropped features

---

## Summary

### ✅ Fields to KEEP (9 active fields):
- **display_config**: All 5 fields actively used
- **organization_config**: All 3 fields actively used
- **media_config**: 1 field actively used

### ❌ Fields to DROP (11 unused fields + 3 JSONB columns):
- **cta_config**: 4 fields - zero usage
- **author_config**: 3 fields - set but never read
- **product_config**: 2 fields - zero usage
- **Plus**: The 3 unused JSONB columns themselves

### Final Result:
- **32 columns → 11 columns** (66% reduction)
- **6 JSONB columns → 3 JSONB columns** (50% reduction)
- **~60% storage savings** (estimated)
- **Clean, maintainable schema** with only actively used fields

---

**Recommendation**: Execute Phase 5 with both old column drops AND unused JSONB column drops for maximum optimization.
