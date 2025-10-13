# Blog Post Table Optimization Analysis

## Executive Summary

The `blog_post` table has **30+ fields** but most queries only SELECT 9-12 specific fields. Many fields are specialized for specific features (CTA cards, products, help center, FAQ display, author settings). This analysis identifies consolidation opportunities and unused fields.

---

## Complete Field Inventory

### Core Fields (Always Used) ✅
| Field | Type | Usage | Notes |
|-------|------|-------|-------|
| `id` | SERIAL PRIMARY KEY | All queries | Unique identifier |
| `slug` | TEXT UNIQUE | All queries | URL-friendly identifier |
| `title` | TEXT NOT NULL | All queries | Post title |
| `description` | TEXT | Most queries | Short summary |
| `content` | TEXT | Content display | Full article content |

### Display Control Fields (High Usage) ✅
| Field | Type | Usage | Consolidation Candidate |
|-------|------|-------|------------------------|
| `display_this_post` | BOOLEAN | Homepage, listings | → `display_config` JSONB |
| `display_as_blog_post` | BOOLEAN | Blog filtering | → `display_config` JSONB |
| `is_displayed_first_page` | BOOLEAN | Homepage slider | → `display_config` JSONB |

### Organization Fields (Medium Usage) ✅
| Field | Type | Usage | Consolidation Candidate |
|-------|------|-------|------------------------|
| `section_id` | INTEGER FK | Navigation, routing | → `organization_config` JSONB |
| `subsection` | VARCHAR | Sub-categorization | → `organization_config` JSONB |
| `order` | INTEGER | Sorting | → `organization_config` JSONB |

### Media Fields (Medium Usage) ✅
| Field | Type | Usage | Consolidation Candidate |
|-------|------|-------|------------------------|
| `main_photo` | TEXT | Featured image | → `media_config` JSONB |

### Author Fields (Low Usage) ⚠️
| Field | Type | Usage | Consolidation Candidate |
|-------|------|-------|------------------------|
| `is_with_author` | BOOLEAN | Author display toggle | → `author_config` JSONB |
| `is_company_author` | BOOLEAN | Author type | → `author_config` JSONB |
| `author_id` | INTEGER FK | Author reference | → `author_config` JSONB |

### FAQ Integration Fields (Low Usage) ⚠️
| Field | Type | Usage | Notes |
|-------|------|-------|-------|
| `faq_section_is_title` | BOOLEAN | FAQ section display | Specific to FAQ-enabled posts |

### CTA Card Fields (Low Usage) ⚠️
| Field | Type | Usage | Consolidation Candidate |
|-------|------|-------|------------------------|
| `cta_card_one_id` | INTEGER FK | CTA card 1 reference | → `cta_config` JSONB |
| `cta_card_two_id` | INTEGER FK | CTA card 2 reference | → `cta_config` JSONB |
| `cta_card_three_id` | INTEGER FK | CTA card 3 reference | → `cta_config` JSONB |
| `cta_card_four_id` | INTEGER FK | CTA card 4 reference | → `cta_config` JSONB |

### Product Integration Fields (Low Usage) ⚠️
| Field | Type | Usage | Consolidation Candidate |
|-------|------|-------|------------------------|
| `product_1_id` | INTEGER FK | Product 1 reference | → `product_config` JSONB |
| `product_2_id` | INTEGER FK | Product 2 reference | → `product_config` JSONB |

### Help Center Fields (Added via Migration) ⚠️
| Field | Type | Usage | Consolidation Candidate |
|-------|------|-------|------------------------|
| `is_help_center` | BOOLEAN | Help center filtering | → `display_config` JSONB |
| `help_center_order` | INTEGER | Help center sorting | → `display_config` JSONB |

### Metadata Fields (Always Used) ✅
| Field | Type | Usage | Notes |
|-------|------|-------|-------|
| `organization_id` | INTEGER FK | All queries | Tenant isolation |
| `created_on` | TIMESTAMP | Sorting, sitemap | Creation timestamp |
| `last_modified` | TIMESTAMP | Sitemap, change tracking | Update timestamp |

---

## Query Analysis

### Most Common SELECT Patterns

#### 1. **Homepage Slider** (Featured Posts)
```typescript
// /api/posts/featured/route.ts
.select('id, slug, title, description, main_photo, subsection, section_id, organization_id, created_on')
.eq('is_displayed_first_page', true)
```
**Fields Used**: 9

#### 2. **Blog Post Listing** (All Posts)
```typescript
// /api/posts/route.ts
.select('id, slug, title, description, main_photo, display_this_post, display_as_blog_post, subsection, order, section_id, organization_id, created_on')
```
**Fields Used**: 12

#### 3. **Organization Data** (Full Post)
```typescript
// /api/organizations/[id]/route.ts
.select(`
  id, title, slug, description, content, order,
  display_this_post, display_as_blog_post,
  organization_id, created_on, last_modified
`)
```
**Fields Used**: 11

#### 4. **Sitemap** (SEO)
```typescript
// /app/sitemap.xml/route.tsx
.select('slug, last_modified, display_this_post, section_id')
```
**Fields Used**: 4

### Insert/Update Patterns

#### POST (Create New Post)
```typescript
// /api/posts/route.ts - insertData includes:
{
  title, slug, content, description,
  display_this_post, display_as_blog_post,
  created_on, organization_id,
  
  // Optional fields (only if not null):
  main_photo, section_id, subsection,
  is_with_author, is_company_author, faq_section_is_title,
  cta_card_one_id, cta_card_two_id, cta_card_three_id, cta_card_four_id,
  product_1_id, product_2_id
}
```

#### PATCH (Update Existing Post)
```typescript
// /api/posts/[slug]/route.ts - updateData includes:
{
  title?, slug?, description?, content?,
  display_this_post?, display_as_blog_post?,
  main_photo?, section_id?, subsection?,
  is_with_author?, is_company_author?, faq_section_is_title?,
  author_id?, 
  cta_card_one_id?, cta_card_two_id?, cta_card_three_id?, cta_card_four_id?,
  product_1_id?, product_2_id?
}
```

---

## Optimization Opportunities

### 🎯 **Priority 1: Display Configuration JSONB**

Consolidate all display-related boolean flags into a single JSONB field:

```sql
ALTER TABLE blog_post 
ADD COLUMN display_config JSONB DEFAULT '{
  "display_this_post": true,
  "display_as_blog_post": false,
  "is_displayed_first_page": false,
  "is_help_center": false,
  "help_center_order": 0
}'::jsonb;
```

**Fields to Remove After Migration**:
- `display_this_post`
- `display_as_blog_post`
- `is_displayed_first_page`
- `is_help_center`
- `help_center_order`

**Benefit**: Reduce 5 columns to 1 JSONB field ✨

---

### 🎯 **Priority 2: Organization Configuration JSONB**

Consolidate hierarchical organization fields:

```sql
ALTER TABLE blog_post 
ADD COLUMN organization_config JSONB DEFAULT '{
  "section_id": null,
  "subsection": null,
  "order": 0
}'::jsonb;
```

**Fields to Remove After Migration**:
- `section_id`
- `subsection`
- `order`

**Benefit**: Reduce 3 columns to 1 JSONB field ✨

---

### 🎯 **Priority 3: CTA Configuration JSONB**

Consolidate CTA card references into array structure:

```sql
ALTER TABLE blog_post 
ADD COLUMN cta_config JSONB DEFAULT '{
  "cta_cards": []
}'::jsonb;

-- Example data structure:
-- {"cta_cards": [1, 5, 9]} instead of cta_card_one_id=1, cta_card_two_id=5, etc.
```

**Fields to Remove After Migration**:
- `cta_card_one_id`
- `cta_card_two_id`
- `cta_card_three_id`
- `cta_card_four_id`

**Benefit**: Reduce 4 columns to 1 JSONB field + more flexible (support N cards) ✨

---

### 🎯 **Priority 4: Author Configuration JSONB**

Consolidate author-related fields:

```sql
ALTER TABLE blog_post 
ADD COLUMN author_config JSONB DEFAULT '{
  "is_with_author": false,
  "is_company_author": false,
  "author_id": null
}'::jsonb;
```

**Fields to Remove After Migration**:
- `is_with_author`
- `is_company_author`
- `author_id`

**Benefit**: Reduce 3 columns to 1 JSONB field ✨

---

### 🎯 **Priority 5: Product Configuration JSONB**

Consolidate product references into array structure:

```sql
ALTER TABLE blog_post 
ADD COLUMN product_config JSONB DEFAULT '{
  "products": []
}'::jsonb;

-- Example: {"products": [12, 45]} instead of product_1_id=12, product_2_id=45
```

**Fields to Remove After Migration**:
- `product_1_id`
- `product_2_id`

**Benefit**: Reduce 2 columns to 1 JSONB field + more flexible (support N products) ✨

---

### 🎯 **Priority 6: Media Configuration JSONB** (Optional)

If more media fields are planned:

```sql
ALTER TABLE blog_post 
ADD COLUMN media_config JSONB DEFAULT '{
  "main_photo": null,
  "thumbnail": null,
  "gallery": []
}'::jsonb;
```

**Fields to Remove After Migration**:
- `main_photo`

**Benefit**: Future-proof for additional media types ✨

---

### 🎯 **Priority 7: FAQ Configuration** (Keep or JSONB)

Currently only one field: `faq_section_is_title`

**Option A**: Keep as-is (single boolean)
**Option B**: Consolidate into `display_config` if FAQ is considered a display setting

**Recommendation**: Keep separate for clarity, or move to `display_config`

---

## Fields to Delete (Unused/Deprecated) 🗑️

Based on code analysis, check if these fields are used:

| Field | Check | Action |
|-------|-------|--------|
| `help_center_category` | **REMOVED in migration** ✅ | Already deleted |
| Any undocumented fields | Need database schema dump | Verify against actual table |

---

## Migration Impact Summary

### Before Optimization
- **~30 columns** in `blog_post` table
- Wide table with many NULL values for specialized fields
- Difficult to add new optional fields

### After Optimization
- **~15 columns** in `blog_post` table (-50% columns)
- Core fields remain as columns (id, slug, title, description, content, timestamps)
- Grouped configurations in 6 JSONB fields:
  1. `display_config` (5 fields → 1)
  2. `organization_config` (3 fields → 1)
  3. `cta_config` (4 fields → 1)
  4. `author_config` (3 fields → 1)
  5. `product_config` (2 fields → 1)
  6. `media_config` (1+ fields → 1) [optional]

### Benefits
- ✅ Reduced table width (better cache performance)
- ✅ Easier to add new optional fields (just update JSONB)
- ✅ Logical grouping of related fields
- ✅ Same pattern as `header_style` and `footer_style`
- ✅ Backward compatible migration possible
- ✅ JSONB supports indexing with GIN indexes

---

## API Query Impact

### Before (Current)
```typescript
const { data } = await supabase
  .from('blog_post')
  .select('id, slug, title, description, display_this_post, display_as_blog_post, is_displayed_first_page')
```

### After (Optimized)
```typescript
const { data } = await supabase
  .from('blog_post')
  .select('id, slug, title, description, display_config')

// Access nested fields:
const displayThisPost = post.display_config.display_this_post;
const isDisplayedFirstPage = post.display_config.is_displayed_first_page;
```

### Filtering with JSONB
```typescript
// Filter by nested boolean
.eq('display_config->>display_this_post', 'true')

// Filter by nested integer
.eq('display_config->>help_center_order', '1')

// Create GIN indexes for better performance:
CREATE INDEX idx_blog_post_display_config ON blog_post USING GIN (display_config);
```

---

## Recommended Migration Strategy

### Phase 1: Add JSONB Columns (Non-Breaking)
1. Add all 6 JSONB columns with defaults
2. No changes to existing queries
3. Deploy and verify

### Phase 2: Dual-Write Data Migration (Non-Breaking)
1. Create migration script to populate JSONB from existing columns
2. Keep both old and new columns in sync
3. Verify data integrity

### Phase 3: Update API to Read from JSONB (Breaking)
1. Update all queries to use JSONB fields
2. Keep writing to both old and new columns
3. Deploy and test thoroughly

### Phase 4: Stop Writing to Old Columns (Breaking)
1. Remove old column writes from API
2. Only update JSONB fields
3. Monitor for errors

### Phase 5: Drop Old Columns (Breaking)
1. Remove old columns from database
2. Clean up TypeScript interfaces
3. Final verification

### Rollback Plan
- Each phase can be rolled back independently
- Keep old columns until Phase 5
- Dual-write ensures data consistency

---

## Next Steps

1. **Verify Complete Field List**: Dump actual database schema
2. **Check for Unused Fields**: Query database for NULL patterns
3. **Create Migration Scripts**: One per phase
4. **Update TypeScript Types**: Reflect JSONB structure
5. **Update API Queries**: Gradually migrate to JSONB access
6. **Performance Testing**: Compare query performance before/after

---

## Questions for User

1. Are there any other fields in `blog_post` table not covered in this analysis?
2. Should we keep `main_photo` as a column or consolidate into `media_config`?
3. Should `faq_section_is_title` move to `display_config` or stay separate?
4. Do you want a conservative approach (keep more as columns) or aggressive consolidation?
5. What's your preferred timeline for migration? (All at once vs phased?)

